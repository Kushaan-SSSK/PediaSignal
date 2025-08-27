import { db } from '../db';
import { kbPassages } from '@shared/schema';
import { RAGQuery, RAGResult } from '@shared/kb';
import { checkRateLimit, sanitizeForLogging } from './security';
import { eq, and, inArray, desc, sql } from 'drizzle-orm';

/**
 * RAG Retriever Module
 * Implements hybrid retrieval: BM25 (keyword) + embeddings with score fusion
 * Includes per-session caching and tag-based re-ranking
 */

// Session cache for retrieved passages (in production, use Redis)
const sessionCache = new Map<string, {
  passages: any[];
  timestamp: number;
  query: string;
}>();

// Tag priority scoring for re-ranking
const TAG_PRIORITIES = {
  'critical_actions': 10,
  'contraindication': 9,
  'pitfall': 8,
  'ICS1': 7,
  'ICS2': 6,
  'red-flag': 5,
  'airway': 4,
  'seizure': 3,
  'emergency': 2,
  'default': 1,
};

/**
 * Calculate BM25 score for text relevance
 */
function calculateBM25Score(
  query: string,
  text: string,
  avgDocLength: number,
  docLength: number,
  totalDocs: number,
  docFreq: number
): number {
  const k1 = 1.2;
  const b = 0.75;
  
  const queryTerms = query.toLowerCase().split(/\s+/);
  let score = 0;
  
  queryTerms.forEach(term => {
    const termFreq = (text.toLowerCase().match(new RegExp(term, 'g')) || []).length;
    const idf = Math.log((totalDocs - docFreq + 0.5) / (docFreq + 0.5));
    
    const numerator = termFreq * (k1 + 1);
    const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
    
    score += idf * (numerator / denominator);
  });
  
  return score;
}

/**
 * Calculate tag priority score
 */
function calculateTagPriority(tags: string[]): number {
  let maxPriority = TAG_PRIORITIES.default;
  
  tags.forEach(tag => {
    const priority = TAG_PRIORITIES[tag as keyof typeof TAG_PRIORITIES] || TAG_PRIORITIES.default;
    if (priority > maxPriority) {
      maxPriority = priority;
    }
  });
  
  return maxPriority;
}

/**
 * Hybrid retrieval combining BM25 and tag priority
 */
async function hybridRetrieval(
  query: string,
  caseId?: string,
  stage?: number,
  section?: string,
  tags?: string[],
  limit: number = 20
): Promise<any[]> {
  // Build base query
  let whereConditions = [];
  
  if (caseId) {
    whereConditions.push(eq(kbPassages.caseId, caseId));
  }
  
  if (stage) {
    whereConditions.push(eq(kbPassages.stage, stage));
  }
  
  if (section) {
    whereConditions.push(eq(kbPassages.section, section));
  }
  
  if (tags && tags.length > 0) {
    whereConditions.push(sql`${kbPassages.tags} ?| ${tags}`);
  }
  
  // Get passages from database
  const passages = await db
    .select()
    .from(kbPassages)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
  
  if (passages.length === 0) {
    return [];
  }
  
  // Calculate scores for each passage
  const scoredPassages = passages.map((passage: any) => {
    // Simple text matching score (in production, use proper BM25)
    const textMatchScore = calculateSimpleTextScore(query, passage.text);
    
    // Tag priority score
    const tagScore = calculateTagPriority(Array.isArray(passage.tags) ? passage.tags : []);
    
    // Combined score (weighted average)
    const combinedScore = (textMatchScore * 0.7) + (tagScore * 0.3);
    
    return {
      ...passage,
      textMatchScore,
      tagScore,
      combinedScore,
    };
  });
  
  // Sort by combined score and return top results
  return scoredPassages
    .sort((a: any, b: any) => b.combinedScore - a.combinedScore)
    .slice(0, limit);
}

/**
 * Simple text matching score (placeholder for proper BM25)
 */
function calculateSimpleTextScore(query: string, text: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();
  
  let score = 0;
  queryTerms.forEach(term => {
    const matches = (textLower.match(new RegExp(term, 'g')) || []).length;
    score += matches;
  });
  
  return score;
}

/**
 * Main retrieval function
 */
export async function retrievePassages(
  query: RAGQuery,
  useCache: boolean = true
): Promise<RAGResult> {
  const startTime = Date.now();
  
  // Rate limiting check
  if (!checkRateLimit(query.userId || 'anonymous', 'rag_retrieval', 100, 60000)) {
    throw new Error('Rate limit exceeded for RAG retrieval');
  }
  
  // Check session cache
  const cacheKey = `${query.userId || 'anonymous'}:${query.sessionId || 'no-session'}:${query.query}`;
  if (useCache && sessionCache.has(cacheKey)) {
    const cached = sessionCache.get(cacheKey)!;
    const cacheAge = Date.now() - cached.timestamp;
    
    // Cache valid for 5 minutes
    if (cacheAge < 5 * 60 * 1000) {
      console.log(`Cache hit for query: ${sanitizeForLogging(query.query)}`);
      
      // Track telemetry for cache hit
      try {
        const { trackKbQuery } = await import('../telemetry/telemetryService');
        await trackKbQuery({
          userId: parseInt(query.userId || '0'),
          sessionId: query.sessionId || 'no-session',
          query: query.query,
          caseId: query.caseId,
          stage: query.stage,
          section: query.section,
          tags: query.tags,
          passageIds: cached.passages.map(p => p.id),
          topK: query.limit || 10,
          responseTime: Date.now() - startTime,
          cacheHit: true,
          evidenceSources: cached.passages.length,
          objectiveHits: 0, // Will be updated by compose
          riskFlags: 0, // Will be updated by compose
        });
      } catch (telemetryError) {
        console.warn('Failed to track telemetry for cache hit:', telemetryError);
      }
      
      return {
        passages: cached.passages,
        totalFound: cached.passages.length,
        query: query.query,
      };
    }
  }
  
  try {
    // Perform hybrid retrieval
    const passages = await hybridRetrieval(
      query.query,
      query.caseId,
      query.stage,
      query.section,
      query.tags,
      query.limit
    );
    
    // Format results
    const formattedPassages = passages.map(passage => ({
      id: passage.id,
      text: passage.text,
      score: passage.combinedScore,
      tags: passage.tags || [],
      sourceCitation: passage.sourceCitation,
      license: passage.license,
    }));
    
    // Cache results
    if (useCache) {
      sessionCache.set(cacheKey, {
        passages: formattedPassages,
        timestamp: Date.now(),
        query: query.query,
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`RAG retrieval completed in ${duration}ms for query: ${sanitizeForLogging(query.query)}`);
    
    // Track telemetry for non-cache retrieval
    try {
      const { trackKbQuery } = await import('../telemetry/telemetryService');
      await trackKbQuery({
        userId: parseInt(query.userId || '0'),
        sessionId: query.sessionId || 'no-session',
        query: query.query,
        caseId: query.caseId,
        stage: query.stage,
        section: query.section,
        tags: query.tags,
        passageIds: formattedPassages.map(p => p.id),
        topK: query.limit || 10,
        responseTime: duration,
        cacheHit: false,
        evidenceSources: formattedPassages.length,
        objectiveHits: 0, // Will be updated by compose
        riskFlags: 0, // Will be updated by compose
      });
    } catch (telemetryError) {
      console.warn('Failed to track telemetry for retrieval:', telemetryError);
    }
    
    return {
      passages: formattedPassages,
      totalFound: formattedPassages.length,
      query: query.query,
    };
    
  } catch (error) {
    console.error('RAG retrieval error:', error);
    throw new Error(`Retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get passages by specific criteria (for prefetching)
 */
export async function getPassagesByCriteria(
  caseId: string,
  stage: number,
  sections: string[],
  limit: number = 20
): Promise<any[]> {
  try {
    const passages = await db
      .select()
      .from(kbPassages)
      .where(
        and(
          eq(kbPassages.caseId, caseId),
          eq(kbPassages.stage, stage),
          inArray(kbPassages.section, sections)
        )
      );
    
    return passages.slice(0, limit);
  } catch (error) {
    console.error('Error getting passages by criteria:', error);
    return [];
  }
}

/**
 * Search for contraindications and pitfalls
 */
export async function searchContraindications(
  intervention: string,
  caseId?: string
): Promise<any[]> {
  const query: RAGQuery = {
    query: `${intervention} contraindication pitfall warning`,
    caseId,
    tags: ['contraindication', 'pitfall', 'red-flag'],
    limit: 10,
    userId: 'system',
    sessionId: 'system',
  };
  
  try {
    const result = await retrievePassages(query, false);
    return result.passages.filter(p => 
      p.tags.some((tag: string) => ['contraindication', 'pitfall', 'red-flag'].includes(tag))
    );
  } catch (error) {
    console.error('Error searching contraindications:', error);
    return [];
  }
}

/**
 * Clear session cache
 */
export function clearSessionCache(sessionId: string): void {
  const keysToDelete: string[] = [];
  
  sessionCache.forEach((value, key) => {
    if (key.includes(sessionId)) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => sessionCache.delete(key));
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  sessionCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalEntries: number;
  totalSessions: number;
  oldestEntry: number;
} {
  const sessions = new Set<string>();
  let oldestEntry = Date.now();
  
  sessionCache.forEach((value, key) => {
    const sessionId = key.split(':')[1];
    sessions.add(sessionId);
    
    if (value.timestamp < oldestEntry) {
      oldestEntry = value.timestamp;
    }
  });
  
  return {
    totalEntries: sessionCache.size,
    totalSessions: sessions.size,
    oldestEntry,
  };
}


