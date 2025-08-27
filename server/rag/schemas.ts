import { z } from "zod";
import { GroundedBundleSchema, EvidenceRefSchema } from "@shared/kb";

/**
 * RAG Schemas - Strict validation for LLM responses and security
 * All schemas reject malformed JSON and enforce security constraints
 */

// LLM Response Schema - Strict validation to prevent hallucination
export const LLMResponseSchema = z.object({
  explanation: z.string().min(10).max(1000),
  evidenceSources: z.array(EvidenceRefSchema).min(1).max(10),
  objectiveHits: z.array(z.string()).max(5),
  riskFlags: z.array(z.string()).max(5),
  nextStageRecommendations: z.array(z.string()).max(5),
  clinicalReasoning: z.string().min(10).max(200), // 2 lines max for UI
  fallback: z.boolean().optional(),
});

// RAG Query Schema - Input validation
export const RAGQuerySchema = z.object({
  query: z.string().min(3).max(500),
  caseId: z.string().optional(),
  stage: z.number().int().min(1).max(10).optional(),
  section: z.enum(["objectives", "critical_actions", "debrief", "actor_prompts", "pitfalls"]).optional(),
  tags: z.array(z.string()).max(10).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  userId: z.string().min(1),
  sessionId: z.string().min(1),
});

// Document Processing Schema - For ingestion pipeline
export const DocumentProcessingSchema = z.object({
  documentId: z.string().min(1),
  filename: z.string().min(1),
  source: z.string().min(1),
  license: z.string().min(1),
  version: z.string().min(1),
  checksum: z.string().min(1),
  content: z.string().min(100),
  metadata: z.record(z.any()).optional(),
});

// Chunk Processing Schema - For text chunking
export const ChunkSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(50).max(1000),
  section: z.enum(["objectives", "critical_actions", "debrief", "actor_prompts", "pitfalls"]),
  tags: z.array(z.string()).max(10),
  sourceCitation: z.string().min(1),
  license: z.string().min(1),
  passageHash: z.string().min(1),
});

// Security Schema - For prompt injection defense
export const SecurityValidationSchema = z.object({
  text: z.string().min(1),
  maxTokens: z.number().int().min(100).max(5000).default(2000),
  allowDirectives: z.boolean().default(false),
  redactPHI: z.boolean().default(true),
});

// Rate Limiting Schema - For API protection
export const RateLimitSchema = z.object({
  userId: z.string().min(1),
  endpoint: z.string().min(1),
  timestamp: z.number().int().positive(),
  count: z.number().int().min(1),
  limit: z.number().int().min(1),
});

// PubMed Integration Schema - For clinical reasoning
export const PubMedQuerySchema = z.object({
  intervention: z.string().min(1),
  caseType: z.string().min(1),
  ageGroup: z.enum(["neonatal", "infant", "child", "adolescent"]).optional(),
  limit: z.number().int().min(1).max(10).default(5),
});

export const PubMedResultSchema = z.object({
  title: z.string().min(1),
  abstract: z.string().min(10),
  authors: z.array(z.string()),
  journal: z.string().min(1),
  pubDate: z.string().min(1),
  doi: z.string().optional(),
  relevanceScore: z.number().min(0).max(1),
});

// Validation functions
export function validateLLMResponse(data: unknown): z.infer<typeof LLMResponseSchema> {
  try {
    return LLMResponseSchema.parse(data);
  } catch (error) {
    throw new Error(`LLM response validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateRAGQuery(data: unknown): z.infer<typeof RAGQuerySchema> {
  try {
    return RAGQuerySchema.parse(data);
  } catch (error) {
    throw new Error(`RAG query validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateDocumentProcessing(data: unknown): z.infer<typeof DocumentProcessingSchema> {
  try {
    return DocumentProcessingSchema.parse(data);
  } catch (error) {
    throw new Error(`Document processing validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Security validation function
export function validateSecurityText(text: string, maxTokens: number = 2000): string {
  const validation = SecurityValidationSchema.parse({ text, maxTokens });
  
  // Remove potential prompt injection attempts
  let cleanedText = validation.text
    .replace(/ignore\s+previous\s+instructions/gi, '')
    .replace(/system\s*:/gi, '')
    .replace(/user\s*:/gi, '')
    .replace(/assistant\s*:/gi, '')
    .replace(/<|>|\[|\]|\{|\}/g, '') // Remove brackets that could be used for directives
    .trim();
  
  // Truncate if too long
  if (cleanedText.length > maxTokens * 4) { // Rough estimate: 4 chars per token
    cleanedText = cleanedText.substring(0, maxTokens * 4) + '...';
  }
  
  return cleanedText;
}

// Export types
export type LLMResponse = z.infer<typeof LLMResponseSchema>;
export type RAGQuery = z.infer<typeof RAGQuerySchema>;
export type DocumentProcessing = z.infer<typeof DocumentProcessingSchema>;
export type Chunk = z.infer<typeof ChunkSchema>;
export type PubMedQuery = z.infer<typeof PubMedQuerySchema>;
export type PubMedResult = z.infer<typeof PubMedResultSchema>;
