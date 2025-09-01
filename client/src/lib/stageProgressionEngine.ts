import type { CaseDefinition, VitalSigns, CaseStage } from '@shared/types';

export interface StageState {
  severity: 'low' | 'moderate' | 'severe';
  isStabilized: boolean;
  timeInStage: number;
  stageStartAt: number;
  incorrectCount: number;
  requiredInterventionsCompleted: string[];
  orderedInterventionsCompleted: string[];
}

export interface ProgressionResult {
  shouldProgress: boolean;
  nextStage?: number;
  vitalsUpdated?: VitalSigns;
  shouldAdvance?: boolean;
  newStage?: number;
  severityEscalated?: boolean;
  failureReason?: string;
  deteriorationApplied: boolean;
  physiologicFailure?: string;
}

export interface InterventionResult {
  success: boolean;
  vitalsUpdated: VitalSigns;
  stageChange?: number;
  feedback: string;
  shouldAdvance?: boolean;
  failureReason?: string;
  classification: {
    type: 'required' | 'helpful' | 'harmful' | 'neutral';
    severity: 'low' | 'moderate' | 'severe';
  };
  threeStrikeFailure?: boolean;
  physiologicFailure?: string;
}

export interface VitalBounds {
  heartRate: { min: number; max: number };
  respRate: { min: number; max: number };
  bloodPressureSys: { min: number; max: number };
  bloodPressureDia: { min: number; max: number };
  spo2: { min: number; max: number };
  temperature: { min: number; max: number };
  capillaryRefill: { min: number; max: number };
}

// Age-based vital bounds (PALS guidelines)
const AGE_BASED_VITAL_BOUNDS: Record<string, VitalBounds> = {
  neonatal: {
    heartRate: { min: 100, max: 180 },
    respRate: { min: 30, max: 60 },
    bloodPressureSys: { min: 60, max: 90 },
    bloodPressureDia: { min: 35, max: 55 },
    spo2: { min: 95, max: 100 },
    temperature: { min: 36.5, max: 37.5 },
    capillaryRefill: { min: 0, max: 3 }
  },
  infant: {
    heartRate: { min: 80, max: 160 },
    respRate: { min: 24, max: 40 },
    bloodPressureSys: { min: 70, max: 100 },
    bloodPressureDia: { min: 40, max: 60 },
    spo2: { min: 95, max: 100 },
    temperature: { min: 36.5, max: 37.5 },
    capillaryRefill: { min: 0, max: 3 }
  },
  toddler: {
    heartRate: { min: 70, max: 140 },
    respRate: { min: 20, max: 32 },
    bloodPressureSys: { min: 80, max: 110 },
    bloodPressureDia: { min: 45, max: 65 },
    spo2: { min: 95, max: 100 },
    temperature: { min: 36.5, max: 37.5 },
    capillaryRefill: { min: 0, max: 3 }
  },
  preschool: {
    heartRate: { min: 65, max: 130 },
    respRate: { min: 18, max: 28 },
    bloodPressureSys: { min: 85, max: 115 },
    bloodPressureDia: { min: 50, max: 70 },
    spo2: { min: 95, max: 100 },
    temperature: { min: 36.5, max: 37.5 },
    capillaryRefill: { min: 0, max: 3 }
  },
  school: {
    heartRate: { min: 60, max: 120 },
    respRate: { min: 16, max: 26 },
    bloodPressureSys: { min: 90, max: 120 },
    bloodPressureDia: { min: 55, max: 75 },
    spo2: { min: 95, max: 100 },
    temperature: { min: 36.5, max: 37.5 },
    capillaryRefill: { min: 0, max: 3 }
  },
  adolescent: {
    heartRate: { min: 55, max: 110 },
    respRate: { min: 14, max: 24 },
    bloodPressureSys: { min: 95, max: 125 },
    bloodPressureDia: { min: 60, max: 80 },
    spo2: { min: 95, max: 100 },
    temperature: { min: 36.5, max: 37.5 },
    capillaryRefill: { min: 0, max: 3 }
  }
};

// Severity-based deterioration rates (per 10-second tick)
const SEVERITY_DETERIORATION_RATES = {
  low: {
    heartRate: 1,
    respRate: 0.5,
    bloodPressureSys: -0.5,
    bloodPressureDia: -0.3,
    spo2: -0.2,
    temperature: 0.1
  },
  moderate: {
    heartRate: 2,
    respRate: 1,
    bloodPressureSys: -1,
    bloodPressureDia: -0.6,
    spo2: -0.4,
    temperature: 0.2
  },
  severe: {
    heartRate: 3,
    respRate: 1.5,
    bloodPressureSys: -1.5,
    bloodPressureDia: -0.9,
    spo2: -0.6,
    temperature: 0.3
  }
};

export class StageProgressionEngine {
  private currentStage: number;
  private caseDefinition: CaseDefinition;
  private ageBand: string;
  private stageStartTime: number;
  private lastTickTime: number;
  private stageStates: Map<number, StageState>;
  private currentStageState: StageState;

  constructor(caseDefinition: CaseDefinition, ageBand: string = 'child') {
    this.caseDefinition = caseDefinition;
    this.ageBand = ageBand;
    this.currentStage = 1;
    this.stageStartTime = 0;
    this.lastTickTime = 0;
    this.stageStates = new Map();
    this.currentStageState = this.initializeStageState(1);
  }

  private initializeStageState(stageNumber: number): StageState {
    const stage = this.caseDefinition.stages.find(s => s.stage === stageNumber);
    if (!stage) {
      return {
        severity: 'moderate',
        isStabilized: false,
        timeInStage: 0,
        stageStartAt: 0,
        incorrectCount: 0,
        requiredInterventionsCompleted: [],
        orderedInterventionsCompleted: []
      };
    }

    return {
      severity: stage.severity || 'moderate',
      isStabilized: false,
      timeInStage: 0,
      stageStartAt: 0,
      incorrectCount: 0,
      requiredInterventionsCompleted: [],
      orderedInterventionsCompleted: []
    };
  }

  getCurrentStageState(): StageState {
    return this.currentStageState;
  }

  processTick(vitals: VitalSigns, timeElapsed: number): ProgressionResult {
    this.lastTickTime = timeElapsed;
    
    const stage = this.caseDefinition.stages.find(s => s.stage === this.currentStage);
    if (!stage) {
      return { 
        shouldProgress: false, 
        deteriorationApplied: false,
        shouldAdvance: false,
        severityEscalated: false,
        physiologicFailure: undefined
      };
    }

    // Check for physiologic bounds failure first
    const physiologicFailure = this.checkPhysiologicBounds(vitals, stage);
    if (physiologicFailure) {
      return {
        shouldProgress: false,
        deteriorationApplied: false,
        physiologicFailure,
        failureReason: `Physiologic instability: ${physiologicFailure}`,
        shouldAdvance: false,
        severityEscalated: false
      };
    }

    // Check if stage is already solved (≤10s stabilization override)
    const timeInStage = timeElapsed - this.currentStageState.stageStartAt;
    const isStabilized = this.checkStabilization(stage, timeInStage);
    
    if (isStabilized && !this.currentStageState.isStabilized) {
      this.currentStageState.isStabilized = true;
      console.log(`Stage ${this.currentStage} stabilized within 10s - deterioration frozen`);
    }

    // DISABLED: Automatic vital deterioration removed
    // Vitals now only change for specific interventions (epinephrine, oxygen, IV fluids)
    let deteriorationApplied = false;
    let updatedVitals = { ...vitals };
    
    // if (!this.currentStageState.isStabilized) {
    //   updatedVitals = this.applyDeterioration(vitals, stage, timeInStage);
    //   deteriorationApplied = true;
    // }

    // Check for severity escalation after N ticks (N=3)
    const tickCount = Math.floor(timeInStage / 10);
    let severityEscalated = false;
    if (tickCount >= 3 && this.currentStageState.severity !== 'severe') {
      this.escalateSeverity();
      severityEscalated = true;
    }

    // Check progression conditions
    const shouldProgress = this.checkProgressionConditions(stage);
    
    if (shouldProgress && this.currentStage < this.caseDefinition.stages.length) {
      const nextStage = this.currentStage + 1;
      this.advanceToStage(nextStage, timeElapsed);
      
      return {
        shouldProgress: true,
        nextStage,
        vitalsUpdated: updatedVitals,
        shouldAdvance: true,
        newStage: nextStage,
        severityEscalated: false,
        deteriorationApplied,
        physiologicFailure: undefined
      };
    }

    return { 
      shouldProgress: false, 
      deteriorationApplied,
      shouldAdvance: false,
      severityEscalated,
      physiologicFailure: undefined
    };
  }

  processIntervention(interventionId: string, vitals: VitalSigns): InterventionResult {
    const stage = this.caseDefinition.stages.find(s => s.stage === this.currentStage);
    if (!stage) {
      return {
        success: false,
        vitalsUpdated: vitals,
        feedback: 'Invalid stage',
        classification: { type: 'neutral', severity: 'moderate' },
        shouldAdvance: false,
        threeStrikeFailure: false,
        physiologicFailure: undefined
      };
    }

    // Classify intervention
    const classification = this.classifyIntervention(interventionId, stage);
    
    // Check for three-strike failure
    if (classification.type === 'harmful') {
      this.currentStageState.incorrectCount++;
      if (this.currentStageState.incorrectCount >= 3) {
        return {
          success: false,
          vitalsUpdated: vitals,
          feedback: 'Three harmful actions in this stage - simulation failed',
          classification,
          shouldAdvance: false,
          threeStrikeFailure: true,
          physiologicFailure: undefined,
          failureReason: 'Unsafe actions: Three harmful interventions in the same stage'
        };
      }
    }

    // Apply vital effects
    const vitalsUpdated = this.applyInterventionEffects(interventionId, vitals, classification);
    
    // Record completed intervention if it's required
    if (classification.type === 'required') {
      const interventionName = this.mapInterventionIdToName(interventionId, stage);
      if (!this.currentStageState.requiredInterventionsCompleted.includes(interventionName)) {
        this.currentStageState.requiredInterventionsCompleted.push(interventionName);
        console.log(`Required intervention ${interventionName} completed for stage ${this.currentStage}`);
      }
    }
    
    // Record ordered intervention completion if applicable
    if (stage.ordered && classification.type === 'required') {
      const interventionName = this.mapInterventionIdToName(interventionId, stage);
      if (!this.currentStageState.orderedInterventionsCompleted.includes(interventionName)) {
        this.currentStageState.orderedInterventionsCompleted.push(interventionName);
        console.log(`Ordered intervention ${interventionName} completed for stage ${this.currentStage}`);
      }
    }
    
    // Check for physiologic bounds failure after intervention
    const physiologicFailure = this.checkPhysiologicBounds(vitalsUpdated, stage);
    if (physiologicFailure) {
      return {
        success: false,
        vitalsUpdated: vitalsUpdated,
        feedback: `Intervention caused physiologic instability: ${physiologicFailure}`,
        classification,
        shouldAdvance: false,
        threeStrikeFailure: false,
        physiologicFailure
      };
    }

    // Check if this intervention completes the stage
    const shouldAdvance = this.checkProgressionConditions(stage);
    
    return {
      success: true,
      vitalsUpdated: vitalsUpdated,
      feedback: `Intervention applied successfully`,
      classification,
      shouldAdvance,
      threeStrikeFailure: false,
      physiologicFailure: undefined
    };
  }

  private classifyIntervention(interventionId: string, stage: CaseStage): { type: 'required' | 'helpful' | 'harmful' | 'neutral'; severity: 'low' | 'moderate' | 'severe' } {
    // Map intervention ID to actual intervention name
    const interventionName = this.mapInterventionIdToName(interventionId, stage);
    
    if (stage.requiredInterventions && stage.requiredInterventions.includes(interventionName)) {
      return { type: 'required', severity: stage.severity };
    } else if (stage.helpful && stage.helpful.includes(interventionName)) {
      return { type: 'helpful', severity: stage.severity };
    } else if (stage.harmful && stage.harmful.includes(interventionName)) {
      return { type: 'harmful', severity: stage.severity };
    } else if (stage.neutral && stage.neutral.includes(interventionName)) {
      return { type: 'neutral', severity: stage.severity };
    }
    
    // Default to neutral if not classified
    return { type: 'neutral', severity: stage.severity };
  }

  private mapInterventionIdToName(interventionId: string, stage: CaseStage): string {
    // Handle the mapping from intervention IDs (like "required_0") to actual intervention names
    if (interventionId.startsWith('required_')) {
      const index = parseInt(interventionId.replace('required_', ''));
      return stage.requiredInterventions?.[index] || interventionId;
    } else if (interventionId.startsWith('helpful_')) {
      const index = parseInt(interventionId.replace('helpful_', ''));
      return stage.helpful?.[index] || interventionId;
    } else if (interventionId.startsWith('harmful_')) {
      const index = parseInt(interventionId.replace('harmful_', ''));
      return stage.harmful?.[index] || interventionId;
    } else if (interventionId.startsWith('neutral_')) {
      const index = parseInt(interventionId.replace('neutral_', ''));
      return stage.neutral?.[index] || interventionId;
    }
    
    // If it doesn't match the pattern, return as-is
    return interventionId;
  }

  private applyInterventionEffects(interventionId: string, vitals: VitalSigns, classification: { type: string; severity: string }): VitalSigns {
    const updatedVitals = { ...vitals };
    
    // Get intervention name for comparison
    const interventionName = this.mapInterventionIdToName(interventionId, this.caseDefinition.stages.find(s => s.stage === this.currentStage)!);
    
    // Only apply vital changes for specific interventions
    switch (interventionName.toLowerCase()) {
      case 'im epinephrine given':
        // Patient's heart rate increases by 20 beats per minute over next 1 minute. Respiratory rate decreases to 18 breaths/ minute.
        updatedVitals.heartRate = Math.min(200, updatedVitals.heartRate + 20);
        updatedVitals.respRate = 18;
        console.log('💉 Epinephrine applied: HR +20, RR set to 18');
        break;
        
      case 'oxygen administration by mask or nebulizer':
        // Any O2 administration will increase the SpO2 to 99-100%.
        updatedVitals.spo2 = Math.min(100, Math.max(99, updatedVitals.spo2));
        console.log('🫁 Oxygen applied: SpO2 set to 99-100%');
        break;
        
      case 'iv fluids':
        // HR decreases 20
        updatedVitals.heartRate = Math.max(60, updatedVitals.heartRate - 20);
        console.log('💧 IV fluids applied: HR -20');
        break;
        
      case 'nebulized albuterol':
        // No vital changes, but will show popup feedback
        console.log('🫁 Albuterol nebulizer applied: Wheezing reduced, respiratory distress improves some');
        break;
        
      case 'diphenhydramine':
        // No vital changes, but will show popup feedback
        console.log('💊 Diphenhydramine applied: Rash fades a little, child feels less itchy');
        break;
        
      default:
        // No vital changes for any other interventions
        console.log(`📋 No vital changes for intervention: ${interventionName}`);
        break;
    }

    return updatedVitals;
  }

  private applyDeterioration(vitals: VitalSigns, stage: CaseStage, timeInStage: number): VitalSigns {
    const updatedVitals = { ...vitals };
    const deteriorationRates = SEVERITY_DETERIORATION_RATES[stage.severity];
    
    if (!deteriorationRates) return updatedVitals;

    // Apply deterioration based on severity
    Object.entries(deteriorationRates).forEach(([vital, rate]) => {
      const vitalKey = vital as keyof VitalSigns;
      if (typeof updatedVitals[vitalKey] === 'number' && typeof rate === 'number') {
        const currentValue = updatedVitals[vitalKey] as number;
        const newValue = currentValue + rate;
        
        // Apply bounds based on vital type
        switch (vitalKey) {
          case 'heartRate':
            updatedVitals[vitalKey] = Math.max(0, Math.min(300, newValue)) as any;
            break;
          case 'respRate':
            updatedVitals[vitalKey] = Math.max(0, Math.min(100, newValue)) as any;
            break;
          case 'bloodPressureSys':
            updatedVitals[vitalKey] = Math.max(0, Math.min(300, newValue)) as any;
            break;
          case 'bloodPressureDia':
            updatedVitals[vitalKey] = Math.max(0, Math.min(200, newValue)) as any;
            break;
          case 'spo2':
            updatedVitals[vitalKey] = Math.max(0, Math.min(100, newValue)) as any;
            break;
          case 'temperature':
            updatedVitals[vitalKey] = Math.max(30, Math.min(45, newValue)) as any;
            break;
          case 'capillaryRefill':
            updatedVitals[vitalKey] = Math.max(0, Math.min(5, newValue)) as any;
            break;
        }
      }
    });

    return updatedVitals;
  }

  private checkPhysiologicBounds(vitals: VitalSigns, stage: CaseStage): string | null {
    // Use stage-specific bounds if available, otherwise use age-based bounds
    const bounds = stage.vitalBounds || AGE_BASED_VITAL_BOUNDS[this.ageBand];
    if (!bounds) return null;

    // Check each vital against bounds
    if (vitals.heartRate < bounds.heartRate.min || vitals.heartRate > bounds.heartRate.max) {
      return `Heart rate ${vitals.heartRate} outside normal range (${bounds.heartRate.min}-${bounds.heartRate.max})`;
    }
    
    if (vitals.respRate < bounds.respRate.min || vitals.respRate > bounds.respRate.max) {
      return `Respiratory rate ${vitals.respRate} outside normal range (${bounds.respRate.min}-${bounds.respRate.max})`;
    }
    
    if (vitals.bloodPressureSys < bounds.bloodPressureSys.min || vitals.bloodPressureSys > bounds.bloodPressureSys.max) {
      return `Systolic BP ${vitals.bloodPressureSys} outside normal range (${bounds.bloodPressureSys.min}-${bounds.bloodPressureSys.max})`;
    }
    
    if (vitals.spo2 < bounds.spo2.min) {
      return `SpO2 ${vitals.spo2} below critical threshold (${bounds.spo2.min})`;
    }
    
    if (vitals.temperature < bounds.temperature.min || vitals.temperature > bounds.temperature.max) {
      return `Temperature ${vitals.temperature} outside normal range (${bounds.temperature.min}-${bounds.temperature.max})`;
    }

    return null;
  }

  private checkStabilization(stage: CaseStage, timeInStage: number): boolean {
    // Early stabilization override: if all required interventions completed within 10s
    if (timeInStage <= 10) {
      // Check if requiredInterventions exists and has items
      if (!stage.requiredInterventions || stage.requiredInterventions.length === 0) {
        return false; // No required interventions to check
      }
      
      const allRequiredCompleted = stage.requiredInterventions.every(req => 
        this.currentStageState.requiredInterventionsCompleted.includes(req)
      );
      
      if (allRequiredCompleted) {
        // Check ordered requirement if applicable
        if (stage.ordered) {
          return this.checkOrderedCompletion(stage);
        }
        return true;
      }
    }
    
    return false;
  }

  private checkOrderedCompletion(stage: CaseStage): boolean {
    if (!stage.ordered) return true;
    
    // Check if requiredInterventions exists
    if (!stage.requiredInterventions || stage.requiredInterventions.length === 0) {
      return false;
    }
    
    // Check if interventions were completed in the correct order
    const requiredOrder = stage.requiredInterventions;
    const completedOrder = this.currentStageState.orderedInterventionsCompleted;
    
    // All required interventions must be completed
    if (completedOrder.length < requiredOrder.length) return false;
    
    // Check if order matches
    for (let i = 0; i < requiredOrder.length; i++) {
      if (completedOrder[i] !== requiredOrder[i]) return false;
    }
    
    return true;
  }

  private checkProgressionConditions(stage: CaseStage): boolean {
    // Check if requiredInterventions exists and has items
    if (!stage.requiredInterventions || stage.requiredInterventions.length === 0) {
      return false; // No required interventions to complete
    }
    
    // Check if all required interventions are completed
    const allRequiredCompleted = stage.requiredInterventions.every(req => 
      this.currentStageState.requiredInterventionsCompleted.includes(req)
    );
    
    if (!allRequiredCompleted) return false;
    
    // If ordered is true, check order requirement
    if (stage.ordered) {
      return this.checkOrderedCompletion(stage);
    }
    
    return true;
  }

  private escalateSeverity(): void {
    const currentSeverity = this.currentStageState.severity;
    
    switch (currentSeverity) {
      case 'low':
        this.currentStageState.severity = 'moderate';
        break;
      case 'moderate':
        this.currentStageState.severity = 'severe';
        break;
      case 'severe':
        // Already at maximum severity
        break;
    }
    
    console.log(`Stage ${this.currentStage} severity escalated to ${this.currentStageState.severity}`);
  }

  private advanceToStage(stageNumber: number, timeElapsed: number): void {
    this.currentStage = stageNumber;
    this.stageStartTime = timeElapsed;
    this.currentStageState = this.initializeStageState(stageNumber);
    this.currentStageState.stageStartAt = timeElapsed;
    
    // Reset severity escalation for new stage
    const stage = this.caseDefinition.stages.find(s => s.stage === stageNumber);
    if (stage) {
      this.currentStageState.severity = stage.severity || 'moderate';
    }
  }

  getCurrentStage(): number {
    return this.currentStage;
  }

  reset(): void {
    this.currentStage = 1;
    this.stageStartTime = 0;
    this.lastTickTime = 0;
    this.stageStates.clear();
    this.currentStageState = this.initializeStageState(1);
  }
}
