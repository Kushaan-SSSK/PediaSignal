/**
 * PediaSignal Emergency Pediatrics Scoring Calculator
 * 
 * A deterministic scoring engine that converts user interventions & answers into
 * a 0-100 final score plus rating. Reusable for live runs and case completion.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface InteractionRecord {
  stageNumber: number;
  label: string;
  category: 'required' | 'helpful' | 'neutral' | 'harmful' | 'correct' | 'partial' | 'incorrect';
  timestamp: string; // ISO string
}

export interface StageDefinition {
  stageNumber: number;
  requiredLabels: string[];
  timeLimitSec?: number;
  criticalEarlyWindowSec?: number;
  criticalEarlyLabels?: string[]; // Labels that get early-action bonus
}

export interface WeightsConfig {
  // Clinical category weights
  required: number;
  helpful: number;
  neutral: number;
  harmful: number;
  missedRequired: number;
  timeoutPenalty: number;
  orderBonus: number;
  earlyActionBonus: number;
  
  // Quiz category weights (if using quiz mode)
  correct: number;
  partial: number;
  incorrect: number;
  
  // Caps and limits
  maxHelpfulPerStage: number;
  
  // Metadata
  configVersion: string;
  caseId?: string;
}

export interface ScoringBreakdown {
  byStage: StageBreakdown[];
  totals: {
    requiredCompleted: number;
    helpfulTaken: number;
    neutralTaken: number;
    harmfulTaken: number;
    missedRequired: number;
    timeoutsApplied: number;
    bonusesApplied: number;
    penaltiesApplied: number;
  };
}

export interface StageBreakdown {
  stageNumber: number;
  requiredCompleted: string[];
  harmfulTaken: string[];
  helpfulTaken: string[];
  neutralTaken: string[];
  missedRequired: string[];
  durationSec: number;
  timeoutsApplied: boolean;
  orderBonusApplied: boolean;
  earlyActionBonusApplied: boolean;
}

export interface ScoringResult {
  finalScore: number; // 0-100
  rating: 'A (Gold)' | 'B (Silver)' | 'C (Bronze)' | 'Needs Improvement';
  breakdown: ScoringBreakdown;
  configVersion: string;
  incomplete: boolean;
  rawScore: number;
  maxPossible: number;
}

// ============================================================================
// DEFAULT WEIGHTS CONFIGURATION
// ============================================================================

export const DEFAULT_WEIGHTS: WeightsConfig = {
  // Clinical category weights
  required: 10,
  helpful: 4,
  neutral: 0,
  harmful: -12,
  missedRequired: -8,
  timeoutPenalty: -5,
  orderBonus: 5,
  earlyActionBonus: 5,
  
  // Quiz category weights
  correct: 8,
  partial: 3,
  incorrect: -6,
  
  // Caps and limits
  maxHelpfulPerStage: 3,
  
  // Metadata
  configVersion: '1.0.0'
};

// ============================================================================
// SCORING CALCULATOR CLASS
// ============================================================================

export class ScoringCalculator {
  private config: WeightsConfig;
  private stageDefinitions: StageDefinition[];
  private interactionHistory: InteractionRecord[];
  private stageStartTimes: Map<number, number>;
  private stageEndTimes: Map<number, number>;

  constructor(
    config: WeightsConfig = DEFAULT_WEIGHTS,
    stageDefinitions: StageDefinition[] = [],
    interactionHistory: InteractionRecord[] = []
  ) {
    this.config = { ...DEFAULT_WEIGHTS, ...config };
    this.stageDefinitions = stageDefinitions;
    this.interactionHistory = [...interactionHistory];
    this.stageStartTimes = new Map();
    this.stageEndTimes = new Map();
  }

  /**
   * Calculate running score (for live updates during simulation)
   */
  calculateRunningScore(): number {
    const result = this.calculateFinalScore();
    return result.finalScore;
  }

  /**
   * Calculate final score with complete breakdown
   */
  calculateFinalScore(): ScoringResult {
    // Group interactions by stage
    const stageInteractions = this.groupInteractionsByStage();
    
    // Calculate stage-by-stage breakdown
    const stageBreakdowns: StageBreakdown[] = [];
    let totalRawScore = 0;
    let totalMaxPossible = 0;

    for (const stageDef of this.stageDefinitions) {
      const stageInteractionsList = stageInteractions.get(stageDef.stageNumber) || [];
      const stageBreakdown = this.calculateStageBreakdown(stageDef, stageInteractionsList);
      stageBreakdowns.push(stageBreakdown);
      
      totalRawScore += stageBreakdown.rawScore || 0;
      totalMaxPossible += stageBreakdown.maxPossible || 0;
    }

    // Calculate final score
    const finalScore = this.calculateFinalScoreValue(totalRawScore, totalMaxPossible);
    const rating = this.calculateRating(finalScore);

    // Compile totals
    const totals = this.calculateTotals(stageBreakdowns);

    return {
      finalScore,
      rating,
      breakdown: {
        byStage: stageBreakdowns,
        totals
      },
      configVersion: this.config.configVersion,
      incomplete: this.isIncomplete(),
      rawScore: totalRawScore,
      maxPossible: totalMaxPossible
    };
  }

  /**
   * Add interaction to history and recalculate
   */
  addInteraction(interaction: InteractionRecord): ScoringResult {
    this.interactionHistory.push(interaction);
    return this.calculateFinalScore();
  }

  /**
   * Set stage timing information
   */
  setStageTiming(stageNumber: number, startTime: number, endTime?: number): void {
    this.stageStartTimes.set(stageNumber, startTime);
    if (endTime) {
      this.stageEndTimes.set(stageNumber, endTime);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<WeightsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // ============================================================================
  // PRIVATE CALCULATION METHODS
  // ============================================================================

  private groupInteractionsByStage(): Map<number, InteractionRecord[]> {
    const grouped = new Map<number, InteractionRecord[]>();
    
    for (const interaction of this.interactionHistory) {
      const stage = interaction.stageNumber;
      if (!grouped.has(stage)) {
        grouped.set(stage, []);
      }
      grouped.get(stage)!.push(interaction);
    }
    
    return grouped;
  }

  private calculateStageBreakdown(
    stageDef: StageDefinition, 
    interactions: InteractionRecord[]
  ): StageBreakdown {
    const stageNumber = stageDef.stageNumber;
    const startTime = this.stageStartTimes.get(stageNumber) || 0;
    const endTime = this.stageEndTimes.get(stageNumber) || Date.now();
    const durationSec = Math.round((endTime - startTime) / 1000);

    // Categorize interactions
    const requiredCompleted = this.getUniqueLabels(interactions, 'required');
    const harmfulTaken = this.getUniqueLabels(interactions, 'harmful');
    const helpfulTaken = this.getUniqueLabels(interactions, 'helpful');
    const neutralTaken = this.getUniqueLabels(interactions, 'neutral');

    // Calculate missed required
    const missedRequired = stageDef.requiredLabels.filter(
      label => !requiredCompleted.includes(label)
    );

    // Check for timeouts
    const timeoutsApplied = this.checkStageTimeout(stageDef, durationSec);

    // Check for order bonus
    const orderBonusApplied = this.checkOrderBonus(stageDef, interactions);

    // Check for early action bonus
    const earlyActionBonusApplied = this.checkEarlyActionBonus(stageDef, interactions, startTime);

    // Calculate raw score for this stage
    const rawScore = this.calculateStageRawScore(
      stageDef,
      requiredCompleted,
      helpfulTaken,
      harmfulTaken,
      neutralTaken,
      missedRequired,
      timeoutsApplied,
      orderBonusApplied,
      earlyActionBonusApplied
    );

    // Calculate max possible for this stage
    const maxPossible = this.calculateStageMaxPossible(stageDef);

    return {
      stageNumber,
      requiredCompleted,
      harmfulTaken,
      helpfulTaken,
      neutralTaken,
      missedRequired,
      durationSec,
      timeoutsApplied,
      orderBonusApplied,
      earlyActionBonusApplied,
      rawScore,
      maxPossible
    };
  }

  private getUniqueLabels(interactions: InteractionRecord[], category: string): string[] {
    const labels = interactions
      .filter(i => i.category === category)
      .map(i => i.label);
    
    // Remove duplicates while preserving order
    return [...new Set(labels)];
  }

  private checkStageTimeout(stageDef: StageDefinition, durationSec: number): boolean {
    if (!stageDef.timeLimitSec) return false;
    return durationSec > stageDef.timeLimitSec;
  }

  private checkOrderBonus(stageDef: StageDefinition, interactions: InteractionRecord[]): boolean {
    const requiredInteractions = interactions.filter(i => i.category === 'required');
    const harmfulInteractions = interactions.filter(i => i.category === 'harmful');
    
    if (requiredInteractions.length === 0 || harmfulInteractions.length === 0) {
      return false;
    }

    // Check if all required were completed before any harmful
    const firstRequiredTime = Math.min(...requiredInteractions.map(i => new Date(i.timestamp).getTime()));
    const firstHarmfulTime = Math.min(...harmfulInteractions.map(i => new Date(i.timestamp).getTime()));
    
    return firstRequiredTime < firstHarmfulTime;
  }

  private checkEarlyActionBonus(
    stageDef: StageDefinition, 
    interactions: InteractionRecord[], 
    stageStartTime: number
  ): boolean {
    if (!stageDef.criticalEarlyWindowSec || !stageDef.criticalEarlyLabels) {
      return false;
    }

    const criticalInteractions = interactions.filter(
      i => i.category === 'required' && stageDef.criticalEarlyLabels!.includes(i.label)
    );

    if (criticalInteractions.length === 0) return false;

    // Check if any critical intervention was performed within the early window
    for (const interaction of criticalInteractions) {
      const interventionTime = new Date(interaction.timestamp).getTime();
      const timeSinceStart = interventionTime - stageStartTime;
      
      if (timeSinceStart <= stageDef.criticalEarlyWindowSec * 1000) {
        return true;
      }
    }

    return false;
  }

  private calculateStageRawScore(
    stageDef: StageDefinition,
    requiredCompleted: string[],
    helpfulTaken: string[],
    harmfulTaken: string[],
    neutralTaken: string[],
    missedRequired: string[],
    timeoutsApplied: boolean,
    orderBonusApplied: boolean,
    earlyActionBonusApplied: boolean
  ): number {
    let score = 0;

    // Required interventions (first completion only)
    score += requiredCompleted.length * this.config.required;

    // Helpful interventions (capped per stage)
    const cappedHelpful = Math.min(helpfulTaken.length, this.config.maxHelpfulPerStage);
    score += cappedHelpful * this.config.helpful;

    // Neutral interventions
    score += neutralTaken.length * this.config.neutral;

    // Harmful interventions
    score += harmfulTaken.length * this.config.harmful;

    // Missed required penalties
    score += missedRequired.length * this.config.missedRequired;

    // Timeout penalty
    if (timeoutsApplied) {
      score += this.config.timeoutPenalty;
    }

    // Order bonus
    if (orderBonusApplied) {
      score += this.config.orderBonus;
    }

    // Early action bonus
    if (earlyActionBonusApplied) {
      score += this.config.earlyActionBonus;
    }

    return score;
  }

  private calculateStageMaxPossible(stageDef: StageDefinition): number {
    let maxPossible = 0;

    // All required interventions
    maxPossible += stageDef.requiredLabels.length * this.config.required;

    // Maximum helpful interventions (capped)
    maxPossible += this.config.maxHelpfulPerStage * this.config.helpful;

    // Potential bonuses
    maxPossible += this.config.orderBonus;
    maxPossible += this.config.earlyActionBonus;

    return maxPossible;
  }

  private calculateFinalScoreValue(rawScore: number, maxPossible: number): number {
    if (maxPossible <= 0) return 0;
    
    const percentage = (rawScore / maxPossible) * 100;
    return Math.max(0, Math.min(100, Math.round(percentage)));
  }

  private calculateRating(finalScore: number): 'A (Gold)' | 'B (Silver)' | 'C (Bronze)' | 'Needs Improvement' {
    if (finalScore >= 90) return 'A (Gold)';
    if (finalScore >= 80) return 'B (Silver)';
    if (finalScore >= 70) return 'C (Bronze)';
    return 'Needs Improvement';
  }

  private calculateTotals(stageBreakdowns: StageBreakdown[]): ScoringBreakdown['totals'] {
    return {
      requiredCompleted: stageBreakdowns.reduce((sum, stage) => sum + stage.requiredCompleted.length, 0),
      helpfulTaken: stageBreakdowns.reduce((sum, stage) => sum + stage.helpfulTaken.length, 0),
      neutralTaken: stageBreakdowns.reduce((sum, stage) => sum + stage.neutralTaken.length, 0),
      harmfulTaken: stageBreakdowns.reduce((sum, stage) => sum + stage.harmfulTaken.length, 0),
      missedRequired: stageBreakdowns.reduce((sum, stage) => sum + stage.missedRequired.length, 0),
      timeoutsApplied: stageBreakdowns.reduce((sum, stage) => sum + (stage.timeoutsApplied ? 1 : 0), 0),
      bonusesApplied: stageBreakdowns.reduce((sum, stage) => {
        let bonusCount = 0;
        if (stage.orderBonusApplied) bonusCount++;
        if (stage.earlyActionBonusApplied) bonusCount++;
        return sum + bonusCount;
      }, 0),
      penaltiesApplied: stageBreakdowns.reduce((sum, stage) => {
        let penaltyCount = 0;
        if (stage.timeoutsApplied) penaltyCount++;
        penaltyCount += stage.missedRequired.length;
        penaltyCount += stage.harmfulTaken.length;
        return sum + penaltyCount;
      }, 0)
    };
  }

  private isIncomplete(): boolean {
    // Check if all stages have end times
    for (const stageDef of this.stageDefinitions) {
      if (!this.stageEndTimes.has(stageDef.stageNumber)) {
        return true;
      }
    }
    return false;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a scoring calculator instance with case-specific configuration
 */
export function createCaseScoringCalculator(
  caseId: string,
  stageDefinitions: StageDefinition[],
  customWeights?: Partial<WeightsConfig>
): ScoringCalculator {
  const config: WeightsConfig = {
    ...DEFAULT_WEIGHTS,
    ...customWeights,
    caseId,
    configVersion: customWeights?.configVersion || DEFAULT_WEIGHTS.configVersion
  };

  return new ScoringCalculator(config, stageDefinitions);
}

/**
 * Create stage definitions from case data
 */
export function createStageDefinitionsFromCase(caseData: any): StageDefinition[] {
  if (!caseData.stages) return [];

  return caseData.stages.map((stage: any, index: number) => ({
    stageNumber: stage.stage || index + 1,
    requiredLabels: stage.requiredInterventions || [],
    timeLimitSec: stage.timeLimit,
    criticalEarlyWindowSec: stage.criticalEarlyWindow,
    criticalEarlyLabels: stage.criticalEarlyInterventions || []
  }));
}

// ============================================================================
// WORKED EXAMPLES (for testing and documentation)
// ============================================================================

/**
 * Example 1: Perfect anaphylaxis case
 * Input: All required interventions completed in correct order, no harmful actions
 * Expected: 100 points, A (Gold) rating
 */
export const EXAMPLE_1 = {
  description: "Perfect anaphylaxis case - all required interventions completed correctly",
  stageDefinitions: [
    {
      stageNumber: 1,
      requiredLabels: ["IM Epinephrine", "IV Fluids Bolus", "Diphenhydramine IV"],
      timeLimitSec: 300,
      criticalEarlyWindowSec: 60,
      criticalEarlyLabels: ["IM Epinephrine"]
    }
  ],
  interactions: [
    { stageNumber: 1, label: "IM Epinephrine", category: "required", timestamp: "2024-01-01T10:00:00Z" },
    { stageNumber: 1, label: "IV Fluids Bolus", category: "required", timestamp: "2024-01-01T10:01:00Z" },
    { stageNumber: 1, label: "Diphenhydramine IV", category: "required", timestamp: "2024-01-01T10:02:00Z" }
  ],
  expectedScore: 100,
  expectedRating: "A (Gold)"
};

/**
 * Example 2: Case with harmful actions and missed required
 * Input: Some required completed, harmful actions taken, missed required interventions
 * Expected: Lower score due to penalties
 */
export const EXAMPLE_2 = {
  description: "Case with harmful actions and missed required interventions",
  stageDefinitions: [
    {
      stageNumber: 1,
      requiredLabels: ["IM Epinephrine", "IV Fluids Bolus", "Diphenhydramine IV"],
      timeLimitSec: 300
    }
  ],
  interactions: [
    { stageNumber: 1, label: "IM Epinephrine", category: "required", timestamp: "2024-01-01T10:00:00Z" },
    { stageNumber: 1, label: "Oral Epinephrine", category: "harmful", timestamp: "2024-01-01T10:01:00Z" }
    // Missing: IV Fluids Bolus, Diphenhydramine IV
  ],
  expectedScore: "Lower due to harmful action (-12) and missed required (-16)",
  expectedRating: "Needs Improvement"
};

/**
 * Example 3: Case with order bonus and early action bonus
 * Input: All required completed before any harmful, critical intervention within early window
 * Expected: Full score plus bonuses
 */
export const EXAMPLE_3 = {
  description: "Case with order bonus and early action bonus",
  stageDefinitions: [
    {
      stageNumber: 1,
      requiredLabels: ["IM Epinephrine", "IV Fluids Bolus"],
      timeLimitSec: 300,
      criticalEarlyWindowSec: 60,
      criticalEarlyLabels: ["IM Epinephrine"]
    }
  ],
  interactions: [
    { stageNumber: 1, label: "IM Epinephrine", category: "required", timestamp: "2024-01-01T10:00:00Z" },
    { stageNumber: 1, label: "IV Fluids Bolus", category: "required", timestamp: "2024-01-01T10:01:00Z" },
    { stageNumber: 1, label: "Unnecessary Intubation", category: "harmful", timestamp: "2024-01-01T10:05:00Z" }
  ],
  expectedScore: "Full required points + order bonus (+5) + early action bonus (+5)",
  expectedRating: "A (Gold)"
};
