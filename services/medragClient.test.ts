/**
 * Test suite for MedRAG TypeScript client
 * Tests both the client functionality and integration with the FastAPI service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  MedRAGClient, 
  getMedRAGClient, 
  askMedRag, 
  MedRAGError, 
  MedRAGServiceUnavailableError, 
  MedRAGTimeoutError 
} from './medragClient';

// Mock fetch globally
global.fetch = vi.fn();

const mockFetch = fetch as any;

describe('MedRAGClient', () => {
  let client: MedRAGClient;
  
  beforeEach(() => {
    client = new MedRAGClient('http://localhost:8000', 5000, 2);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Health Check', () => {
    it('should successfully check service health', async () => {
      const mockHealthResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00.000Z',
        medrag_initialized: true,
        proofpath_enabled: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse)
      });

      const health = await client.healthCheck();
      
      expect(health).toEqual(mockHealthResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/health',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
      );
    });

    it('should throw MedRAGServiceUnavailableError on health check failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.healthCheck()).rejects.toThrow(MedRAGServiceUnavailableError);
    });
  });

  describe('askMedRAG', () => {
    const mockMedRAGResponse = {
      answer: 'Test medical answer',
      contexts: [
        {
          title: 'Medical Guidelines',
          content: 'Detailed medical information',
          source: 'textbook_1'
        }
      ],
      citations: ['Medical Guidelines - textbook_1'],
      latency_ms: 1250,
      model_info: 'OpenAI/gpt-3.5-turbo-16k',
      evidence_trail: [
        {
          id: 'passage_0',
          source_id: 'textbook_1',
          title: 'Medical Guidelines',
          similarity: 0.92,
          weight: 0.85
        }
      ],
      answer_confidence: 0.87,
      proofpath_meta: {
        retriever_params: { name: 'MedCPT', corpus: 'Textbooks', k: 32 },
        generator_params: { model: 'OpenAI/gpt-3.5-turbo-16k' },
        latency_ms: { retrieve: 800, generate: 450 },
        token_counts: { context: 2048, output: 156 },
        warnings: []
      }
    };

    it('should successfully make a basic query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMedRAGResponse)
      });

      const result = await client.askMedRAG('What causes chest pain?');
      
      expect(result).toEqual(mockMedRAGResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/query',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            query: 'What causes chest pain?',
            options: undefined,
            k: 32,
            temperature: 0.0,
            ablate: undefined
          })
        })
      );
    });

    it('should handle multiple choice questions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMedRAGResponse)
      });

      const choices = {
        'A': 'Myocardial infarction',
        'B': 'Pneumonia',
        'C': 'GERD'
      };

      await client.askMedRAG('What is the most likely cause?', { options: choices });
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/query',
        expect.objectContaining({
          body: JSON.stringify({
            query: 'What is the most likely cause?',
            options: choices,
            k: 32,
            temperature: 0.0,
            ablate: undefined
          })
        })
      );
    });

    it('should handle ProofPath™ ablation', async () => {
      const ablatedResponse = {
        ...mockMedRAGResponse,
        counterfactual_note: 'Excluded 1 passages based on ablation criteria: passage_0'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(ablatedResponse)
      });

      const result = await client.askMedRAGWithAblation(
        'What causes chest pain?', 
        ['passage_0']
      );
      
      expect(result.counterfactual_note).toBe('Excluded 1 passages based on ablation criteria: passage_0');
    });

    it('should handle service errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Service error')
      });

      await expect(client.askMedRAG('test query')).rejects.toThrow(MedRAGError);
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('AbortError'));
      (mockFetch.mockRejectedValueOnce as any).mockName = 'AbortError';

      await expect(client.askMedRAG('test query')).rejects.toThrow(MedRAGTimeoutError);
    });

    it('should validate response format', async () => {
      const invalidResponse = {
        answer: 'Valid answer',
        // Missing required fields
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse)
      });

      await expect(client.askMedRAG('test query')).rejects.toThrow(MedRAGError);
    });
  });

  describe('Legacy compatibility methods', () => {
    it('should support retrievePassages method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          answer: 'Test answer',
          contexts: [{ title: 'Test', content: 'Content', source: 'source1' }],
          citations: ['Citation 1'],
          evidence_trail: [{ id: 'p1', source_id: 's1', similarity: 0.9, weight: 0.8 }],
          latency_ms: 1000,
          model_info: 'test-model'
        })
      });

      const result = await client.retrievePassages('test query', 10);
      
      expect(result.passages).toHaveLength(1);
      expect(result.scores).toEqual([0.9]);
    });

    it('should support composeGroundedExplanation method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          answer: 'Grounded explanation',
          contexts: [],
          citations: [],
          latency_ms: 1000,
          model_info: 'test-model'
        })
      });

      const result = await client.composeGroundedExplanation('test query');
      
      expect(result).toBe('Grounded explanation');
    });
  });

  describe('Retry logic', () => {
    it('should retry on temporary failures', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            answer: 'Success after retry',
            contexts: [],
            citations: [],
            latency_ms: 1000,
            model_info: 'test-model'
          })
        });

      const result = await client.askMedRAG('test query');
      
      expect(result.answer).toBe('Success after retry');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Bad request')
      });

      await expect(client.askMedRAG('test query')).rejects.toThrow(MedRAGError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Module exports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide singleton client via getMedRAGClient', () => {
    const client1 = getMedRAGClient();
    const client2 = getMedRAGClient();
    
    expect(client1).toBe(client2); // Should be the same instance
  });

  it('should provide legacy askMedRag function', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        answer: 'Legacy function works',
        contexts: [],
        citations: [],
        latency_ms: 1000,
        model_info: 'test-model'
      })
    });

    const result = await askMedRag('test query');
    
    expect(result.answer).toBe('Legacy function works');
  });
});

describe('Error handling', () => {
  it('should create appropriate error types', () => {
    const medragError = new MedRAGError('Test error', 500, { detail: 'test' });
    expect(medragError.name).toBe('MedRAGError');
    expect(medragError.statusCode).toBe(500);
    expect(medragError.details).toEqual({ detail: 'test' });

    const unavailableError = new MedRAGServiceUnavailableError();
    expect(unavailableError.name).toBe('MedRAGServiceUnavailableError');
    expect(unavailableError.statusCode).toBe(503);

    const timeoutError = new MedRAGTimeoutError();
    expect(timeoutError.name).toBe('MedRAGTimeoutError');
    expect(timeoutError.statusCode).toBe(408);
  });
});