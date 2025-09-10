/**
 * TypeScript client for MedRAG service with ProofPath™ support
 * Provides a clean interface for medical RAG queries with evidence tracking
 */

import fetch from 'node-fetch';
import { z } from 'zod';

// Environment configuration
const MEDRAG_SERVICE_URL = process.env.MEDRAG_SERVICE_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT = parseInt(process.env.MEDRAG_TIMEOUT || '30000');
const MAX_RETRIES = parseInt(process.env.MEDRAG_MAX_RETRIES || '3');

// Type definitions matching the FastAPI service
export interface EvidenceRef {
  id: string;
  source_id: string;
  doc_url?: string;
  title?: string;
  published_at?: string;
  span?: string;
  similarity: number;
  weight: number;
  recency_signal?: number;
}

export interface ProofPathMeta {
  retriever_params: Record<string, any>;
  generator_params: Record<string, any>;
  latency_ms: Record<string, number>;
  token_counts: Record<string, number>;
  warnings: string[];
}

export interface MedRAGContext {
  title: string;
  content: string;
  source: string;
}

export interface MedRAGResponse {
  answer: string;
  contexts: MedRAGContext[];
  citations: string[];
  latency_ms: number;
  model_info: string;
  evidence_trail?: EvidenceRef[];
  answer_confidence?: number;
  proofpath_meta?: ProofPathMeta;
  counterfactual_note?: string;
}

export interface MedRAGQueryOptions {
  options?: Record<string, string>; // Multiple choice options
  k?: number; // Number of retrieved passages
  temperature?: number; // Generation temperature
  ablate?: string[]; // ProofPath™ ablation IDs
  timeout?: number; // Request timeout in ms
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  medrag_initialized: boolean;
  proofpath_enabled: boolean;
}

// Error types
export class MedRAGError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'MedRAGError';
  }
}

export class MedRAGServiceUnavailableError extends MedRAGError {
  constructor(message = 'MedRAG service is unavailable') {
    super(message, 503);
    this.name = 'MedRAGServiceUnavailableError';
  }
}

export class MedRAGTimeoutError extends MedRAGError {
  constructor(message = 'MedRAG request timed out') {
    super(message, 408);
    this.name = 'MedRAGTimeoutError';
  }
}

// Validation schemas
const medragResponseSchema = z.object({
  answer: z.string(),
  contexts: z.array(z.object({
    title: z.string(),
    content: z.string(),
    source: z.string()
  })),
  citations: z.array(z.string()),
  latency_ms: z.number(),
  model_info: z.string(),
  evidence_trail: z.array(z.object({
    id: z.string(),
    source_id: z.string(),
    doc_url: z.string().optional(),
    title: z.string().optional(),
    published_at: z.string().optional(),
    span: z.string().optional(),
    similarity: z.number(),
    weight: z.number(),
    recency_signal: z.number().optional()
  })).optional(),
  answer_confidence: z.number().optional(),
  proofpath_meta: z.object({
    retriever_params: z.record(z.any()),
    generator_params: z.record(z.any()),
    latency_ms: z.record(z.number()),
    token_counts: z.record(z.number()),
    warnings: z.array(z.string())
  }).optional(),
  counterfactual_note: z.string().optional()
});

/**
 * Main MedRAG client class
 */
export class MedRAGClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private maxRetries: number;

  constructor(
    baseUrl: string = MEDRAG_SERVICE_URL,
    timeout: number = DEFAULT_TIMEOUT,
    maxRetries: number = MAX_RETRIES
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultTimeout = timeout;
    this.maxRetries = maxRetries;
  }

  /**
   * Check if MedRAG service is healthy
   */
  async healthCheck(): Promise<HealthStatus> {
    try {
      const response = await this.makeRequest('/health', 'GET');
      const data = await response.json() as HealthStatus;
      return data;
    } catch (error) {
      throw new MedRAGServiceUnavailableError(
        `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Main method for asking medical questions with RAG
   * Backward compatible with existing function signatures
   */
  async askMedRAG(
    question: string,
    options?: MedRAGQueryOptions
  ): Promise<MedRAGResponse> {
    const requestBody = {
      query: question,
      options: options?.options,
      k: options?.k ?? 32,
      temperature: options?.temperature ?? 0.0,
      ablate: options?.ablate
    };

    const response = await this.queryWithRetry('/query', requestBody, options?.timeout);
    const data = await response.json();
    
    // Validate response structure
    try {
      return medragResponseSchema.parse(data);
    } catch (validationError) {
      throw new MedRAGError(
        'Invalid response format from MedRAG service',
        500,
        { validationError, responseData: data }
      );
    }
  }

  /**
   * ProofPath™ counterfactual query - excludes specified sources
   */
  async askMedRAGWithAblation(
    question: string, 
    ablateIds: string[], 
    options?: Omit<MedRAGQueryOptions, 'ablate'>
  ): Promise<MedRAGResponse> {
    return this.askMedRAG(question, { ...options, ablate: ablateIds });
  }

  /**
   * Convenience method for multiple choice questions
   */
  async askMedRAGMultipleChoice(
    question: string,
    choices: Record<string, string>,
    options?: Omit<MedRAGQueryOptions, 'options'>
  ): Promise<MedRAGResponse> {
    return this.askMedRAG(question, { ...options, options: choices });
  }

  /**
   * Legacy compatibility method - maintains existing function signature
   */
  async retrievePassages(
    query: string,
    k: number = 32
  ): Promise<{ passages: MedRAGContext[]; scores?: number[] }> {
    const response = await this.askMedRAG(query, { k });
    
    // Extract scores from evidence trail if available
    const scores = response.evidence_trail?.map(ref => ref.similarity);
    
    return {
      passages: response.contexts,
      scores
    };
  }

  /**
   * Legacy compatibility method - maintains existing function signature  
   */
  async composeGroundedExplanation(
    query: string,
    context?: string,
    options?: Record<string, string>
  ): Promise<string> {
    // If context provided, we could potentially use it as a constraint
    // For now, just use the standard query
    const response = await this.askMedRAG(query, { options });
    return response.answer;
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
    timeout?: number
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeoutMs = timeout ?? this.defaultTimeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new MedRAGError(
          `MedRAG service error: ${response.status} ${response.statusText}`,
          response.status,
          { responseBody: errorBody }
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new MedRAGTimeoutError(`Request timed out after ${timeoutMs}ms`);
      }
      
      if (error instanceof MedRAGError) {
        throw error;
      }
      
      throw new MedRAGError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Make query with retry logic
   */
  private async queryWithRetry(
    endpoint: string,
    body: any,
    timeout?: number
  ): Promise<Response> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.makeRequest(endpoint, 'POST', body, timeout);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx) except timeout
        if (error instanceof MedRAGError && error.statusCode && 
            error.statusCode >= 400 && error.statusCode < 500 && 
            error.statusCode !== 408) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === this.maxRetries) {
          break;
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new MedRAGError(
      `Failed after ${this.maxRetries} attempts: ${lastError.message}`,
      lastError instanceof MedRAGError ? lastError.statusCode : 500
    );
  }
}

// Singleton instance for backward compatibility
let defaultClient: MedRAGClient | null = null;

/**
 * Get or create default MedRAG client instance
 */
export function getMedRAGClient(): MedRAGClient {
  if (!defaultClient) {
    defaultClient = new MedRAGClient();
  }
  return defaultClient;
}

/**
 * Legacy function - backward compatible
 */
export async function askMedRag(
  question: string,
  options?: MedRAGQueryOptions
): Promise<MedRAGResponse> {
  return getMedRAGClient().askMedRAG(question, options);
}

/**
 * Legacy function - backward compatible
 */
export async function retrievePassages(
  query: string,
  k: number = 32
): Promise<{ passages: MedRAGContext[]; scores?: number[] }> {
  return getMedRAGClient().retrievePassages(query, k);
}

/**
 * Legacy function - backward compatible
 */
export async function composeGroundedExplanation(
  query: string,
  context?: string,
  options?: Record<string, string>
): Promise<string> {
  return getMedRAGClient().composeGroundedExplanation(query, context, options);
}

export default MedRAGClient;