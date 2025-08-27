/**
 * PediaSignal Scoring Configuration Loader
 * 
 * Loads case-specific scoring weights and configurations from JSON files
 * without requiring code changes.
 */

import * as fs from 'fs';
import * as path from 'path';
import { WeightsConfig, StageDefinition } from '../../client/src/lib/scoringCalculator';

export interface ScoringConfig {
  configVersion: string;
  lastUpdated: string;
  description: string;
  defaultWeights: Partial<WeightsConfig>;
  caseSpecificWeights: Record<string, CaseSpecificConfig>;
  stageTimeLimits: Record<string, Record<string, number>>;
  criticalEarlyWindows: Record<string, Record<string, number>>;
  ratingThresholds: Record<string, number>;
}

export interface CaseSpecificConfig {
  description: string;
  weights: Partial<WeightsConfig>;
}

export class ScoringConfigLoader {
  private configPath: string;
  private config: ScoringConfig | null = null;
  private lastLoadTime: number = 0;
  private configReloadInterval: number = 5 * 60 * 1000; // 5 minutes

  constructor(configPath: string = 'server/config/scoringWeights.json') {
    this.configPath = configPath;
  }

  /**
   * Load scoring configuration from file
   */
  async loadConfig(): Promise<ScoringConfig> {
    const now = Date.now();
    
    // Reload config if enough time has passed or if not loaded
    if (!this.config || (now - this.lastLoadTime) > this.configReloadInterval) {
      try {
        const configData = await fs.promises.readFile(this.configPath, 'utf8');
        this.config = JSON.parse(configData);
        this.lastLoadTime = now;
        console.log(`✅ Scoring configuration loaded: ${this.config.configVersion}`);
      } catch (error) {
        console.error(`❌ Failed to load scoring configuration: ${error}`);
        // Return default config if file loading fails
        this.config = this.getDefaultConfig();
      }
    }

    return this.config!;
  }

  /**
   * Get case-specific weights configuration
   */
  async getCaseWeights(caseId: string): Promise<Partial<WeightsConfig>> {
    const config = await this.loadConfig();
    const caseConfig = config.caseSpecificWeights[caseId];
    
    if (caseConfig) {
      return {
        ...config.defaultWeights,
        ...caseConfig.weights
      };
    }
    
    return config.defaultWeights;
  }

  /**
   * Get stage definitions with time limits and early windows
   */
  async getStageDefinitions(caseId: string, baseStages: any[]): Promise<StageDefinition[]> {
    const config = await this.loadConfig();
    
    return baseStages.map((stage, index) => {
      const stageNumber = stage.stage || index + 1;
      const timeLimit = config.stageTimeLimits[caseId]?.[stageNumber.toString()];
      const earlyWindow = config.criticalEarlyWindows[caseId]?.[stageNumber.toString()];
      
      return {
        stageNumber,
        requiredLabels: stage.requiredInterventions || [],
        timeLimitSec: timeLimit,
        criticalEarlyWindowSec: earlyWindow,
        criticalEarlyLabels: this.getCriticalEarlyLabels(caseId, stageNumber)
      };
    });
  }

  /**
   * Get critical early intervention labels for a specific case and stage
   */
  private getCriticalEarlyLabels(caseId: string, stageNumber: number): string[] {
    const config = this.config;
    if (!config) return [];

    const caseConfig = config.caseSpecificWeights[caseId];
    if (!caseConfig?.weights?.criticalEarlyLabels) return [];

    // For now, return all critical labels for the case
    // In the future, this could be stage-specific
    return caseConfig.weights.criticalEarlyLabels as string[];
  }

  /**
   * Get rating thresholds
   */
  async getRatingThresholds(): Promise<Record<string, number>> {
    const config = await this.loadConfig();
    return config.ratingThresholds;
  }

  /**
   * Validate configuration
   */
  async validateConfig(): Promise<{ isValid: boolean; errors: string[] }> {
    const config = await this.loadConfig();
    const errors: string[] = [];

    // Check required fields
    if (!config.configVersion) errors.push('Missing configVersion');
    if (!config.defaultWeights) errors.push('Missing defaultWeights');
    if (!config.caseSpecificWeights) errors.push('Missing caseSpecificWeights');

    // Validate default weights
    if (config.defaultWeights) {
      if (typeof config.defaultWeights.required !== 'number') errors.push('Invalid required weight');
      if (typeof config.defaultWeights.helpful !== 'number') errors.push('Invalid helpful weight');
      if (typeof config.defaultWeights.harmful !== 'number') errors.push('Invalid harmful weight');
    }

    // Validate case-specific weights
    for (const [caseId, caseConfig] of Object.entries(config.caseSpecificWeights)) {
      if (!caseConfig.description) errors.push(`Missing description for case ${caseId}`);
      if (!caseConfig.weights) errors.push(`Missing weights for case ${caseId}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get configuration metadata
   */
  async getConfigMetadata(): Promise<{
    version: string;
    lastUpdated: string;
    description: string;
    caseCount: number;
  }> {
    const config = await this.loadConfig();
    
    return {
      version: config.configVersion,
      lastUpdated: config.lastUpdated,
      description: config.description,
      caseCount: Object.keys(config.caseSpecificWeights).length
    };
  }

  /**
   * Force reload configuration
   */
  async forceReload(): Promise<void> {
    this.config = null;
    this.lastLoadTime = 0;
    await this.loadConfig();
  }

  /**
   * Get default configuration (fallback)
   */
  private getDefaultConfig(): ScoringConfig {
    return {
      configVersion: '1.0.0',
      lastUpdated: new Date().toISOString(),
      description: 'Default scoring configuration (fallback)',
      defaultWeights: {
        required: 10,
        helpful: 4,
        neutral: 0,
        harmful: -12,
        missedRequired: -8,
        timeoutPenalty: -5,
        orderBonus: 5,
        earlyActionBonus: 5,
        maxHelpfulPerStage: 3
      },
      caseSpecificWeights: {},
      stageTimeLimits: {},
      criticalEarlyWindows: {},
      ratingThresholds: {
        'A (Gold)': 90,
        'B (Silver)': 80,
        'C (Bronze)': 70,
        'Needs Improvement': 0
      }
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a scoring configuration loader instance
 */
export function createScoringConfigLoader(configPath?: string): ScoringConfigLoader {
  return new ScoringConfigLoader(configPath);
}

/**
 * Load case-specific configuration for a given case
 */
export async function loadCaseScoringConfig(caseId: string): Promise<{
  weights: Partial<WeightsConfig>;
  stageDefinitions: StageDefinition[];
}> {
  const loader = createScoringConfigLoader();
  
  const weights = await loader.getCaseWeights(caseId);
  
  // For now, return empty stage definitions - these should be populated
  // from the actual case data when available
  const stageDefinitions: StageDefinition[] = [];
  
  return { weights, stageDefinitions };
}

/**
 * Validate and log configuration status
 */
export async function validateScoringConfiguration(): Promise<void> {
  const loader = createScoringConfigLoader();
  
  try {
    const validation = await loader.validateConfig();
    const metadata = await loader.getConfigMetadata();
    
    console.log('🔍 Scoring Configuration Validation:');
    console.log(`   Version: ${metadata.version}`);
    console.log(`   Last Updated: ${metadata.lastUpdated}`);
    console.log(`   Cases Configured: ${metadata.caseCount}`);
    console.log(`   Valid: ${validation.isValid ? '✅' : '❌'}`);
    
    if (!validation.isValid) {
      console.log('   Errors:');
      validation.errors.forEach(error => console.log(`     - ${error}`));
    }
  } catch (error) {
    console.error('❌ Failed to validate scoring configuration:', error);
  }
}
