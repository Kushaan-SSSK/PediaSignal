export interface VitalSigns {
  heartRate: number;
  temperature: number;
  respRate: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  spo2: number;
  oxygenSat?: number; // Backward compatibility with legacy field names
  bloodGlucose?: number;
  consciousness?: string;
  capillaryRefill?: number;
}

export interface Intervention {
  id: string;
  name: string;
  description: string;
  category: 'medication' | 'procedure' | 'monitoring' | 'supportive';
  timeRequired: number; // seconds
  successRate: number; // 0-1
  contraindications?: string[];
  // RAG-powered clinical reasoning
  ragSummary: string; // AI-powered concise summary from guidelines
  evidenceSources: Array<{
    caseId: string;
    section: string;
    passageId: number;
    sourceCitation: string;
    license: string;
  }>;
  vitalEffects?: {
    heartRate?: { immediate: number; delayed: number };
    spo2?: { immediate: number; delayed: number };
    oxygenSat?: { immediate: number; delayed: number }; // Backward compatibility
    respRate?: { immediate: number; delayed: number };
    bloodPressureSys?: { immediate: number; delayed: number };
    bloodPressureDia?: { immediate: number; delayed: number };
    bloodGlucose?: { immediate: number; delayed: number };
    temperature?: { immediate: number; delayed: number };
    consciousness?: { immediate: number; delayed: number };
    capillaryRefill?: { immediate: number; delayed: number };
  };
}

export interface CaseStage {
  stage: number;
  stageName?: string; // Make optional for backward compatibility
  name?: string; // ALiEM stage name
  description?: string; // Make optional for backward compatibility
  severity: 'low' | 'moderate' | 'severe';
  requiredInterventions: string[];
  helpful: string[];
  harmful: string[];
  neutral: string[];
  ordered: boolean;
  ageBand?: 'neonate' | 'infant' | 'toddler' | 'child' | 'adolescent'; // Make optional for ALiEM cases
  TTIsec: number; // Time to intervention in seconds
  vitalBounds?: { // Make optional for ALiEM cases
    heartRate: { min: number; max: number };
    respRate: { min: number; max: number };
    bloodPressureSys: { min: number; max: number };
    bloodPressureDia: { min: number; max: number };
    spo2: { min: number; max: number };
    oxygenSat?: { min: number; max: number }; // Backward compatibility
    temperature: { min: number; max: number };
    capillaryRefill: { min: number; max: number };
  };
  vitals?: VitalSigns; // Make optional for ALiEM cases
  availableInterventions?: string[]; // Make optional for ALiEM cases
  timeLimit?: number;
  criticalActions?: string[]; // Make optional for ALiEM cases
  branchingConditions?: any[]; // Make optional for ALiEM cases
}

export interface CaseDefinition {
  id: string;
  name: string;
  category: 'anaphylaxis' | 'cardiac_tamponade' | 'cah_adrenal_insufficiency' | 'congenital_heart_lesion' | 'dka' | 'foreign_body_aspiration' | 'multisystem_trauma' | 'myocarditis' | 'neonatal_delivery' | 'non_accidental_trauma' | 'pea_vf' | 'penetrating_trauma' | 'pneumonia_septic_shock' | 'status_asthmaticus' | 'status_epilepticus' | 'svt';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'moderate' | 'high' | 'critical';
  estimatedTime: number | string; // minutes or string like "8-12 minutes"
  initialVitals?: VitalSigns; // Make optional since some cases don't have it
  clinicalHistory: string;
  presentingSymptoms: string[];
  stages: CaseStage[];
  idealInterventionProgression?: {
    stage: number;
    priority: number;
    interventionId: string;
    reasoning: string;
    timeWindow: number; // seconds from stage start
    alternatives?: string[];
  }[];
  goldStandardActions?: {
    stage: number;
    actions: string[];
    timeWindow?: number; // seconds
    critical?: boolean;
  }[];
  learningObjectives?: string[];
  references?: string[];
  description?: string; // Add description field
  // ALiEM attribution fields
  sourceVersion?: string;
  license?: string;
  sourceCitation?: string;
}

// ALiEM case interface
export interface ALiEMCase {
  id: string;
  category: string;
  displayName: string;
  sourceVersion: string;
  license: string;
  sourceCitation: string;
  variants: ALiEMCaseVariant[];
}

export interface ALiEMCaseVariant {
  variantId: string;
  ageBand: string;
  ageYears: number;
  weightKg: number;
  initialVitals: {
    heartRate: number;
    respRate: number;
    bloodPressureSys: number;
    bloodPressureDia: number;
    spo2: number;
    temperature: number;
    consciousness: string;
    capillaryRefill: number;
  };
  stages: ALiEMCaseStage[];
}

export interface ALiEMCaseStage {
  stage: number;
  name: string;
  ordered: boolean;
  severity: 'low' | 'moderate' | 'severe';
  TTIsec: number;
  requiredInterventions: string[];
  helpful: string[];
  harmful: string[];
  neutral: string[];
  vitalEffects: Record<string, Record<string, number>>;
}

// Simulation session interface
export interface SimulationSession {
  id: string;
  userId: string;
  caseId: string;
  startTime: Date;
  currentStage: number;
  vitals: any;
  appliedInterventions: any[];
  timestamps: any[];
  status: 'active' | 'completed' | 'failed';
}
