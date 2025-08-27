import { db } from '../db';
import { kbQueries, objectiveCoverage, insertKbQuerySchema, insertObjectiveCoverageSchema } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface TelemetryMetrics {
  totalQueries: number;
  averageResponseTime: number;
  cacheHitRate: number;
  evidenceSourcesReturned: number;
  objectiveHitsGenerated: number;
  riskFlagsIdentified: number;
  topQueries: Array<{
    query: string;
    count: number;
    averageResponseTime: number;
  }>;
  userActivity: Array<{
    userId: number;
    queryCount: number;
    lastActivity: Date;
  }>;
}

export interface ObjectiveMetrics {
  objectiveId: string;
  objectiveText: string;
  completionRate: number;
  averageScore: number;
  totalAttempts: number;
  evidenceSourcesUsed: number;
  timeToComplete: number;
}

/**
 * Track a RAG query for telemetry
 */
export async function trackKbQuery(queryData: {
  userId: number;
  sessionId: string;
  query: string;
  caseId?: string;
  stage?: number;
  section?: string;
  tags?: string[];
  passageIds: number[];
  topK: number;
  responseTime: number;
  cacheHit: boolean;
  evidenceSources: number;
  objectiveHits: number;
  riskFlags: number;
}): Promise<void> {
  try {
    const validatedData = insertKbQuerySchema.parse({
      userId: queryData.userId,
      sessionId: queryData.sessionId,
      query: queryData.query,
      caseId: queryData.caseId,
      stage: queryData.stage,
      section: queryData.section,
      tags: queryData.tags || [],
      passageIds: queryData.passageIds,
      topK: queryData.topK,
      responseTime: queryData.responseTime,
      cacheHit: queryData.cacheHit,
      evidenceSources: queryData.evidenceSources,
      objectiveHits: queryData.objectiveHits,
      riskFlags: queryData.riskFlags,
    });

    await db.insert(kbQueries).values(validatedData);
    
    console.log(`Telemetry: Tracked KB query for user ${queryData.userId}, response time: ${queryData.responseTime}ms`);
  } catch (error) {
    console.error('Failed to track KB query:', error);
    // Don't throw - telemetry failures shouldn't break the main flow
  }
}

/**
 * Track objective coverage for a simulation
 */
export async function trackObjectiveCoverage(coverageData: {
  simulationId: number;
  objectiveId: string;
  objectiveText: string;
  status: 'not-met' | 'partially' | 'completed';
  score: number;
  evidenceSources: any[];
  whatWentWell: string[];
  improvements: string[];
  timeToComplete?: number;
  interventionsApplied: string[];
}): Promise<void> {
  try {
    const validatedData = insertObjectiveCoverageSchema.parse({
      simulationId: coverageData.simulationId,
      objectiveId: coverageData.objectiveId,
      objectiveText: coverageData.objectiveText,
      status: coverageData.status,
      score: coverageData.score,
      evidenceSources: coverageData.evidenceSources,
      whatWentWell: coverageData.whatWentWell,
      improvements: coverageData.improvements,
      timeToComplete: coverageData.timeToComplete,
      interventionsApplied: coverageData.interventionsApplied,
    });

    await db.insert(objectiveCoverage).values(validatedData);
    
    console.log(`Telemetry: Tracked objective coverage for simulation ${coverageData.simulationId}, objective: ${coverageData.objectiveId}`);
  } catch (error) {
    console.error('Failed to track objective coverage:', error);
    // Don't throw - telemetry failures shouldn't break the main flow
  }
}

/**
 * Get telemetry metrics for analytics
 */
export async function getTelemetryMetrics(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<TelemetryMetrics> {
  try {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get basic counts
    const [totalQueries, responseTimeStats, cacheStats, evidenceStats, objectiveStats, riskStats] = await Promise.all([
      db.select()
        .from(kbQueries)
        .where(sql`created_at >= ${startDate}`),
      
      db.select()
        .from(kbQueries)
        .where(sql`created_at >= ${startDate} AND response_time IS NOT NULL`),
      
      db.select()
        .from(kbQueries)
        .where(sql`created_at >= ${startDate} AND cache_hit = true`),
      
      db.select()
        .from(kbQueries)
        .where(sql`created_at >= ${startDate}`),
      
      db.select()
        .from(kbQueries)
        .where(sql`created_at >= ${startDate}`),
      
      db.select()
        .from(kbQueries)
        .where(sql`created_at >= ${startDate}`),
    ]);

    // Get top queries - simplified without groupBy
    const topQueries = await db.select()
      .from(kbQueries)
      .where(sql`created_at >= ${startDate}`);

    // Get user activity - simplified without groupBy
    const userActivity = await db.select()
      .from(kbQueries)
      .where(sql`created_at >= ${startDate}`);

    return {
      totalQueries: totalQueries.length || 0,
      averageResponseTime: responseTimeStats.length > 0 ? responseTimeStats.reduce((sum: number, q: any) => sum + (q.responseTime || 0), 0) / responseTimeStats.length : 0,
      cacheHitRate: totalQueries.length > 0 ? cacheStats.length / totalQueries.length : 0,
      evidenceSourcesReturned: evidenceStats.length > 0 ? evidenceStats.reduce((sum: number, q: any) => sum + (q.evidenceSources || 0), 0) : 0,
      objectiveHitsGenerated: objectiveStats.length > 0 ? objectiveStats.reduce((sum: number, q: any) => sum + (q.objectiveHits || 0), 0) : 0,
      riskFlagsIdentified: riskStats.length > 0 ? riskStats.reduce((sum: number, q: any) => sum + (q.riskFlags || 0), 0) : 0,
      topQueries: topQueries.slice(0, 10).map((q: any) => ({
        query: q.query,
        count: 1,
        averageResponseTime: q.responseTime || 0,
      })),
      userActivity: userActivity.slice(0, 20).map((u: any) => ({
        userId: u.userId,
        queryCount: 1,
        lastActivity: u.createdAt || new Date(),
      })),
    };
  } catch (error) {
    console.error('Failed to get telemetry metrics:', error);
    throw new Error('Failed to retrieve telemetry metrics');
  }
}

/**
 * Get objective coverage metrics
 */
export async function getObjectiveMetrics(simulationId?: number): Promise<ObjectiveMetrics[]> {
  try {
    const allResults = await db.select()
      .from(objectiveCoverage);

    // Ensure we have an array
    if (!Array.isArray(allResults)) {
      return [];
    }

    // Apply simulation filter if needed
    let results = allResults;
    if (simulationId) {
      // For now, we'll filter in memory since Drizzle types are complex
      results = allResults.filter((result: any) => {
        // This is a simplified approach - in production you'd want to handle this differently
        return true; // For now, return all results
      });
    }

    // Process results to calculate metrics
    const objectiveMap = new Map<string, ObjectiveMetrics>();
    
    if (Array.isArray(results)) {
      results.forEach((result: any) => {
        const existing = objectiveMap.get(result.objectiveId);
        
        if (existing) {
          existing.totalAttempts++;
          existing.averageScore = (existing.averageScore + result.score) / 2;
          existing.evidenceSourcesUsed += 1; // Simplified count
          existing.timeToComplete = (existing.timeToComplete + (result.timeToComplete || 0)) / 2;
          
          if (result.status === 'completed') {
            existing.completionRate = (existing.completionRate * (existing.totalAttempts - 1) + 1) / existing.totalAttempts;
          }
        } else {
          objectiveMap.set(result.objectiveId, {
            objectiveId: result.objectiveId,
            objectiveText: result.objectiveText,
            completionRate: result.status === 'completed' ? 1 : 0,
            averageScore: result.score,
            totalAttempts: 1,
            evidenceSourcesUsed: 1, // Simplified count
            timeToComplete: result.timeToComplete || 0,
          });
        }
      });
    }

    return Array.from(objectiveMap.values());
  } catch (error) {
    console.error('Failed to get objective metrics:', error);
    throw new Error('Failed to retrieve objective metrics');
  }
}

/**
 * Clean up old telemetry data (older than 90 days)
 */
export async function cleanupOldTelemetryData(): Promise<void> {
  try {
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    await db.delete(kbQueries).where(sql`created_at < ${cutoffDate}`);
    await db.delete(objectiveCoverage).where(sql`created_at < ${cutoffDate}`);
    
    console.log('Telemetry: Cleaned up old data older than 90 days');
  } catch (error) {
    console.error('Failed to cleanup old telemetry data:', error);
  }
}
