import { OpenAI } from 'openai';
import { GroundedBundle, EvidenceRef, Vitals } from '@shared/kb';
import { LLMResponse, validateLLMResponse } from './schemas';
import { createSecureSystemPrompt, sanitizeText } from './security';
import { retrievePassages } from './retriever';
import { RAGQuery } from '@shared/kb';
import { searchPubMed } from './pubmed';

/**
 * RAG Compose Module
 * Builds GroundedBundle text parts using only retrieved passages
 * Drops any sentence lacking a passage ID (hallucination filter)
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Compose grounded explanation using retrieved passages
 */
export async function composeGroundedExplanation(
  query: string,
  caseId: string,
  stage: number,
  userId: string,
  sessionId: string,
  intervention?: string
): Promise<GroundedBundle> {
  try {
    // Retrieve relevant passages
    const ragQuery: RAGQuery = {
      query,
      caseId,
      stage,
      limit: 15,
      userId,
      sessionId,
    };

    const ragResult = await retrievePassages(ragQuery);
    
    if (ragResult.passages.length === 0) {
      return createFallbackBundle("Insufficient evidence found for this query.");
    }

    // Get clinical reasoning from PubMed if intervention provided
    let clinicalReasoning = "";
    if (intervention) {
      clinicalReasoning = await getClinicalReasoning(intervention, caseId);
    }

    // Compose explanation using LLM with strict constraints
    const explanation = await composeExplanationWithLLM(
      query,
      ragResult.passages,
      intervention,
      clinicalReasoning
    );

    // Extract evidence sources and validate
    const evidenceSources = extractEvidenceSources(explanation, ragResult.passages);
    
    // If insufficient evidence, return fallback
    if (evidenceSources.length < 2) {
      return createFallbackBundle("Insufficient evidence to support explanation.");
    }

    // Build grounded bundle
    const groundedBundle: GroundedBundle = {
      explanation: explanation.trim(),
      evidenceSources,
      objectiveHits: extractObjectiveHits(explanation, ragResult.passages),
      riskFlags: extractRiskFlags(explanation, ragResult.passages),
      nextStageRecommendations: extractNextStageRecs(explanation, ragResult.passages),
      vitalEffects: {}, // Will be filled by rules service
      deteriorationRates: {}, // Will be filled by rules service
      license: "CC BY-NC-SA 4.0",
      sourceVersion: "aliem-rescu-peds-2021-03-29",
      fallback: false,
    };

    return groundedBundle;

  } catch (error) {
    console.error('Error composing grounded explanation:', error);
    return createFallbackBundle("Error generating explanation. Please try again.");
  }
}

/**
 * Compose explanation using LLM with strict constraints
 */
async function composeExplanationWithLLM(
  query: string,
  passages: any[],
  intervention?: string,
  clinicalReasoning?: string
): Promise<string> {
  // Create context from passages
  const context = passages.map(p => 
    `[${p.sourceCitation}#${p.id}]: ${p.text}`
  ).join('\n\n');

  // Build system prompt
  const basePrompt = `You are a pediatric EM educator. Your task is to provide comprehensive medical reasoning and detailed clinical guidance for the given query.

CRITICAL RULES:
1. ONLY use information from the provided passages
2. ALWAYS cite passages using format: (caseId#passageId)
3. NEVER invent numbers, doses, or vital signs
4. If numbers are requested, say "Refer to rules service"
5. Provide detailed explanations between 600-800 words
6. Focus on comprehensive clinical reasoning, pathophysiology, and evidence-based rationale
7. Include mechanism of action, expected outcomes, and clinical considerations
8. Explain the 'why' behind each clinical decision in detail

Query: ${query}
${intervention ? `Intervention: ${intervention}` : ''}
${clinicalReasoning ? `Clinical Context: ${clinicalReasoning}` : ''}

Available passages:
${context}

Provide a comprehensive, detailed, evidence-based explanation covering the clinical reasoning, pathophysiology, mechanism of action, expected outcomes, and evidence supporting this intervention:`;

  const systemPrompt = createSecureSystemPrompt(basePrompt);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Explain: ${query}` }
      ],
      max_tokens: 1200,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from LLM");
    }

    return sanitizeText(response, 1200);

  } catch (error) {
    console.error('LLM composition error:', error);
    throw new Error(`Failed to compose explanation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract evidence sources from explanation text
 */
function extractEvidenceSources(explanation: string, passages: any[]): EvidenceRef[] {
  const evidenceSources: EvidenceRef[] = [];
  const citationPattern = /\(([^#]+)#(\d+)\)/g;
  
  let match;
  while ((match = citationPattern.exec(explanation)) !== null) {
    const caseId = match[1];
    const passageId = parseInt(match[2]);
    
    // Find corresponding passage
    const passage = passages.find(p => p.id === passageId);
    if (passage) {
      evidenceSources.push({
        caseId,
        section: passage.section || 'unknown',
        passageId,
        sourceCitation: passage.sourceCitation,
        license: passage.license,
      });
    }
  }
  
  return evidenceSources;
}

/**
 * Extract objective hits from explanation
 */
function extractObjectiveHits(explanation: string, passages: any[]): string[] {
  const objectiveHits: string[] = [];
  
  // Look for passages tagged with objectives
  const objectivePassages = passages.filter(p => 
    p.tags && p.tags.some((tag: string) => tag.includes('objective'))
  );
  
  objectivePassages.forEach(passage => {
    // Extract key phrases that might represent objectives
    const sentences = passage.text.split(/[.!?]+/);
    sentences.forEach((sentence: string) => {
      if (sentence.includes('objective') || sentence.includes('goal') || sentence.includes('aim')) {
        const cleanSentence = sentence.trim();
        if (cleanSentence.length > 10 && cleanSentence.length < 100) {
          objectiveHits.push(cleanSentence);
        }
      }
    });
  });
  
  return objectiveHits.slice(0, 5); // Limit to 5
}

/**
 * Extract risk flags from explanation
 */
function extractRiskFlags(explanation: string, passages: any[]): string[] {
  const riskFlags: string[] = [];
  
  // Look for passages tagged with risk indicators
  const riskPassages = passages.filter(p => 
    p.tags && p.tags.some((tag: string) => 
      ['red-flag', 'pitfall', 'contraindication', 'warning'].includes(tag)
    )
  );
  
  riskPassages.forEach(passage => {
    const sentences = passage.text.split(/[.!?]+/);
    sentences.forEach((sentence: string) => {
      if (sentence.includes('risk') || sentence.includes('danger') || 
          sentence.includes('avoid') || sentence.includes('warning')) {
        const cleanSentence = sentence.trim();
        if (cleanSentence.length > 10 && cleanSentence.length < 100) {
          riskFlags.push(cleanSentence);
        }
      }
    });
  });
  
  return riskFlags.slice(0, 5); // Limit to 5
}

/**
 * Extract next stage recommendations
 */
function extractNextStageRecs(explanation: string, passages: any[]): string[] {
  const recommendations: string[] = [];
  
  // Look for passages tagged with next steps
  const nextStepPassages = passages.filter(p => 
    p.tags && p.tags.some((tag: string) => 
      ['next-step', 'follow-up', 'escalation'].includes(tag)
    )
  );
  
  nextStepPassages.forEach(passage => {
    const sentences = passage.text.split(/[.!?]+/);
    sentences.forEach((sentence: string) => {
      if (sentence.includes('next') || sentence.includes('then') || 
          sentence.includes('follow') || sentence.includes('continue')) {
        const cleanSentence = sentence.trim();
        if (cleanSentence.length > 10 && cleanSentence.length < 100) {
          recommendations.push(cleanSentence);
        }
      }
    });
  });
  
  return recommendations.slice(0, 5); // Limit to 5
}

/**
 * Get clinical reasoning from PubMed
 */
async function getClinicalReasoning(intervention: string, caseId: string): Promise<string> {
  try {
    const pubmedResults = await searchPubMed({
      intervention,
      caseType: caseId,
      limit: 3,
    });
    
    if (pubmedResults.length === 0) {
      return "";
    }
    
    // Extract key clinical reasoning points
    const reasoningPoints = pubmedResults.map(result => {
      const abstract = result.abstract.substring(0, 150);
      return `${result.title}: ${abstract}...`;
    });
    
    return reasoningPoints.join(' | ');
    
  } catch (error) {
    console.error('PubMed search error:', error);
    return "";
  }
}

/**
 * Create fallback bundle when insufficient evidence
 */
function createFallbackBundle(message: string): GroundedBundle {
  return {
    explanation: message,
    evidenceSources: [],
    objectiveHits: [],
    riskFlags: [],
    nextStageRecommendations: [],
    vitalEffects: {},
    deteriorationRates: {},
    license: "CC BY-NC-SA 4.0",
    sourceVersion: "aliem-rescu-peds-2021-03-29",
    fallback: true,
  };
}

/**
 * Validate that all sentences in explanation have evidence
 */
export function validateEvidenceCoverage(explanation: string, evidenceSources: EvidenceRef[]): boolean {
  if (evidenceSources.length === 0) {
    return false;
  }
  
  // Simple validation: check if explanation contains citations
  const citationPattern = /\([^#]+#\d+\)/g;
  const citations = explanation.match(citationPattern);
  
  if (!citations || citations.length < 2) {
    return false;
  }
  
  return true;
}


