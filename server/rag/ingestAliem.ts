import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { kbPassages, kbRules } from '@shared/schema';
import { DocumentProcessing, Chunk } from './schemas';
import { generatePassageHash, validateSourceIntegrity } from './security';
import { sanitizeText } from './security';
import { eq } from 'drizzle-orm';

/**
 * ALiEM Document Ingestion Utility
 * Offline/CLI utility to chunk ALiEM cases and extract rules
 * Processes uploaded PDFs and populates knowledge base
 */

// Configuration
const CHUNK_SIZE = 500; // Target tokens per chunk
const OVERLAP_SIZE = 75; // 15% overlap between chunks
const MAX_CHUNK_SIZE = 700;
const MIN_CHUNK_SIZE = 300;

/**
 * Main ingestion function
 */
export async function ingestAliemDocument(
  documentPath: string,
  metadata: DocumentProcessing
): Promise<{
  passagesCreated: number;
  rulesCreated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let passagesCreated = 0;
  let rulesCreated = 0;
  
  try {
    console.log(`Processing document: ${metadata.filename}`);
    
    // Validate source integrity
    if (!validateSourceIntegrity(documentPath, metadata.checksum)) {
      throw new Error('Document checksum validation failed');
    }
    
    // Extract text content (simplified - in production use proper PDF parser)
    const content = await extractTextContent(documentPath);
    if (!content) {
      throw new Error('Failed to extract text content');
    }
    
    // Chunk the content
    const chunks = createChunks(content, metadata);
    console.log(`Created ${chunks.length} chunks`);
    
    // Process chunks into passages
    for (const chunk of chunks) {
      try {
        await createPassage(chunk, metadata);
        passagesCreated++;
      } catch (error) {
        errors.push(`Failed to create passage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Extract and create rules
    const rules = extractRules(content, metadata);
    for (const rule of rules) {
      try {
        await createRule(rule, metadata);
        rulesCreated++;
      } catch (error) {
        errors.push(`Failed to create rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Ingestion completed: ${passagesCreated} passages, ${rulesCreated} rules`);
    
  } catch (error) {
    errors.push(`Ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return { passagesCreated, rulesCreated, errors };
}

/**
 * Extract text content from document (placeholder)
 */
async function extractTextContent(documentPath: string): Promise<string | null> {
  try {
    // This is a placeholder - in production, use a proper PDF parser
    // For now, we'll simulate text extraction
    if (documentPath.endsWith('.pdf')) {
      // Simulate PDF text extraction
      return "This is simulated text content from the PDF. In production, this would use a proper PDF parser to extract actual text content.";
    }
    
    // For other file types, read directly
    const content = fs.readFileSync(documentPath, 'utf-8');
    return content;
    
  } catch (error) {
    console.error('Error extracting text content:', error);
    return null;
  }
}

/**
 * Create chunks from content with overlap
 */
function createChunks(content: string, metadata: DocumentProcessing): Chunk[] {
  const chunks: Chunk[] = [];
  const sentences = splitIntoSentences(content);
  
  let currentChunk = '';
  let sentenceIndex = 0;
  
  while (sentenceIndex < sentences.length) {
    const sentence = sentences[sentenceIndex];
    
    // Check if adding this sentence would exceed chunk size
    if ((currentChunk + sentence).length > MAX_CHUNK_SIZE && currentChunk.length >= MIN_CHUNK_SIZE) {
      // Create chunk
      const chunk = createChunkFromText(currentChunk.trim(), metadata, chunks.length);
      chunks.push(chunk);
      
      // Start new chunk with overlap
      const overlapSentences = getOverlapSentences(sentences, sentenceIndex, OVERLAP_SIZE);
      currentChunk = overlapSentences.join(' ');
      
    } else {
      currentChunk += sentence + ' ';
    }
    
    sentenceIndex++;
  }
  
  // Add final chunk if there's content
  if (currentChunk.trim().length >= MIN_CHUNK_SIZE) {
    const chunk = createChunkFromText(currentChunk.trim(), metadata, chunks.length);
    chunks.push(chunk);
  }
  
  return chunks;
}

/**
 * Split content into sentences
 */
function splitIntoSentences(content: string): string[] {
  // Simple sentence splitting - in production use more sophisticated NLP
  return content
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 200)
    .map(s => s + '.');
}

/**
 * Get overlap sentences for chunk continuity
 */
function getOverlapSentences(sentences: string[], currentIndex: number, overlapSize: number): string[] {
  const overlapSentences: string[] = [];
  let currentLength = 0;
  let index = currentIndex - 1;
  
  while (index >= 0 && currentLength < overlapSize) {
    const sentence = sentences[index];
    if (currentLength + sentence.length <= overlapSize) {
      overlapSentences.unshift(sentence);
      currentLength += sentence.length;
    }
    index--;
  }
  
  return overlapSentences;
}

/**
 * Create chunk object from text
 */
function createChunkFromText(text: string, metadata: DocumentProcessing, chunkIndex: number): Chunk {
  // Determine section based on content analysis
  const section = determineSection(text, metadata);
  
  // Extract tags based on content
  const tags = extractTags(text, metadata);
  
  // Generate passage hash
  const passageHash = generatePassageHash(text, metadata.documentId);
  
  return {
    id: `${metadata.documentId}-chunk-${chunkIndex}`,
    text: sanitizeText(text, MAX_CHUNK_SIZE),
    section,
    tags,
    sourceCitation: `${metadata.filename} - Chunk ${chunkIndex + 1}`,
    license: metadata.license,
    passageHash,
  };
}

/**
 * Determine section based on content analysis
 */
function determineSection(text: string, metadata: DocumentProcessing): Chunk['section'] {
  const lowerText = text.toLowerCase();
  
  // Simple keyword-based section detection
  if (lowerText.includes('objective') || lowerText.includes('goal') || lowerText.includes('aim')) {
    return 'objectives';
  }
  
  if (lowerText.includes('action') || lowerText.includes('step') || lowerText.includes('intervention')) {
    return 'critical_actions';
  }
  
  if (lowerText.includes('debrief') || lowerText.includes('summary') || lowerText.includes('learning')) {
    return 'debrief';
  }
  
  if (lowerText.includes('prompt') || lowerText.includes('question') || lowerText.includes('ask')) {
    return 'actor_prompts';
  }
  
  if (lowerText.includes('pitfall') || lowerText.includes('warning') || lowerText.includes('risk')) {
    return 'pitfalls';
  }
  
  // Default to objectives if unclear
  return 'objectives';
}

/**
 * Extract tags based on content
 */
function extractTags(text: string, metadata: DocumentProcessing): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Extract case-specific tags
  if (metadata.source.toLowerCase().includes('aliem')) {
    tags.push('aliem');
  }
  
  if (metadata.source.toLowerCase().includes('pals')) {
    tags.push('pals');
  }
  
  // Extract clinical tags
  if (lowerText.includes('airway')) tags.push('airway');
  if (lowerText.includes('breathing')) tags.push('breathing');
  if (lowerText.includes('circulation')) tags.push('circulation');
  if (lowerText.includes('seizure')) tags.push('seizure');
  if (lowerText.includes('fever')) tags.push('fever');
  if (lowerText.includes('shock')) tags.push('shock');
  if (lowerText.includes('trauma')) tags.push('trauma');
  
  // Extract urgency tags
  if (lowerText.includes('emergency') || lowerText.includes('urgent')) tags.push('emergency');
  if (lowerText.includes('critical') || lowerText.includes('severe')) tags.push('critical');
  if (lowerText.includes('red-flag') || lowerText.includes('warning')) tags.push('red-flag');
  
  // Extract ICS tags
  if (lowerText.includes('ics1') || lowerText.includes('immediate')) tags.push('ICS1');
  if (lowerText.includes('ics2') || lowerText.includes('secondary')) tags.push('ICS2');
  
  return tags;
}

/**
 * Create passage in database
 */
async function createPassage(chunk: Chunk, metadata: DocumentProcessing): Promise<void> {
  try {
    // Check if passage already exists (deduplication)
    if (chunk.passageHash) {
      const existingPassage = await db
        .select()
        .from(kbPassages)
        .where(eq(kbPassages.passageHash, chunk.passageHash));
      
      if (existingPassage.length > 0) {
        console.log(`Passage already exists: ${chunk.id}`);
        return;
      }
    }
    
    // Create new passage
    await db.insert(kbPassages).values({
      caseId: extractCaseId(metadata.filename),
      stage: 1, // Default stage
      section: chunk.section,
      tags: chunk.tags,
      text: chunk.text,
      embedding: null, // Will be generated later
      sourceCitation: chunk.sourceCitation,
      license: chunk.license,
      documentId: metadata.documentId || null,
      passageHash: chunk.passageHash || null,
    });
    
    console.log(`Created passage: ${chunk.id}`);
    
  } catch (error) {
    console.error('Error creating passage:', error);
    throw error;
  }
}

/**
 * Extract case ID from filename
 */
function extractCaseId(filename: string): string {
  // Extract case ID from filename patterns
  const aliemMatch = filename.match(/aliem-case-(\d+)/i);
  if (aliemMatch) {
    return `aliem-case-${aliemMatch[1].padStart(2, '0')}`;
  }
  
  const palsMatch = filename.match(/pals-(\w+)/i);
  if (palsMatch) {
    return `pals-${palsMatch[1].toLowerCase()}`;
  }
  
  // Default case ID
  return 'general';
}

/**
 * Extract rules from content
 */
function extractRules(content: string, metadata: DocumentProcessing): any[] {
  const rules: any[] = [];
  
  // Extract drug dosing rules
  const drugRules = extractDrugDosingRules(content, metadata);
  rules.push(...drugRules);
  
  // Extract algorithm steps
  const algoRules = extractAlgorithmSteps(content, metadata);
  rules.push(...algoRules);
  
  // Extract critical actions
  const actionRules = extractCriticalActions(content, metadata);
  rules.push(...actionRules);
  
  // Extract vital curves
  const vitalRules = extractVitalCurves(content, metadata);
  rules.push(...vitalRules);
  
  return rules;
}

/**
 * Extract drug dosing rules
 */
function extractDrugDosingRules(content: string, metadata: DocumentProcessing): any[] {
  const rules: any[] = [];
  
  // Look for drug dosing patterns in text
  const drugPatterns = [
    /(\w+)\s+(\d+(?:\.\d+)?)\s*mg\/kg/gi,
    /(\w+)\s+(\d+(?:\.\d+)?)\s*mg/gi,
  ];
  
  drugPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of Array.from(matches)) {
      const drugName = match[1];
      const dose = parseFloat(match[2]);
      
      if (drugName && dose) {
        rules.push({
          kind: 'drug_doses',
          caseId: extractCaseId(metadata.filename),
          payload: {
            name: drugName,
            route: 'IV', // Default
            mgPerKgMin: dose * 0.8,
            mgPerKgMax: dose * 1.2,
            maxDose: dose * 50, // Estimate based on typical max weights
            weightBands: [
              { minWeight: 0, maxWeight: 10, dose: dose * 5 },
              { minWeight: 10, maxWeight: 20, dose: dose * 15 },
              { minWeight: 20, maxWeight: 40, dose: dose * 30 },
            ],
          },
          version: metadata.version,
          checksum: metadata.checksum,
          documentId: metadata.documentId,
        });
      }
    }
  });
  
  return rules;
}

/**
 * Extract algorithm steps
 */
function extractAlgorithmSteps(content: string, metadata: DocumentProcessing): any[] {
  const rules: any[] = [];
  
  // Look for numbered steps or algorithm patterns
  const stepPatterns = [
    /(\d+)\.\s*([^.!?]+)/gi,
    /step\s+(\d+)[:\s]+([^.!?]+)/gi,
  ];
  
  stepPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    const steps: any[] = [];
    
    for (const match of Array.from(matches)) {
      const order = parseInt(match[1]);
      const label = match[2].trim();
      
      if (order && label) {
        steps.push({
          id: `step-${order}`,
          order,
          label,
          appliesIf: {},
          hazards: [],
        });
      }
    }
    
    if (steps.length > 0) {
      rules.push({
        kind: 'algo_steps',
        caseId: extractCaseId(metadata.filename),
        payload: { steps },
        version: metadata.version,
        checksum: metadata.checksum,
        documentId: metadata.documentId,
      });
    }
  });
  
  return rules;
}

/**
 * Extract critical actions
 */
function extractCriticalActions(content: string, metadata: DocumentProcessing): any[] {
  const rules: any[] = [];
  
  // Look for critical action patterns
  const actionPatterns = [
    /critical\s+action[:\s]+([^.!?]+)/gi,
    /must\s+([^.!?]+)/gi,
    /essential\s+([^.!?]+)/gi,
  ];
  
  actionPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    const actions: any[] = [];
    let order = 1;
    
    for (const match of Array.from(matches)) {
      const label = match[1].trim();
      
      if (label) {
        actions.push({
          id: `action-${order}`,
          stage: 1, // Default stage
          label,
          synonyms: [],
          required: true,
          order: order++,
        });
      }
    }
    
    if (actions.length > 0) {
      rules.push({
        kind: 'critical_actions',
        caseId: extractCaseId(metadata.filename),
        payload: { actions },
        version: metadata.version,
        checksum: metadata.checksum,
        documentId: metadata.documentId,
      });
    }
  });
  
  return rules;
}

/**
 * Extract vital curves
 */
function extractVitalCurves(content: string, metadata: DocumentProcessing): any[] {
  const rules: any[] = [];
  
  // Look for vital sign patterns
  const vitalPatterns = [
    /heart\s+rate\s+(\d+)/gi,
    /respiratory\s+rate\s+(\d+)/gi,
    /blood\s+pressure\s+(\d+)\/(\d+)/gi,
    /spo2\s+(\d+)/gi,
  ];
  
  vitalPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    const params: Record<string, number> = {};
    
    for (const match of Array.from(matches)) {
      if (match[1]) {
        const value = parseInt(match[1]);
        if (!isNaN(value)) {
          params['heartRate'] = value;
        }
      }
    }
    
    if (Object.keys(params).length > 0) {
      rules.push({
        kind: 'vital_curves',
        caseId: extractCaseId(metadata.filename),
        payload: {
          id: `curve-${extractCaseId(metadata.filename)}`,
          name: `Default curve for ${extractCaseId(metadata.filename)}`,
          params,
          timeToEffect: 60, // Default 1 minute
        },
        version: metadata.version,
        checksum: metadata.checksum,
        documentId: metadata.documentId,
      });
    }
  });
  
  return rules;
}

/**
 * Create rule in database
 */
async function createRule(rule: any, metadata: DocumentProcessing): Promise<void> {
  try {
    await db.insert(kbRules).values(rule);
    console.log(`Created rule: ${rule.kind} for ${rule.caseId}`);
  } catch (error) {
    console.error('Error creating rule:', error);
    throw error;
  }
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node ingestAliem.js <document-path> <metadata-json>');
    process.exit(1);
  }
  
  const documentPath = args[0];
  const metadataPath = args[1];
  
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    ingestAliemDocument(documentPath, metadata)
      .then(result => {
        console.log('Ingestion completed:', result);
        process.exit(0);
      })
      .catch(error => {
        console.error('Ingestion failed:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('Error reading metadata:', error);
    process.exit(1);
  }
}


