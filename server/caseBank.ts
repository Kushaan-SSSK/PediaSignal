import { z } from "zod";

export interface VitalSigns {
  heartRate: number;
  temperature: number;
  respRate: number;
  bloodPressure?: string;
  oxygenSat?: number;
  bloodGlucose?: number;
  consciousness?: string;
}

export interface Intervention {
  id: string;
  name: string;
  description: string;
  category: 'medication' | 'procedure' | 'monitoring' | 'supportive';
  timeRequired: number; // seconds
  successRate: number; // 0-1
  contraindications?: string[];
}

export interface CaseStage {
  stage: number;
  description: string;
  vitals: VitalSigns;
  availableInterventions: string[];
  timeLimit?: number; // seconds
  criticalActions: string[];
  branchingConditions: {
    condition: string;
    nextStage: number;
    vitalsChange: Partial<VitalSigns>;
  }[];
}

export interface CaseDefinition {
  id: string;
  name: string;
  category: 'febrile_seizure' | 'respiratory_distress' | 'asthma_exacerbation' | 'anaphylaxis' | 'sepsis' | 'dehydration' | 'trauma' | 'cardiac_arrest';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: number; // minutes
  initialVitals: VitalSigns;
  clinicalHistory: string;
  presentingSymptoms: string[];
  stages: CaseStage[];
  goldStandardActions: {
    stage: number;
    actions: string[];
    timeWindow: number; // seconds
    critical: boolean;
  }[];
  learningObjectives: string[];
  references: string[];
}

// Case Bank Data
export const caseBank: CaseDefinition[] = [
  {
    id: "febrile_seizure_01",
    name: "Febrile Seizure - 3-year-old",
    category: "febrile_seizure",
    difficulty: "intermediate",
    estimatedTime: 15,
    initialVitals: {
      heartRate: 145,
      temperature: 103.2,
      respRate: 32,
      oxygenSat: 96,
      consciousness: "post-ictal"
    },
    clinicalHistory: "3-year-old previously healthy child with 2-day history of fever (101-103°F) and upper respiratory symptoms. No prior seizures. Parents report 2-minute generalized tonic-clonic seizure that stopped before arrival.",
    presentingSymptoms: ["Fever", "Seizure activity", "Post-ictal state", "Upper respiratory symptoms"],
    stages: [
      {
        stage: 1,
        description: "Initial assessment and stabilization",
        vitals: {
          heartRate: 145,
          temperature: 103.2,
          respRate: 32,
          oxygenSat: 96,
          consciousness: "post-ictal"
        },
        availableInterventions: ["assess_airway", "check_vitals", "obtain_history", "start_monitoring"],
        timeLimit: 120,
        criticalActions: ["Ensure airway patency", "Check vital signs", "Obtain seizure history"],
        branchingConditions: [
          {
            condition: "airway_compromised",
            nextStage: 2,
            vitalsChange: { oxygenSat: 88, respRate: 45 }
          }
        ]
      },
      {
        stage: 2,
        description: "Fever management and seizure prevention",
        vitals: {
          heartRate: 140,
          temperature: 102.8,
          respRate: 30,
          oxygenSat: 94,
          consciousness: "improving"
        },
        availableInterventions: ["antipyretic", "cooling_measures", "seizure_prophylaxis", "iv_access"],
        timeLimit: 180,
        criticalActions: ["Administer antipyretic", "Consider cooling measures", "Monitor for recurrent seizures"],
        branchingConditions: [
          {
            condition: "recurrent_seizure",
            nextStage: 3,
            vitalsChange: { consciousness: "seizing", respRate: 40 }
          }
        ]
      },
      {
        stage: 3,
        description: "Workup and disposition planning",
        vitals: {
          heartRate: 135,
          temperature: 101.5,
          respRate: 28,
          oxygenSat: 96,
          consciousness: "alert"
        },
        availableInterventions: ["labs", "imaging", "discharge_planning", "follow_up"],
        timeLimit: 300,
        criticalActions: ["Consider laboratory workup", "Determine disposition", "Provide family education"],
        branchingConditions: []
      }
    ],
    goldStandardActions: [
      {
        stage: 1,
        actions: ["assess_airway", "check_vitals", "obtain_history"],
        timeWindow: 60,
        critical: true
      },
      {
        stage: 2,
        actions: ["antipyretic", "cooling_measures"],
        timeWindow: 120,
        critical: true
      },
      {
        stage: 3,
        actions: ["labs", "discharge_planning"],
        timeWindow: 180,
        critical: false
      }
    ],
    learningObjectives: [
      "Recognize and manage febrile seizures",
      "Understand when to perform workup",
      "Provide appropriate family education",
      "Determine safe discharge criteria"
    ],
    references: [
      "AAP Clinical Practice Guideline: Febrile Seizures",
      "Pediatric Emergency Medicine: Principles and Practice"
    ]
  },
  {
    id: "respiratory_distress_01",
    name: "Respiratory Distress - 18-month-old",
    category: "respiratory_distress",
    difficulty: "advanced",
    estimatedTime: 20,
    initialVitals: {
      heartRate: 160,
      temperature: 99.8,
      respRate: 45,
      oxygenSat: 88,
      consciousness: "alert"
    },
    clinicalHistory: "18-month-old with 3-day history of cough and congestion. Parents report increased work of breathing, nasal flaring, and retractions for the past 6 hours. No fever. No known asthma.",
    presentingSymptoms: ["Increased work of breathing", "Nasal flaring", "Retractions", "Cough", "Congestion"],
    stages: [
      {
        stage: 1,
        description: "Initial respiratory assessment",
        vitals: {
          heartRate: 160,
          temperature: 99.8,
          respRate: 45,
          oxygenSat: 88,
          consciousness: "alert"
        },
        availableInterventions: ["assess_breathing", "oxygen_support", "nebulizer", "chest_xray"],
        timeLimit: 90,
        criticalActions: ["Assess respiratory effort", "Provide oxygen if needed", "Consider bronchodilator"],
        branchingConditions: [
          {
            condition: "respiratory_failure",
            nextStage: 2,
            vitalsChange: { oxygenSat: 82, respRate: 55, consciousness: "lethargic" }
          }
        ]
      },
      {
        stage: 2,
        description: "Advanced respiratory support",
        vitals: {
          heartRate: 170,
          temperature: 99.5,
          respRate: 50,
          oxygenSat: 85,
          consciousness: "alert"
        },
        availableInterventions: ["nebulizer", "steroids", "iv_access", "continuous_monitoring"],
        timeLimit: 120,
        criticalActions: ["Administer bronchodilator", "Consider steroids", "Monitor closely"],
        branchingConditions: [
          {
            condition: "improvement",
            nextStage: 3,
            vitalsChange: { oxygenSat: 92, respRate: 35 }
          }
        ]
      },
      {
        stage: 3,
        description: "Disposition and follow-up",
        vitals: {
          heartRate: 150,
          temperature: 99.2,
          respRate: 32,
          oxygenSat: 94,
          consciousness: "alert"
        },
        availableInterventions: ["discharge_planning", "prescription", "follow_up", "education"],
        timeLimit: 180,
        criticalActions: ["Determine disposition", "Provide medications", "Arrange follow-up"],
        branchingConditions: []
      }
    ],
    goldStandardActions: [
      {
        stage: 1,
        actions: ["assess_breathing", "oxygen_support", "nebulizer"],
        timeWindow: 60,
        critical: true
      },
      {
        stage: 2,
        actions: ["nebulizer", "steroids"],
        timeWindow: 90,
        critical: true
      },
      {
        stage: 3,
        actions: ["discharge_planning", "prescription"],
        timeWindow: 120,
        critical: false
      }
    ],
    learningObjectives: [
      "Assess pediatric respiratory distress",
      "Manage bronchiolitis",
      "Recognize respiratory failure",
      "Provide appropriate discharge instructions"
    ],
    references: [
      "AAP Clinical Practice Guideline: Bronchiolitis",
      "Pediatric Respiratory Emergencies"
    ]
  },
  {
    id: "asthma_exacerbation_01",
    name: "Asthma Exacerbation - 8-year-old",
    category: "asthma_exacerbation",
    difficulty: "intermediate",
    estimatedTime: 18,
    initialVitals: {
      heartRate: 140,
      temperature: 98.6,
      respRate: 40,
      oxygenSat: 90,
      consciousness: "alert"
    },
    clinicalHistory: "8-year-old with known asthma presents with 2-hour history of wheezing and shortness of breath. Used albuterol inhaler 3 times with minimal relief. No fever. Peak flow 40% of personal best.",
    presentingSymptoms: ["Wheezing", "Shortness of breath", "Chest tightness", "Cough"],
    stages: [
      {
        stage: 1,
        description: "Initial asthma assessment",
        vitals: {
          heartRate: 140,
          temperature: 98.6,
          respRate: 40,
          oxygenSat: 90,
          consciousness: "alert"
        },
        availableInterventions: ["peak_flow", "nebulizer", "oxygen", "steroids"],
        timeLimit: 120,
        criticalActions: ["Assess peak flow", "Administer bronchodilator", "Provide oxygen if needed"],
        branchingConditions: [
          {
            condition: "severe_exacerbation",
            nextStage: 2,
            vitalsChange: { oxygenSat: 85, respRate: 45, consciousness: "anxious" }
          }
        ]
      },
      {
        stage: 2,
        description: "Moderate-severe exacerbation management",
        vitals: {
          heartRate: 150,
          temperature: 98.4,
          respRate: 42,
          oxygenSat: 88,
          consciousness: "alert"
        },
        availableInterventions: ["continuous_nebulizer", "iv_steroids", "magnesium", "admission_prep"],
        timeLimit: 180,
        criticalActions: ["Continuous bronchodilator", "IV steroids", "Consider magnesium"],
        branchingConditions: [
          {
            condition: "improvement",
            nextStage: 3,
            vitalsChange: { oxygenSat: 92, respRate: 35 }
          }
        ]
      },
      {
        stage: 3,
        description: "Disposition and asthma action plan",
        vitals: {
          heartRate: 130,
          temperature: 98.6,
          respRate: 28,
          oxygenSat: 94,
          consciousness: "alert"
        },
        availableInterventions: ["discharge_planning", "asthma_action_plan", "prescription", "education"],
        timeLimit: 240,
        criticalActions: ["Update asthma action plan", "Provide medications", "Arrange follow-up"],
        branchingConditions: []
      }
    ],
    goldStandardActions: [
      {
        stage: 1,
        actions: ["peak_flow", "nebulizer", "oxygen"],
        timeWindow: 60,
        critical: true
      },
      {
        stage: 2,
        actions: ["continuous_nebulizer", "iv_steroids"],
        timeWindow: 90,
        critical: true
      },
      {
        stage: 3,
        actions: ["asthma_action_plan", "prescription"],
        timeWindow: 120,
        critical: false
      }
    ],
    learningObjectives: [
      "Assess asthma severity",
      "Manage acute asthma exacerbation",
      "Recognize treatment failure",
      "Provide asthma education"
    ],
    references: [
      "NAEPP Guidelines: Asthma Management",
      "Pediatric Asthma: Emergency Management"
    ]
  },
  {
    id: "anaphylaxis_01",
    name: "Anaphylaxis - 5-year-old",
    category: "anaphylaxis",
    difficulty: "expert",
    estimatedTime: 12,
    initialVitals: {
      heartRate: 170,
      temperature: 98.6,
      respRate: 38,
      oxygenSat: 92,
      consciousness: "alert"
    },
    clinicalHistory: "5-year-old with known peanut allergy accidentally ingested peanut butter cookie 15 minutes ago. Now has hives, facial swelling, and difficulty breathing. Parents administered epinephrine auto-injector 5 minutes ago.",
    presentingSymptoms: ["Hives", "Facial swelling", "Difficulty breathing", "Anxiety", "Nausea"],
    stages: [
      {
        stage: 1,
        description: "Immediate anaphylaxis management",
        vitals: {
          heartRate: 170,
          temperature: 98.6,
          respRate: 38,
          oxygenSat: 92,
          consciousness: "alert"
        },
        availableInterventions: ["epinephrine", "airway_assessment", "oxygen", "iv_access"],
        timeLimit: 60,
        criticalActions: ["Assess airway", "Administer epinephrine", "Provide oxygen"],
        branchingConditions: [
          {
            condition: "airway_compromise",
            nextStage: 2,
            vitalsChange: { oxygenSat: 85, respRate: 45, consciousness: "anxious" }
          }
        ]
      },
      {
        stage: 2,
        description: "Advanced airway and cardiovascular support",
        vitals: {
          heartRate: 160,
          temperature: 98.4,
          respRate: 40,
          oxygenSat: 88,
          consciousness: "alert"
        },
        availableInterventions: ["second_epinephrine", "steroids", "antihistamine", "fluids"],
        timeLimit: 120,
        criticalActions: ["Consider second epinephrine", "IV steroids", "IV fluids"],
        branchingConditions: [
          {
            condition: "improvement",
            nextStage: 3,
            vitalsChange: { oxygenSat: 94, respRate: 32 }
          }
        ]
      },
      {
        stage: 3,
        description: "Observation and discharge planning",
        vitals: {
          heartRate: 140,
          temperature: 98.6,
          respRate: 28,
          oxygenSat: 96,
          consciousness: "alert"
        },
        availableInterventions: ["observation", "discharge_planning", "allergy_referral", "education"],
        timeLimit: 180,
        criticalActions: ["Observe for biphasic reaction", "Update allergy action plan", "Arrange follow-up"],
        branchingConditions: []
      }
    ],
    goldStandardActions: [
      {
        stage: 1,
        actions: ["epinephrine", "airway_assessment", "oxygen"],
        timeWindow: 30,
        critical: true
      },
      {
        stage: 2,
        actions: ["second_epinephrine", "steroids", "fluids"],
        timeWindow: 60,
        critical: true
      },
      {
        stage: 3,
        actions: ["observation", "allergy_referral"],
        timeWindow: 120,
        critical: false
      }
    ],
    learningObjectives: [
      "Recognize anaphylaxis",
      "Manage acute anaphylaxis",
      "Prevent biphasic reactions",
      "Provide allergy education"
    ],
    references: [
      "AAAAI Anaphylaxis Guidelines",
      "Pediatric Anaphylaxis: Emergency Management"
    ]
  }
];

// Intervention definitions
export const interventions: Record<string, Intervention> = {
  assess_airway: {
    id: "assess_airway",
    name: "Assess Airway",
    description: "Evaluate airway patency and breathing",
    category: "monitoring",
    timeRequired: 30,
    successRate: 0.95
  },
  check_vitals: {
    id: "check_vitals",
    name: "Check Vital Signs",
    description: "Monitor heart rate, blood pressure, temperature, respiratory rate",
    category: "monitoring",
    timeRequired: 60,
    successRate: 0.98
  },
  obtain_history: {
    id: "obtain_history",
    name: "Obtain History",
    description: "Gather relevant medical history and current symptoms",
    category: "monitoring",
    timeRequired: 120,
    successRate: 0.90
  },
  start_monitoring: {
    id: "start_monitoring",
    name: "Start Continuous Monitoring",
    description: "Initiate continuous vital sign monitoring",
    category: "monitoring",
    timeRequired: 45,
    successRate: 0.95
  },
  antipyretic: {
    id: "antipyretic",
    name: "Administer Antipyretic",
    description: "Give acetaminophen or ibuprofen for fever",
    category: "medication",
    timeRequired: 60,
    successRate: 0.85
  },
  cooling_measures: {
    id: "cooling_measures",
    name: "Cooling Measures",
    description: "Apply cooling blankets, fans, or tepid sponging",
    category: "supportive",
    timeRequired: 90,
    successRate: 0.80
  },
  seizure_prophylaxis: {
    id: "seizure_prophylaxis",
    name: "Seizure Prophylaxis",
    description: "Consider benzodiazepine for seizure prevention",
    category: "medication",
    timeRequired: 120,
    successRate: 0.75,
    contraindications: ["respiratory depression"]
  },
  iv_access: {
    id: "iv_access",
    name: "Establish IV Access",
    description: "Place intravenous line for medication administration",
    category: "procedure",
    timeRequired: 180,
    successRate: 0.70
  },
  labs: {
    id: "labs",
    name: "Laboratory Studies",
    description: "Order CBC, electrolytes, glucose, cultures as indicated",
    category: "procedure",
    timeRequired: 300,
    successRate: 0.90
  },
  imaging: {
    id: "imaging",
    name: "Imaging Studies",
    description: "Order chest X-ray, CT, or other imaging as indicated",
    category: "procedure",
    timeRequired: 600,
    successRate: 0.85
  },
  discharge_planning: {
    id: "discharge_planning",
    name: "Discharge Planning",
    description: "Determine safe discharge criteria and arrange follow-up",
    category: "supportive",
    timeRequired: 180,
    successRate: 0.95
  },
  follow_up: {
    id: "follow_up",
    name: "Arrange Follow-up",
    description: "Schedule appropriate follow-up appointments",
    category: "supportive",
    timeRequired: 120,
    successRate: 0.90
  },
  assess_breathing: {
    id: "assess_breathing",
    name: "Assess Breathing",
    description: "Evaluate respiratory effort, breath sounds, and oxygen saturation",
    category: "monitoring",
    timeRequired: 45,
    successRate: 0.95
  },
  oxygen_support: {
    id: "oxygen_support",
    name: "Oxygen Support",
    description: "Provide supplemental oxygen via nasal cannula or mask",
    category: "supportive",
    timeRequired: 60,
    successRate: 0.90
  },
  nebulizer: {
    id: "nebulizer",
    name: "Nebulized Bronchodilator",
    description: "Administer albuterol via nebulizer",
    category: "medication",
    timeRequired: 300,
    successRate: 0.85
  },
  chest_xray: {
    id: "chest_xray",
    name: "Chest X-ray",
    description: "Order chest X-ray to evaluate for pneumonia or other pathology",
    category: "procedure",
    timeRequired: 600,
    successRate: 0.90
  },
  steroids: {
    id: "steroids",
    name: "Corticosteroids",
    description: "Administer oral or IV corticosteroids for inflammation",
    category: "medication",
    timeRequired: 120,
    successRate: 0.80
  },
  continuous_monitoring: {
    id: "continuous_monitoring",
    name: "Continuous Monitoring",
    description: "Maintain continuous vital sign and respiratory monitoring",
    category: "monitoring",
    timeRequired: 0,
    successRate: 0.95
  },
  peak_flow: {
    id: "peak_flow",
    name: "Peak Flow Measurement",
    description: "Measure peak expiratory flow rate",
    category: "monitoring",
    timeRequired: 60,
    successRate: 0.85
  },
  continuous_nebulizer: {
    id: "continuous_nebulizer",
    name: "Continuous Nebulizer",
    description: "Provide continuous albuterol nebulization",
    category: "medication",
    timeRequired: 600,
    successRate: 0.80
  },
  magnesium: {
    id: "magnesium",
    name: "Magnesium Sulfate",
    description: "Administer IV magnesium for severe asthma",
    category: "medication",
    timeRequired: 300,
    successRate: 0.75
  },
  admission_prep: {
    id: "admission_prep",
    name: "Prepare for Admission",
    description: "Arrange hospital admission for continued care",
    category: "supportive",
    timeRequired: 180,
    successRate: 0.90
  },
  asthma_action_plan: {
    id: "asthma_action_plan",
    name: "Asthma Action Plan",
    description: "Update asthma action plan and provide education",
    category: "supportive",
    timeRequired: 240,
    successRate: 0.85
  },
  prescription: {
    id: "prescription",
    name: "Prescribe Medications",
    description: "Prescribe appropriate medications for discharge",
    category: "supportive",
    timeRequired: 120,
    successRate: 0.95
  },
  education: {
    id: "education",
    name: "Patient Education",
    description: "Provide comprehensive patient and family education",
    category: "supportive",
    timeRequired: 300,
    successRate: 0.80
  },
  epinephrine: {
    id: "epinephrine",
    name: "Epinephrine",
    description: "Administer intramuscular epinephrine for anaphylaxis",
    category: "medication",
    timeRequired: 60,
    successRate: 0.95
  },
  airway_assessment: {
    id: "airway_assessment",
    name: "Airway Assessment",
    description: "Evaluate airway patency and breathing in anaphylaxis",
    category: "monitoring",
    timeRequired: 45,
    successRate: 0.95
  },
  second_epinephrine: {
    id: "second_epinephrine",
    name: "Second Epinephrine",
    description: "Administer second dose of epinephrine if needed",
    category: "medication",
    timeRequired: 60,
    successRate: 0.90
  },
  antihistamine: {
    id: "antihistamine",
    name: "Antihistamine",
    description: "Administer diphenhydramine for allergic symptoms",
    category: "medication",
    timeRequired: 120,
    successRate: 0.85
  },
  fluids: {
    id: "fluids",
    name: "IV Fluids",
    description: "Administer intravenous fluids for volume support",
    category: "supportive",
    timeRequired: 180,
    successRate: 0.90
  },
  observation: {
    id: "observation",
    name: "Extended Observation",
    description: "Observe for biphasic reaction in anaphylaxis",
    category: "monitoring",
    timeRequired: 240,
    successRate: 0.95
  },
  allergy_referral: {
    id: "allergy_referral",
    name: "Allergy Referral",
    description: "Arrange follow-up with allergist",
    category: "supportive",
    timeRequired: 120,
    successRate: 0.85
  }
};

// Random case selection function
export function getRandomCase(category?: string): CaseDefinition {
  let availableCases = caseBank;
  
  if (category) {
    availableCases = caseBank.filter(case_ => case_.category === category);
  }
  
  if (availableCases.length === 0) {
    throw new Error(`No cases found for category: ${category}`);
  }
  
  const randomIndex = Math.floor(Math.random() * availableCases.length);
  return availableCases[randomIndex];
}

// Get all available categories
export function getAvailableCategories(): string[] {
  const categories = new Set(caseBank.map(case_ => case_.category));
  return Array.from(categories);
}

// Get cases by category
export function getCasesByCategory(category: string): CaseDefinition[] {
  return caseBank.filter(case_ => case_.category === category);
}

// Simulation session tracking
export interface SimulationSession {
  id: string;
  userId: number;
  caseId: string;
  startTime: Date;
  currentStage: number;
  vitals: VitalSigns;
  appliedInterventions: string[];
  timestamps: { intervention: string; time: Date }[];
  status: 'active' | 'paused' | 'completed' | 'failed';
  score?: number;
  feedback?: SimulationFeedback;
}

export interface SimulationFeedback {
  summary: string;
  missedActions: string[];
  unnecessaryActions: string[];
  suggestions: string[];
  finalScore: number;
  outcome: 'excellent' | 'good' | 'fair' | 'poor';
}

// Evaluation function
export function evaluateSimulation(session: SimulationSession, caseDefinition: CaseDefinition): SimulationFeedback {
  const goldStandard = caseDefinition.goldStandardActions;
  const appliedActions = session.appliedInterventions;
  
  let totalScore = 0;
  const missedActions: string[] = [];
  const unnecessaryActions: string[] = [];
  const suggestions: string[] = [];
  
  // Evaluate each stage
  for (const stage of goldStandard) {
    const stageActions = appliedActions.filter(action => {
      // This is a simplified evaluation - in practice, you'd track which stage each action was applied in
      return true;
    });
    
    const criticalActions = stage.actions.filter(action => stage.critical);
    const nonCriticalActions = stage.actions.filter(action => !stage.critical);
    
    // Check critical actions
    let criticalScore = 0;
    for (const action of criticalActions) {
      if (stageActions.includes(action)) {
        criticalScore += 1;
      } else {
        missedActions.push(`Stage ${stage.stage}: ${action}`);
      }
    }
    
    // Check non-critical actions
    let nonCriticalScore = 0;
    for (const action of nonCriticalActions) {
      if (stageActions.includes(action)) {
        nonCriticalScore += 1;
      }
    }
    
    // Calculate stage score
    const criticalWeight = 0.7;
    const nonCriticalWeight = 0.3;
    const stageScore = (criticalScore / criticalActions.length * criticalWeight) + 
                      (nonCriticalScore / nonCriticalActions.length * nonCriticalWeight);
    
    totalScore += stageScore;
  }
  
  // Check for unnecessary actions
  const allGoldStandardActions = goldStandard.flatMap(stage => stage.actions);
  for (const action of appliedActions) {
    if (!allGoldStandardActions.includes(action)) {
      unnecessaryActions.push(action);
    }
  }
  
  // Calculate final score
  const finalScore = Math.round((totalScore / goldStandard.length) * 100);
  
  // Determine outcome
  let outcome: 'excellent' | 'good' | 'fair' | 'poor';
  if (finalScore >= 90) outcome = 'excellent';
  else if (finalScore >= 75) outcome = 'good';
  else if (finalScore >= 60) outcome = 'fair';
  else outcome = 'poor';
  
  // Generate suggestions
  if (missedActions.length > 0) {
    suggestions.push("Focus on completing all critical actions in each stage");
  }
  if (unnecessaryActions.length > 0) {
    suggestions.push("Avoid unnecessary interventions that may delay care");
  }
  if (finalScore < 75) {
    suggestions.push("Review the case objectives and practice time management");
  }
  
  return {
    summary: `Completed ${caseDefinition.name} with ${finalScore}% accuracy`,
    missedActions,
    unnecessaryActions,
    suggestions,
    finalScore,
    outcome
  };
}

// Zod schemas for validation
export const caseDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['febrile_seizure', 'respiratory_distress', 'asthma_exacerbation', 'anaphylaxis', 'sepsis', 'dehydration', 'trauma', 'cardiac_arrest']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  estimatedTime: z.number(),
  initialVitals: z.object({
    heartRate: z.number(),
    temperature: z.number(),
    respRate: z.number(),
    bloodPressure: z.string().optional(),
    oxygenSat: z.number().optional(),
    bloodGlucose: z.number().optional(),
    consciousness: z.string().optional()
  }),
  clinicalHistory: z.string(),
  presentingSymptoms: z.array(z.string()),
  stages: z.array(z.object({
    stage: z.number(),
    description: z.string(),
    vitals: z.object({
      heartRate: z.number(),
      temperature: z.number(),
      respRate: z.number(),
      bloodPressure: z.string().optional(),
      oxygenSat: z.number().optional(),
      bloodGlucose: z.number().optional(),
      consciousness: z.string().optional()
    }),
    availableInterventions: z.array(z.string()),
    timeLimit: z.number().optional(),
    criticalActions: z.array(z.string()),
    branchingConditions: z.array(z.object({
      condition: z.string(),
      nextStage: z.number(),
      vitalsChange: z.object({
        heartRate: z.number().optional(),
        temperature: z.number().optional(),
        respRate: z.number().optional(),
        bloodPressure: z.string().optional(),
        oxygenSat: z.number().optional(),
        bloodGlucose: z.number().optional(),
        consciousness: z.string().optional()
      })
    }))
  })),
  goldStandardActions: z.array(z.object({
    stage: z.number(),
    actions: z.array(z.string()),
    timeWindow: z.number(),
    critical: z.boolean()
  })),
  learningObjectives: z.array(z.string()),
  references: z.array(z.string())
});

export const simulationSessionSchema = z.object({
  id: z.string(),
  userId: z.number(),
  caseId: z.string(),
  startTime: z.date(),
  currentStage: z.number(),
  vitals: z.object({
    heartRate: z.number(),
    temperature: z.number(),
    respRate: z.number(),
    bloodPressure: z.string().optional(),
    oxygenSat: z.number().optional(),
    bloodGlucose: z.number().optional(),
    consciousness: z.string().optional()
  }),
  appliedInterventions: z.array(z.string()),
  timestamps: z.array(z.object({
    intervention: z.string(),
    time: z.date()
  })),
  status: z.enum(['active', 'paused', 'completed', 'failed']),
  score: z.number().optional(),
  feedback: z.object({
    summary: z.string(),
    missedActions: z.array(z.string()),
    unnecessaryActions: z.array(z.string()),
    suggestions: z.array(z.string()),
    finalScore: z.number(),
    outcome: z.enum(['excellent', 'good', 'fair', 'poor'])
  }).optional()
}); 