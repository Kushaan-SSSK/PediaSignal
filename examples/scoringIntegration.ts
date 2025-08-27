/**
 * PediaSignal Scoring System Integration Example
 * 
 * This file demonstrates how to integrate the scoring calculator
 * into the existing simulator workflow.
 */

import { 
  ScoringCalculator, 
  createCaseScoringCalculator,
  InteractionRecord,
  StageDefinition 
} from '../client/src/lib/scoringCalculator';

// ============================================================================
// INTEGRATION EXAMPLE: SIMULATOR SCORING
// ============================================================================

export class SimulatorScoringIntegration {
  private scoringCalculator: ScoringCalculator;
  private caseId: string;
  private stageStartTimes: Map<number, number> = new Map();
  private currentStage: number = 1;

  constructor(caseId: string, stageDefinitions: StageDefinition[]) {
    this.caseId = caseId;
    
    // Create scoring calculator for this case
    this.scoringCalculator = createCaseScoringCalculator(
      caseId,
      stageDefinitions
    );
    
    // Initialize first stage timing
    this.startStage(1);
  }

  /**
   * Start a new stage and record timing
   */
  startStage(stageNumber: number): void {
    this.currentStage = stageNumber;
    this.stageStartTimes.set(stageNumber, Date.now());
    this.scoringCalculator.setStageTiming(stageNumber, Date.now());
  }

  /**
   * End a stage and record timing
   */
  endStage(stageNumber: number): void {
    const endTime = Date.now();
    this.scoringCalculator.setStageTiming(stageNumber, this.stageStartTimes.get(stageNumber) || 0, endTime);
  }

  /**
   * Record an intervention for scoring
   */
  recordIntervention(
    interventionName: string,
    category: 'required' | 'helpful' | 'neutral' | 'harmful',
    success: boolean = true
  ): void {
    // Convert intervention name to match scoring expectations
    const label = this.normalizeInterventionLabel(interventionName);
    
    // Determine final category (harmful interventions are always harmful)
    const finalCategory = category === 'harmful' ? 'harmful' : 
                         success ? category : 'harmful';

    const interaction: InteractionRecord = {
      stageNumber: this.currentStage,
      label,
      category: finalCategory,
      timestamp: new Date().toISOString()
    };

    // Add to scoring calculator
    this.scoringCalculator.addInteraction(interaction);
    
    // Log for debugging
    console.log(`📊 Scoring: ${label} (${finalCategory}) - Stage ${this.currentStage}`);
  }

  /**
   * Get current running score
   */
  getRunningScore(): number {
    return this.scoringCalculator.calculateRunningScore();
  }

  /**
   * Get final score and breakdown
   */
  getFinalScore() {
    // End current stage if still active
    if (this.stageStartTimes.has(this.currentStage)) {
      this.endStage(this.currentStage);
    }
    
    return this.scoringCalculator.calculateFinalScore();
  }

  /**
   * Normalize intervention labels to match scoring expectations
   */
  private normalizeInterventionLabel(interventionName: string): string {
    // Remove classification suffixes if they exist
    return interventionName
      .replace(/\s*\(Harmful\)\s*$/i, '')
      .replace(/\s*\(Anaphylaxis\)\s*$/i, '')
      .replace(/\s*\(Neutral\)\s*$/i, '')
      .trim();
  }

  /**
   * Get scoring summary for display
   */
  getScoringSummary() {
    const result = this.getFinalScore();
    
    return {
      score: result.finalScore,
      rating: result.rating,
      breakdown: result.breakdown,
      configVersion: result.configVersion,
      incomplete: result.incomplete
    };
  }
}

// ============================================================================
// USAGE EXAMPLE: INTEGRATING WITH EXISTING SIMULATOR
// ============================================================================

export function integrateScoringWithSimulator() {
  // Example: How to integrate with existing simulator code
  
  // 1. Initialize scoring when case starts
  const stageDefinitions: StageDefinition[] = [
    {
      stageNumber: 1,
      requiredLabels: ["IM Epinephrine", "IV Fluids Bolus", "Diphenhydramine IV"],
      timeLimitSec: 300,
      criticalEarlyWindowSec: 60,
      criticalEarlyLabels: ["IM Epinephrine"]
    },
    {
      stageNumber: 2,
      requiredLabels: ["Continuous Monitoring", "H2 Blocker IV"],
      timeLimitSec: 600
    }
  ];

  const scoringIntegration = new SimulatorScoringIntegration(
    'aliem_case_01_anaphylaxis',
    stageDefinitions
  );

  // 2. Record interventions as they happen
  scoringIntegration.recordIntervention("IM Epinephrine", "required", true);
  scoringIntegration.recordIntervention("IV Fluids Bolus", "required", true);
  scoringIntegration.recordIntervention("Oral Epinephrine", "harmful", false);
  
  // 3. Progress to next stage
  scoringIntegration.startStage(2);
  
  // 4. Get running score during simulation
  const runningScore = scoringIntegration.getRunningScore();
  console.log(`Current Score: ${runningScore}/100`);
  
  // 5. Get final score when case completes
  const finalResult = scoringIntegration.getFinalScore();
  console.log(`Final Score: ${finalResult.finalScore}/100`);
  console.log(`Rating: ${finalResult.rating}`);
}

// ============================================================================
// INTEGRATION WITH EXISTING SIMULATOR STATE
// ============================================================================

export interface SimulatorState {
  currentCase: any;
  currentStage: number;
  availableInterventions: any[];
  appliedInterventions: any[];
  vitals: any;
  timeElapsed: number;
}

export function createScoringFromSimulatorState(
  simulatorState: SimulatorState,
  caseId: string
): SimulatorScoringIntegration {
  // Extract stage definitions from simulator state
  const stageDefinitions = simulatorState.currentCase.stages.map((stage: any, index: number) => ({
    stageNumber: stage.stage || index + 1,
    requiredLabels: stage.requiredInterventions || [],
    timeLimitSec: stage.timeLimit,
    criticalEarlyWindowSec: stage.criticalEarlyWindow,
    criticalEarlyLabels: stage.criticalEarlyInterventions || []
  }));

  // Create scoring integration
  const scoringIntegration = new SimulatorScoringIntegration(caseId, stageDefinitions);
  
  // Set current stage timing
  scoringIntegration.startStage(simulatorState.currentStage);
  
  // Record already applied interventions
  simulatorState.appliedInterventions.forEach(intervention => {
    const category = determineInterventionCategory(intervention);
    scoringIntegration.recordIntervention(
      intervention.name,
      category,
      intervention.success
    );
  });

  return scoringIntegration;
}

/**
 * Determine intervention category based on existing simulator logic
 */
function determineInterventionCategory(intervention: any): 'required' | 'helpful' | 'neutral' | 'harmful' {
  // This should match your existing intervention categorization logic
  if (intervention.classification === 'harmful') return 'harmful';
  if (intervention.classification === 'required') return 'required';
  if (intervention.classification === 'helpful') return 'helpful';
  return 'neutral';
}

// ============================================================================
// REAL-TIME SCORING DISPLAY
// ============================================================================

export function createScoringDisplay(scoringIntegration: SimulatorScoringIntegration) {
  // This could be a React component or DOM element
  const display = {
    updateRunningScore: () => {
      const score = scoringIntegration.getRunningScore();
      // Update UI with current score
      console.log(`🔄 Running Score: ${score}/100`);
    },
    
    updateStageProgress: (stageNumber: number) => {
      scoringIntegration.startStage(stageNumber);
      // Update UI with stage progress
      console.log(`📈 Stage ${stageNumber} started`);
    },
    
    showFinalScore: () => {
      const result = scoringIntegration.getFinalScore();
      // Display final score breakdown
      console.log(`🏁 Final Score: ${result.finalScore}/100`);
      console.log(`🏆 Rating: ${result.rating}`);
      console.log(`📊 Breakdown:`, result.breakdown);
    }
  };

  return display;
}

// ============================================================================
// EXPORT FOR USE IN SIMULATOR
// ============================================================================

export default {
  SimulatorScoringIntegration,
  integrateScoringWithSimulator,
  createScoringFromSimulatorState,
  createScoringDisplay
};
