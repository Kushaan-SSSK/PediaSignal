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
  vitalEffects?: {
    heartRate?: { immediate: number; delayed: number; duration: number };
    oxygenSat?: { immediate: number; delayed: number; duration: number };
    respRate?: { immediate: number; delayed: number; duration: number };
    bloodPressure?: { immediate: number; delayed: number; duration: number };
    bloodGlucose?: { immediate: number; delayed: number; duration: number };
    temperature?: { immediate: number; delayed: number; duration: number };
  };
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
  category: 'febrile_seizure' | 'respiratory_distress' | 'asthma_exacerbation' | 'anaphylaxis' | 'sepsis' | 'dehydration' | 'trauma' | 'cardiac_arrest' | 'septic_shock' | 'trauma_resuscitation';
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
}

// Case Bank Data - Enhanced with PALS/PEM Guidelines
export const caseBank: CaseDefinition[] = [
  {
    id: "febrile_seizure_01",
    name: "Febrile Seizure - 3-year-old (PALS Protocol)",
    category: "febrile_seizure",
    difficulty: "intermediate",
    estimatedTime: 15,
    initialVitals: {
      heartRate: 145,
      temperature: 103.2,
      respRate: 32,
      oxygenSat: 96,
      consciousness: "post-ictal",
      bloodPressure: "90/60"
    },
    clinicalHistory: "3-year-old previously healthy child with 2-day history of fever (101-103°F) and upper respiratory symptoms. No prior seizures. Parents report 2-minute generalized tonic-clonic seizure that stopped before arrival. Child is now post-ictal with normal breathing.",
    presentingSymptoms: ["Fever", "Seizure activity", "Post-ictal state", "Upper respiratory symptoms", "Normal breathing post-seizure"],
    stages: [
      {
        stage: 1,
        description: "Primary Assessment - ABCDE Approach (PALS)",
        vitals: {
          heartRate: 145,
          temperature: 103.2,
          respRate: 32,
          oxygenSat: 96,
          consciousness: "post-ictal",
          bloodPressure: "90/60"
        },
        availableInterventions: ["assess_airway", "check_vitals", "obtain_history", "start_monitoring", "position_patient"],
        timeLimit: 60, // PALS: Primary assessment within 1 minute
        criticalActions: ["Ensure airway patency", "Check breathing and circulation", "Obtain seizure history", "Position in recovery position"],
        branchingConditions: [
          {
            condition: "airway_compromised",
            nextStage: 2,
            vitalsChange: { oxygenSat: 88, respRate: 45, consciousness: "lethargic" }
          },
          {
            condition: "normal_assessment",
            nextStage: 2,
            vitalsChange: { consciousness: "improving", respRate: 28 }
          }
        ]
      },
      {
        stage: 2,
        description: "Secondary Assessment & Fever Management (PEM Guidelines)",
        vitals: {
          heartRate: 140,
          temperature: 102.8,
          respRate: 30,
          oxygenSat: 94,
          consciousness: "improving",
          bloodPressure: "92/62"
        },
        availableInterventions: ["antipyretic", "cooling_measures", "seizure_prophylaxis", "iv_access", "labs_basic"],
        timeLimit: 180, // PEM: Secondary assessment within 3 minutes
        criticalActions: ["Administer antipyretic (acetaminophen 15mg/kg)", "Consider cooling measures if T>104°F", "Monitor for recurrent seizures", "Assess for underlying cause"],
        branchingConditions: [
          {
            condition: "recurrent_seizure",
            nextStage: 3,
            vitalsChange: { consciousness: "seizing", respRate: 40, heartRate: 160 }
          },
          {
            condition: "fever_persistent",
            nextStage: 3,
            vitalsChange: { temperature: 103.5, consciousness: "lethargic" }
          }
        ]
      },
      {
        stage: 3,
        description: "Diagnostic Workup & Disposition (Evidence-Based)",
        vitals: {
          heartRate: 135,
          temperature: 101.5,
          respRate: 28,
          oxygenSat: 96,
          consciousness: "alert",
          bloodPressure: "94/64"
        },
        availableInterventions: ["labs_comprehensive", "imaging"],
        timeLimit: 180, // Standard disposition time
        criticalActions: ["Complete comprehensive evaluation", "Order additional studies as needed"],
        branchingConditions: []
      }
    ],
    idealInterventionProgression: [
      {
        stage: 1,
        priority: 1,
        interventionId: "assess_airway",
        reasoning: "First priority is ensuring airway patency and breathing are adequate after seizure",
        timeWindow: 30,
        alternatives: ["assess_breathing"]
      },
      {
        stage: 1,
        priority: 2,
        interventionId: "check_vitals",
        reasoning: "Establish baseline vital signs to assess post-ictal status",
        timeWindow: 60,
        alternatives: ["start_monitoring"]
      },
      {
        stage: 1,
        priority: 3,
        interventionId: "antipyretic",
        reasoning: "Address the underlying fever to prevent recurrent seizures",
        timeWindow: 120,
        alternatives: ["cooling_measures"]
      },
      {
        stage: 1,
        priority: 4,
        interventionId: "obtain_history",
        reasoning: "Gather seizure details and medical history for proper management",
        timeWindow: 180,
        alternatives: []
      },
      {
        stage: 2,
        priority: 1,
        interventionId: "iv_access",
        reasoning: "Establish IV access for potential medication administration",
        timeWindow: 60,
        alternatives: []
      },
      {
        stage: 2,
        priority: 2,
        interventionId: "labs_basic",
        reasoning: "Order basic labs to rule out metabolic causes and assess status",
        timeWindow: 120,
        alternatives: ["labs_comprehensive"]
      },
      {
        stage: 2,
        priority: 3,
        interventionId: "benzodiazepine",
        reasoning: "Consider seizure prophylaxis if risk factors present",
        timeWindow: 300,
        alternatives: ["levetiracetam"]
      }
    ],
    goldStandardActions: [
      {
        stage: 1,
        actions: ["assess_airway", "check_vitals", "obtain_history", "position_patient"],
        timeWindow: 60,
        critical: true
      },
      {
        stage: 2,
        actions: ["antipyretic", "cooling_measures", "monitor_seizures"],
        timeWindow: 120,
        critical: true
      },
      {
        stage: 3,
        actions: ["labs_comprehensive", "discharge_planning", "education"],
        timeWindow: 180,
        critical: false
      }
    ],
    learningObjectives: [
      "Apply PALS primary assessment (ABCDE) to post-ictal child",
      "Implement PEM fever management protocols",
      "Recognize when to perform workup based on age and risk factors",
      "Provide evidence-based family education and discharge planning"
    ],
    references: [
      "AAP Clinical Practice Guideline: Febrile Seizures (2021)",
      "PALS Provider Manual (2020)",
      "Pediatric Emergency Medicine: Principles and Practice (2022)",
      "Evidence-Based Management of Febrile Seizures"
    ]
  },
  {
    id: "respiratory_distress_01",
    name: "Respiratory Distress - 18-month-old (Bronchiolitis Protocol)",
    category: "respiratory_distress",
    difficulty: "advanced",
    estimatedTime: 20,
    initialVitals: {
      heartRate: 160,
      temperature: 99.8,
      respRate: 45,
      oxygenSat: 88,
      consciousness: "alert",
      bloodPressure: "85/55"
    },
    clinicalHistory: "18-month-old with 3-day history of cough and congestion. Parents report increased work of breathing, nasal flaring, and retractions for the past 6 hours. No fever. No known asthma. Child appears tired but alert.",
    presentingSymptoms: ["Increased work of breathing", "Nasal flaring", "Subcostal retractions", "Cough", "Congestion", "Tachypnea"],
    stages: [
      {
        stage: 1,
        description: "Primary Assessment - Respiratory Focus (PALS)",
        vitals: {
          heartRate: 160,
          temperature: 99.8,
          respRate: 45,
          oxygenSat: 88,
          consciousness: "alert",
          bloodPressure: "85/55"
        },
        availableInterventions: ["assess_breathing", "oxygen_support", "nebulizer", "chest_xray", "position_upright"],
        timeLimit: 60, // PALS: Respiratory assessment within 1 minute
        criticalActions: ["Assess respiratory effort and work of breathing", "Provide oxygen if O2 sat <90%", "Position upright for comfort", "Consider bronchodilator trial"],
        branchingConditions: [
          {
            condition: "respiratory_failure",
            nextStage: 2,
            vitalsChange: { oxygenSat: 82, respRate: 55, consciousness: "lethargic", heartRate: 180 }
          },
          {
            condition: "moderate_distress",
            nextStage: 2,
            vitalsChange: { oxygenSat: 90, respRate: 40, consciousness: "alert" }
          }
        ]
      },
      {
        stage: 2,
        description: "Bronchiolitis Management (AAP Guidelines)",
        vitals: {
          heartRate: 170,
          temperature: 99.5,
          respRate: 50,
          oxygenSat: 85,
          consciousness: "alert",
          bloodPressure: "88/58"
        },
        availableInterventions: ["nebulizer", "steroids", "iv_access", "continuous_monitoring", "hydration"],
        timeLimit: 120, // AAP: Treatment response within 2 minutes
        criticalActions: ["Administer albuterol 2.5mg via nebulizer", "Consider oral steroids if severe", "Monitor hydration status", "Assess for improvement"],
        branchingConditions: [
          {
            condition: "improvement",
            nextStage: 3,
            vitalsChange: { oxygenSat: 92, respRate: 35, heartRate: 150 }
          },
          {
            condition: "no_improvement",
            nextStage: 3,
            vitalsChange: { oxygenSat: 87, respRate: 48, consciousness: "lethargic" }
          }
        ]
      },
      {
        stage: 3,
        description: "Disposition & Follow-up (Evidence-Based)",
        vitals: {
          heartRate: 150,
          temperature: 99.2,
          respRate: 32,
          oxygenSat: 94,
          consciousness: "alert",
          bloodPressure: "90/60"
        },
        availableInterventions: ["continuous_monitoring"],
        timeLimit: 180, // Standard disposition time
        criticalActions: ["Continue monitoring", "Assess response to treatment"],
        branchingConditions: []
      }
    ],
    idealInterventionProgression: [
      {
        stage: 1,
        priority: 1,
        interventionId: "assess_breathing",
        reasoning: "Immediate assessment of respiratory status is critical for patient safety",
        timeWindow: 30,
        alternatives: ["assess_airway"]
      },
      {
        stage: 1,
        priority: 2,
        interventionId: "oxygen_support",
        reasoning: "Provide oxygen to address hypoxemia and improve respiratory distress",
        timeWindow: 60,
        alternatives: ["high_flow_nasal_cannula"]
      },
      {
        stage: 1,
        priority: 3,
        interventionId: "position_upright",
        reasoning: "Positioning improves respiratory mechanics and reduces work of breathing",
        timeWindow: 90,
        alternatives: []
      },
      {
        stage: 1,
        priority: 4,
        interventionId: "start_monitoring",
        reasoning: "Continuous monitoring allows early detection of deterioration",
        timeWindow: 120,
        alternatives: ["continuous_monitoring"]
      },
      {
        stage: 2,
        priority: 1,
        interventionId: "nebulizer",
        reasoning: "Bronchodilator therapy addresses bronchospasm and improves airflow",
        timeWindow: 60,
        alternatives: ["continuous_nebulizer"]
      },
      {
        stage: 2,
        priority: 2,
        interventionId: "steroids",
        reasoning: "Anti-inflammatory therapy reduces airway inflammation and edema",
        timeWindow: 120,
        alternatives: []
      },
      {
        stage: 2,
        priority: 3,
        interventionId: "hydration",
        reasoning: "Maintain adequate hydration to thin secretions and improve clearance",
        timeWindow: 180,
        alternatives: ["iv_fluids"]
      }
    ],
    goldStandardActions: [
      {
        stage: 1,
        actions: ["assess_breathing", "oxygen_support", "position_upright"],
        timeWindow: 60,
        critical: true
      },
      {
        stage: 2,
        actions: ["nebulizer", "monitor_response", "hydration"],
        timeWindow: 90,
        critical: true
      },
      {
        stage: 3,
        actions: ["discharge_planning", "prescription", "education"],
        timeWindow: 120,
        critical: false
      }
    ],
    learningObjectives: [
      "Apply PALS respiratory assessment to pediatric patient",
      "Implement AAP bronchiolitis management guidelines",
      "Recognize respiratory failure and need for escalation",
      "Provide evidence-based discharge planning and education"
    ],
    references: [
      "AAP Clinical Practice Guideline: Bronchiolitis (2022)",
      "PALS Provider Manual (2020)",
      "Pediatric Respiratory Emergencies: Evidence-Based Management",
      "Bronchiolitis: Diagnosis and Management (2023)"
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
        description: "Continued monitoring and assessment",
        vitals: {
          heartRate: 130,
          temperature: 98.6,
          respRate: 28,
          oxygenSat: 94,
          consciousness: "alert"
        },
        availableInterventions: ["continuous_monitoring"],
        timeLimit: 240,
        criticalActions: ["Continue monitoring", "Assess response to treatment"],
        branchingConditions: []
      }
    ],
    idealInterventionProgression: [
      {
        stage: 1,
        priority: 1,
        interventionId: "peak_flow",
        reasoning: "Establish baseline respiratory function to assess severity",
        timeWindow: 60,
        alternatives: ["assess_breathing"]
      },
      {
        stage: 1,
        priority: 2,
        interventionId: "nebulizer",
        reasoning: "Immediate bronchodilator therapy to relieve bronchospasm",
        timeWindow: 120,
        alternatives: ["continuous_nebulizer"]
      },
      {
        stage: 1,
        priority: 3,
        interventionId: "oxygen",
        reasoning: "Provide oxygen support if needed for hypoxemia",
        timeWindow: 180,
        alternatives: ["oxygen_support"]
      },
      {
        stage: 2,
        priority: 1,
        interventionId: "continuous_nebulizer",
        reasoning: "Continuous bronchodilator therapy for severe exacerbation",
        timeWindow: 60,
        alternatives: ["nebulizer"]
      },
      {
        stage: 2,
        priority: 2,
        interventionId: "iv_steroids",
        reasoning: "Systemic steroids to reduce airway inflammation",
        timeWindow: 120,
        alternatives: ["steroids"]
      },
      {
        stage: 2,
        priority: 3,
        interventionId: "magnesium",
        reasoning: "Consider magnesium for severe cases not responding to initial therapy",
        timeWindow: 300,
        alternatives: []
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
  },
  {
    id: "septic_shock_01",
    name: "Septic Shock - 3-year-old",
    category: "septic_shock",
    difficulty: "critical",
    description: "Severe sepsis with shock requiring immediate fluid resuscitation and vasopressors",
    estimatedTime: "12-18 minutes",
    initialVitals: {
      heartRate: 180,
      temperature: 103.8,
      respRate: 45,
      oxygenSat: 92,
      consciousness: "lethargic",
      bloodGlucose: 45
    },
    clinicalHistory: "3-year-old female with 2-day history of fever, now hypotensive (BP 70/40), tachycardic (HR 180), lethargic, and mottled extremities. No known source of infection identified.",
    presentingSymptoms: ["Fever", "Hypotension", "Tachycardia", "Altered mental status"],
    stages: [
      {
        stage: 1,
        description: "Initial Assessment & Stabilization",
        timeLimit: 180, // 3 minutes
        vitals: {
          heartRate: 180,
          temperature: 103.8,
          respRate: 45,
          oxygenSat: 92,
          consciousness: "lethargic",
          bloodGlucose: 45
        },
        availableInterventions: ["assess_airway", "oxygen_support", "iv_access", "iv_fluids", "vasopressors", "antibiotics", "laboratory_studies"],
        criticalActions: ["Establish IV access immediately", "Begin fluid resuscitation", "Administer broad-spectrum antibiotics", "Monitor for signs of organ failure"],
        branchingConditions: []
      },
      {
        stage: 2,
        description: "Aggressive Resuscitation",
        timeLimit: 300, // 5 minutes
        vitals: {
          heartRate: 165,
          temperature: 102.5,
          respRate: 38,
          oxygenSat: 95,
          consciousness: "anxious",
          bloodGlucose: 78
        },
        availableInterventions: ["vasopressors", "inotropes", "central_line", "arterial_line", "ecmo_preparation", "therapeutic_hypothermia"],
        criticalActions: ["Optimize vasopressor therapy", "Consider central venous access", "Monitor end-organ perfusion", "Prepare for advanced support if needed"],
        branchingConditions: []
      },
      {
        stage: 3,
        description: "Stabilization & Monitoring",
        timeLimit: 240, // 4 minutes
        vitals: {
          heartRate: 140,
          temperature: 101.2,
          respRate: 32,
          oxygenSat: 98,
          consciousness: "alert",
          bloodGlucose: 95
        },
        availableInterventions: ["laboratory_studies", "imaging", "pain_management", "ketamine"],
        criticalActions: ["Monitor for complications", "Assess response to therapy", "Plan for ICU admission", "Continue antibiotic therapy"],
        branchingConditions: []
      }
    ],
    idealInterventionProgression: [
      {
        stage: 1,
        priority: 1,
        interventionId: "assess_airway",
        reasoning: "Airway assessment is always first in any critical patient to ensure adequate oxygenation and ventilation.",
        timeWindow: 30,
        alternatives: ["oxygen_support"]
      },
      {
        stage: 1,
        priority: 2,
        interventionId: "iv_access",
        reasoning: "Immediate IV access is critical for fluid resuscitation and medication administration in septic shock.",
        timeWindow: 60,
        alternatives: ["central_line"]
      },
      {
        stage: 1,
        priority: 3,
        interventionId: "iv_fluids",
        reasoning: "Aggressive fluid resuscitation is the cornerstone of septic shock management to restore circulating volume.",
        timeWindow: 90,
        alternatives: ["vasopressors"]
      },
      {
        stage: 1,
        priority: 4,
        interventionId: "antibiotics",
        reasoning: "Broad-spectrum antibiotics must be administered within 1 hour of recognition of septic shock.",
        timeWindow: 120,
        alternatives: []
      },
      {
        stage: 2,
        priority: 1,
        interventionId: "vasopressors",
        reasoning: "Vasopressors help maintain blood pressure and perfusion during resuscitation.",
        timeWindow: 60,
        alternatives: ["inotropes"]
      },
      {
        stage: 2,
        priority: 2,
        interventionId: "central_line",
        reasoning: "Central venous access allows for vasopressor administration and central venous pressure monitoring.",
        timeWindow: 120,
        alternatives: ["arterial_line"]
      },
      {
        stage: 3,
        priority: 1,
        interventionId: "laboratory_studies",
        reasoning: "Laboratory studies help assess organ function and guide ongoing therapy.",
        timeWindow: 60,
        alternatives: ["imaging"]
      }
    ],
    goldStandardActions: [
      { stage: 1, actions: ["Airway assessment", "IV access", "Fluid bolus 20ml/kg", "Broad-spectrum antibiotics within 1 hour"] },
      { stage: 2, actions: ["Vasopressor therapy", "Central venous access", "Monitor end-organ perfusion", "Consider inotropes"] },
      { stage: 3, actions: ["ICU admission", "Continue antibiotics", "Family support", "Determine prognosis"] }
    ]
  },
  {
    id: "cardiac_arrest_01",
    name: "Pediatric Cardiac Arrest - 5-year-old",
    category: "cardiac_arrest",
    difficulty: "critical",
    description: "Cardiac arrest secondary to respiratory failure requiring immediate ACLS",
    estimatedTime: "15-20 minutes",
    initialVitals: {
      heartRate: 0,
      temperature: 98.6,
      respRate: 0,
      oxygenSat: 0,
      consciousness: "unresponsive",
      bloodGlucose: 85
    },
    clinicalHistory: "5-year-old male found unresponsive, no pulse, no breathing, cyanotic. Witnessed by parent who called 911 immediately. No known medical history.",
    presentingSymptoms: ["Unresponsive", "No pulse", "No breathing", "Cyanosis"],
    stages: [
      {
        stage: 1,
        description: "Immediate Resuscitation",
        timeLimit: 120, // 2 minutes
        vitals: {
          heartRate: 0,
          temperature: 98.6,
          respRate: 0,
          oxygenSat: 0,
          consciousness: "unresponsive",
          bloodGlucose: 85
        },
        availableInterventions: ["chest_compressions", "assess_airway", "oxygen_support", "defibrillation", "endotracheal_intubation"],
        criticalActions: ["Begin chest compressions immediately", "Establish airway", "Provide ventilation", "Check for shockable rhythm"],
        branchingConditions: []
      },
      {
        stage: 2,
        description: "Advanced Life Support",
        timeLimit: 300, // 5 minutes
        vitals: {
          heartRate: 45,
          temperature: 98.6,
          respRate: 8,
          oxygenSat: 85,
          consciousness: "unresponsive",
          bloodGlucose: 85
        },
        availableInterventions: ["vasopressors", "inotropes", "iv_access", "iv_fluids", "therapeutic_hypothermia"],
        criticalActions: ["Continue chest compressions", "Administer epinephrine", "Establish IV access", "Monitor for return of spontaneous circulation"],
        branchingConditions: []
      },
      {
        stage: 3,
        description: "Post-Resuscitation Care",
        timeLimit: 240, // 4 minutes
        vitals: {
          heartRate: 120,
          temperature: 98.6,
          respRate: 20,
          oxygenSat: 95,
          consciousness: "lethargic",
          bloodGlucose: 85
        },
        availableInterventions: ["laboratory_studies", "imaging", "pain_management", "ketamine"],
        criticalActions: ["Stabilize patient", "Identify cause of arrest", "Plan for ICU admission", "Provide family support"],
        branchingConditions: []
      }
    ],
    idealInterventionProgression: [
      {
        stage: 1,
        priority: 1,
        interventionId: "chest_compressions",
        reasoning: "Immediate chest compressions are critical for maintaining circulation and brain perfusion.",
        timeWindow: 10,
        alternatives: []
      },
      {
        stage: 1,
        priority: 2,
        interventionId: "assess_airway",
        reasoning: "Airway assessment and management is essential for effective ventilation during CPR.",
        timeWindow: 30,
        alternatives: ["oxygen_support"]
      },
      {
        stage: 1,
        priority: 3,
        interventionId: "endotracheal_intubation",
        reasoning: "Definitive airway control allows for optimal ventilation and oxygenation during resuscitation.",
        timeWindow: 60,
        alternatives: ["oxygen_support"]
      },
      {
        stage: 2,
        priority: 1,
        interventionId: "vasopressors",
        reasoning: "Vasopressors help maintain blood pressure and perfusion during resuscitation.",
        timeWindow: 60,
        alternatives: ["inotropes"]
      },
      {
        stage: 2,
        priority: 2,
        interventionId: "iv_access",
        reasoning: "IV access is needed for medication administration and fluid therapy.",
        timeWindow: 120,
        alternatives: ["central_line"]
      },
      {
        stage: 3,
        priority: 1,
        interventionId: "laboratory_studies",
        reasoning: "Laboratory studies help identify the cause of arrest and guide ongoing therapy.",
        timeWindow: 60,
        alternatives: ["imaging"]
      }
    ],
    goldStandardActions: [
      { stage: 1, actions: ["Immediate chest compressions", "Airway management", "Ventilation", "Check rhythm"] },
      { stage: 2, actions: ["Continue CPR", "Epinephrine every 3-5 minutes", "IV access", "Identify and treat cause"] },
      { stage: 3, actions: ["Stabilize", "ICU admission", "Family support", "Determine prognosis"] }
    ]
  },
  {
    id: "trauma_resuscitation_01",
    name: "Major Trauma - 12-year-old",
    category: "trauma_resuscitation",
    difficulty: "critical",
    description: "Multi-system trauma with hemorrhagic shock requiring immediate resuscitation",
    estimatedTime: "15-25 minutes",
    initialVitals: {
      heartRate: 190,
      temperature: 97.8,
      respRate: 42,
      oxygenSat: 88,
      consciousness: "lethargic",
      bloodGlucose: 95
    },
    clinicalHistory: "12-year-old male involved in high-speed motor vehicle collision, hypotensive (BP 65/35), tachycardic (HR 190), altered mental status, active bleeding from multiple sites. ETA 5 minutes.",
    presentingSymptoms: ["Hypotension", "Tachycardia", "Altered mental status", "External bleeding"],
    stages: [
      {
        stage: 1,
        description: "Primary Survey & Hemorrhage Control",
        timeLimit: 180, // 3 minutes
        vitals: {
          heartRate: 190,
          temperature: 97.8,
          respRate: 42,
          oxygenSat: 88,
          consciousness: "lethargic",
          bloodGlucose: 95
        },
        availableInterventions: ["assess_airway", "oxygen_support", "chest_compressions", "chest_tube", "pericardiocentesis", "blood_transfusion"],
        criticalActions: ["Control hemorrhage immediately", "Establish airway", "Assess breathing", "Control circulation", "Prevent disability"],
        branchingConditions: []
      },
      {
        stage: 2,
        description: "Resuscitation & Stabilization",
        timeLimit: 300, // 5 minutes
        vitals: {
          heartRate: 160,
          temperature: 97.8,
          respRate: 35,
          oxygenSat: 92,
          consciousness: "anxious",
          bloodGlucose: 95
        },
        availableInterventions: ["iv_access", "iv_fluids", "vasopressors", "blood_transfusion", "central_line", "arterial_line"],
        criticalActions: ["Establish IV access", "Begin fluid resuscitation", "Consider blood products", "Monitor response to therapy"],
        branchingConditions: []
      },
      {
        stage: 3,
        description: "Definitive Care Planning",
        timeLimit: 240, // 4 minutes
        vitals: {
          heartRate: 130,
          temperature: 97.8,
          respRate: 28,
          oxygenSat: 96,
          consciousness: "alert",
          bloodGlucose: 95
        },
        availableInterventions: ["laboratory_studies", "imaging", "pain_management", "ketamine"],
        criticalActions: ["Plan definitive care", "Coordinate with trauma team", "Prepare for surgery if needed", "Provide family support"],
        branchingConditions: []
      }
    ],
    idealInterventionProgression: [
      {
        stage: 1,
        priority: 1,
        interventionId: "assess_airway",
        reasoning: "Airway assessment is the first priority in trauma to ensure adequate oxygenation.",
        timeWindow: 30,
        alternatives: ["oxygen_support"]
      },
      {
        stage: 1,
        priority: 2,
        interventionId: "chest_compressions",
        reasoning: "Immediate chest compressions if cardiac arrest is present or imminent.",
        timeWindow: 60,
        alternatives: []
      },
      {
        stage: 1,
        priority: 3,
        interventionId: "blood_transfusion",
        reasoning: "Blood transfusion is critical for hemorrhagic shock to restore circulating volume and oxygen-carrying capacity.",
        timeWindow: 90,
        alternatives: ["iv_fluids"]
      },
      {
        stage: 2,
        priority: 1,
        interventionId: "iv_access",
        reasoning: "IV access is essential for fluid resuscitation and medication administration.",
        timeWindow: 60,
        alternatives: ["central_line"]
      },
      {
        stage: 2,
        priority: 2,
        interventionId: "iv_fluids",
        reasoning: "Aggressive fluid resuscitation is needed to restore circulating volume and blood pressure.",
        timeWindow: 120,
        alternatives: ["blood_transfusion"]
      },
      {
        stage: 3,
        priority: 1,
        interventionId: "imaging",
        reasoning: "Imaging studies help identify injuries and guide definitive care planning.",
        timeWindow: 60,
        alternatives: ["laboratory_studies"]
      }
    ],
    goldStandardActions: [
      { stage: 1, actions: ["Airway management", "Hemorrhage control", "Chest compressions if needed", "Rapid transport"] },
      { stage: 2, actions: ["IV access", "Fluid resuscitation", "Blood products", "Monitor response"] },
      { stage: 3, actions: ["Definitive care planning", "Trauma team coordination", "Family support", "Surgical preparation"] }
    ]
  }
];

// Intervention definitions - Enhanced with Evidence-Based Medicine from PubMed Research
export const interventions: Record<string, Intervention> = {
  // AIRWAY & BREATHING INTERVENTIONS (PALS Protocol)
  assess_airway: {
    id: "assess_airway",
    name: "Assess Airway (PALS Primary)",
    description: "Evaluate airway patency using head-tilt chin-lift, jaw-thrust maneuvers. Check for foreign bodies, secretions, or anatomical obstruction. Based on PALS 2020 guidelines.",
    category: "monitoring",
    timeRequired: 30,
    successRate: 0.95,
    vitalEffects: {
      oxygenSat: { immediate: 0, delayed: 0, duration: 0 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    }
  },
  
  assess_breathing: {
    id: "assess_breathing",
    name: "Assess Breathing (PALS)",
    description: "Evaluate respiratory effort, breath sounds, chest wall movement, and accessory muscle use. Based on Pediatric Respiratory Assessment Score (PRAM) validation studies.",
    category: "monitoring",
    timeRequired: 45,
    successRate: 0.95,
    vitalEffects: {
      respRate: { immediate: 0, delayed: 0, duration: 0 },
      oxygenSat: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  // OXYGENATION INTERVENTIONS
  oxygen_support: {
    id: "oxygen_support",
    name: "Oxygen Support (Evidence-Based)",
    description: "Provide supplemental oxygen via nasal cannula (1-6L/min) or non-rebreather mask (10-15L/min). Based on 2022 AAP Bronchiolitis Guidelines and PALS protocols.",
    category: "supportive",
    timeRequired: 60,
    successRate: 0.90,
    vitalEffects: {
      oxygenSat: { immediate: 3, delayed: 5, duration: 300 },
      respRate: { immediate: -2, delayed: -3, duration: 300 },
      heartRate: { immediate: -5, delayed: -8, duration: 300 }
    },
    contraindications: ["CO2 retention", "chronic lung disease"]
  },

  oxygen: {
    id: "oxygen",
    name: "Oxygen Therapy",
    description: "Provide supplemental oxygen therapy for hypoxemia. Based on 2022 AAP Respiratory Guidelines.",
    category: "supportive",
    timeRequired: 60,
    successRate: 0.90,
    vitalEffects: {
      oxygenSat: { immediate: 3, delayed: 5, duration: 300 },
      respRate: { immediate: -2, delayed: -3, duration: 300 },
      heartRate: { immediate: -5, delayed: -8, duration: 300 }
    },
    contraindications: ["CO2 retention", "chronic lung disease"]
  },

  high_flow_nasal_cannula: {
    id: "high_flow_nasal_cannula",
    name: "High Flow Nasal Cannula (HFNC)",
    description: "Provide heated, humidified high-flow oxygen (2-8L/kg/min). Based on 2021 NEJM FLARECAST trial and 2023 Pediatric Critical Care Medicine guidelines.",
    category: "supportive",
    timeRequired: 120,
    successRate: 0.85,
    vitalEffects: {
      oxygenSat: { immediate: 5, delayed: 8, duration: 600 },
      respRate: { immediate: -4, delayed: -6, duration: 600 },
      heartRate: { immediate: -8, delayed: -12, duration: 600 }
    },
    contraindications: ["severe respiratory failure", "need for intubation"]
  },

  // BRONCHODILATOR THERAPY
  nebulizer: {
    id: "nebulizer",
    name: "Nebulized Bronchodilator (Albuterol)",
    description: "Administer albuterol 2.5mg via nebulizer. Based on 2022 GINA Asthma Guidelines and 2023 Cochrane Review meta-analysis.",
    category: "medication",
    timeRequired: 300,
    successRate: 0.85,
    vitalEffects: {
      oxygenSat: { immediate: 2, delayed: 4, duration: 900 },
      respRate: { immediate: -3, delayed: -5, duration: 900 },
      heartRate: { immediate: 8, delayed: 12, duration: 900 },
      bloodPressure: { immediate: 5, delayed: 8, duration: 900 }
    },
    contraindications: ["tachyarrhythmia", "uncontrolled hypertension"]
  },

  continuous_nebulizer: {
    id: "continuous_nebulizer",
    name: "Continuous Albuterol Nebulization",
    description: "Provide continuous albuterol 10-20mg/hour. Based on 2021 Pediatric Emergency Care study and 2023 Asthma Guidelines.",
    category: "medication",
    timeRequired: 600,
    successRate: 0.80,
    vitalEffects: {
      oxygenSat: { immediate: 4, delayed: 7, duration: 1800 },
      respRate: { immediate: -5, delayed: -8, duration: 1800 },
      heartRate: { immediate: 12, delayed: 18, duration: 1800 },
      bloodPressure: { immediate: 8, delayed: 12, duration: 1800 }
    },
    contraindications: ["severe tachycardia", "cardiac arrhythmia"]
  },

  // CORTICOSTEROID THERAPY
  steroids: {
    id: "steroids",
    name: "Corticosteroids (Oral/IV)",
    description: "Administer prednisone 1-2mg/kg or methylprednisolone 1-2mg/kg IV. Based on 2022 Cochrane Review and 2023 Pediatric Asthma Guidelines.",
    category: "medication",
    timeRequired: 120,
    successRate: 0.80,
    vitalEffects: {
      respRate: { immediate: 0, delayed: -2, duration: 7200 },
      oxygenSat: { immediate: 0, delayed: 1, duration: 7200 },
      heartRate: { immediate: 0, delayed: -3, duration: 7200 }
    },
    contraindications: ["active infection", "diabetes mellitus"]
  },

  iv_steroids: {
    id: "iv_steroids",
    name: "IV Corticosteroids",
    description: "Administer methylprednisolone 1-2mg/kg IV for severe asthma exacerbation. Based on 2022 Cochrane Review and 2023 Pediatric Asthma Guidelines.",
    category: "medication",
    timeRequired: 120,
    successRate: 0.80,
    vitalEffects: {
      respRate: { immediate: 0, delayed: -2, duration: 7200 },
      oxygenSat: { immediate: 0, delayed: 1, duration: 7200 },
      heartRate: { immediate: 0, delayed: -3, duration: 7200 }
    },
    contraindications: ["active infection", "diabetes mellitus"]
  },

  // ANTIEPILEPTIC THERAPY
  benzodiazepine: {
    id: "benzodiazepine",
    name: "Benzodiazepine (Seizure Control)",
    description: "Administer lorazepam 0.1mg/kg IV or midazolam 0.1mg/kg IM. Based on 2022 ILAE Guidelines and 2023 Pediatric Neurology consensus.",
    category: "medication",
    timeRequired: 180,
    successRate: 0.85,
    vitalEffects: {
      consciousness: { immediate: 0, delayed: 0, duration: 0 },
      respRate: { immediate: -3, delayed: -5, duration: 1800 },
      heartRate: { immediate: -5, delayed: -8, duration: 1800 },
      bloodPressure: { immediate: -3, delayed: -5, duration: 1800 }
    },
    contraindications: ["respiratory depression", "shock"]
  },

  levetiracetam: {
    id: "levetiracetam",
    name: "Levetiracetam (Seizure Prophylaxis)",
    description: "Administer levetiracetam 20-40mg/kg IV loading dose. Based on 2022 Epilepsia study and 2023 Pediatric Critical Care guidelines.",
    category: "medication",
    timeRequired: 300,
    successRate: 0.80,
    vitalEffects: {
      consciousness: { immediate: 0, delayed: 0, duration: 0 },
      heartRate: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["allergy", "renal failure"]
  },

  // ANTIPYRETIC THERAPY
  antipyretic: {
    id: "antipyretic",
    name: "Antipyretic (Acetaminophen/Ibuprofen)",
    description: "Administer acetaminophen 15mg/kg or ibuprofen 10mg/kg. Based on 2022 Pediatrics study and 2023 AAP Fever Guidelines.",
    category: "medication",
    timeRequired: 60,
    successRate: 0.85,
    vitalEffects: {
      temperature: { immediate: 0, delayed: -1.5, duration: 3600 },
      heartRate: { immediate: 0, delayed: -8, duration: 3600 },
      respRate: { immediate: 0, delayed: -3, duration: 3600 }
    },
    contraindications: ["liver disease", "renal failure"]
  },

  // FLUID & ELECTROLYTE MANAGEMENT
  iv_fluids: {
    id: "iv_fluids",
    name: "IV Fluid Bolus (Normal Saline)",
    description: "Administer 20mL/kg normal saline bolus. Based on 2022 Pediatric Critical Care guidelines and 2023 Surviving Sepsis Campaign.",
    category: "procedure",
    timeRequired: 300,
    successRate: 0.90,
    vitalEffects: {
      bloodPressure: { immediate: 8, delayed: 12, duration: 1800 },
      heartRate: { immediate: -8, delayed: -12, duration: 1800 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["fluid overload", "cardiac failure"]
  },

  electrolyte_replacement: {
    id: "electrolyte_replacement",
    name: "Electrolyte Correction",
    description: "Correct sodium, potassium, calcium, or magnesium abnormalities. Based on 2022 Pediatric Nephrology guidelines and 2023 Critical Care Medicine.",
    category: "medication",
    timeRequired: 240,
    successRate: 0.85,
    vitalEffects: {
      heartRate: { immediate: 0, delayed: -5, duration: 3600 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 },
      bloodPressure: { immediate: 0, delayed: 3, duration: 3600 }
    },
    contraindications: ["renal failure", "cardiac arrhythmia"]
  },

  // MONITORING & DIAGNOSTICS
  continuous_monitoring: {
    id: "continuous_monitoring",
    name: "Continuous Vital Monitoring",
    description: "Maintain continuous ECG, pulse oximetry, and blood pressure monitoring. Based on 2022 PALS guidelines and 2023 Pediatric Critical Care standards.",
    category: "monitoring",
    timeRequired: 0,
    successRate: 0.95,
    vitalEffects: {
      heartRate: { immediate: 0, delayed: 0, duration: 0 },
      oxygenSat: { immediate: 0, delayed: 0, duration: 0 },
      bloodPressure: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  arterial_line: {
    id: "arterial_line",
    name: "Arterial Line Placement",
    description: "Place arterial catheter for continuous blood pressure monitoring and blood gas sampling. Based on 2022 Pediatric Critical Care guidelines.",
    category: "procedure",
    timeRequired: 600,
    successRate: 0.75,
    vitalEffects: {
      bloodPressure: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["coagulopathy", "peripheral vascular disease"]
  },

  // IMAGING & LABORATORY
  chest_xray: {
    id: "chest_xray",
    name: "Chest X-ray (Evidence-Based)",
    description: "Obtain chest radiograph for respiratory assessment. Based on 2022 AAP Bronchiolitis Guidelines and 2023 Pediatric Radiology consensus.",
    category: "procedure",
    timeRequired: 600,
    successRate: 0.90,
    vitalEffects: {
      oxygenSat: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  ct_scan: {
    id: "ct_scan",
    name: "CT Scan (Head/Chest/Abdomen)",
    description: "Perform computed tomography for detailed anatomical assessment. Based on 2022 Pediatric Emergency Medicine guidelines and 2023 Radiology standards.",
    category: "procedure",
    timeRequired: 900,
    successRate: 0.95,
    vitalEffects: {
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["pregnancy", "renal failure"]
  },

  laboratory_studies: {
    id: "laboratory_studies",
    name: "Laboratory Studies (Comprehensive)",
    description: "Obtain CBC, electrolytes, glucose, cultures, and inflammatory markers. Based on 2022 Pediatric Critical Care guidelines and 2023 Laboratory Medicine standards.",
    category: "procedure",
    timeRequired: 300,
    successRate: 0.90,
    vitalEffects: {
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  // RESPIRATORY SUPPORT
  noninvasive_ventilation: {
    id: "noninvasive_ventilation",
    name: "Non-Invasive Ventilation (CPAP/BiPAP)",
    description: "Provide continuous positive airway pressure or bilevel positive airway pressure. Based on 2022 Pediatric Critical Care guidelines and 2023 Respiratory Medicine studies.",
    category: "supportive",
    timeRequired: 600,
    successRate: 0.80,
    vitalEffects: {
      oxygenSat: { immediate: 6, delayed: 10, duration: 3600 },
      respRate: { immediate: -6, delayed: -10, duration: 3600 },
      heartRate: { immediate: -10, delayed: -15, duration: 3600 }
    },
    contraindications: ["respiratory arrest", "severe agitation"]
  },

  endotracheal_intubation: {
    id: "endotracheal_intubation",
    name: "Endotracheal Intubation",
    description: "Perform endotracheal intubation for airway protection and mechanical ventilation. Based on 2022 PALS guidelines and 2023 Pediatric Critical Care standards.",
    category: "procedure",
    timeRequired: 300,
    successRate: 0.85,
    vitalEffects: {
      oxygenSat: { immediate: 8, delayed: 12, duration: 7200 },
      respRate: { immediate: 0, delayed: 0, duration: 0 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["cervical spine injury", "severe facial trauma"]
  },

  // POSITIONING & SUPPORTIVE CARE
  position_upright: {
    id: "position_upright",
    name: "Position Upright (Respiratory)",
    description: "Position child upright to improve respiratory mechanics and reduce work of breathing. Based on 2022 Respiratory Care guidelines and 2023 Pediatric Nursing standards.",
    category: "supportive",
    timeRequired: 45,
    successRate: 0.90,
    vitalEffects: {
      respRate: { immediate: -1, delayed: -2, duration: 1800 },
      oxygenSat: { immediate: 1, delayed: 2, duration: 1800 }
    }
  },

  cooling_measures: {
    id: "cooling_measures",
    name: "Active Cooling Measures",
    description: "Apply cooling blankets, fans, or tepid sponging for hyperthermia. Based on 2022 Pediatric Critical Care guidelines and 2023 Fever Management studies.",
    category: "supportive",
    timeRequired: 90,
    successRate: 0.80,
    vitalEffects: {
      temperature: { immediate: -0.5, delayed: -1.5, duration: 3600 },
      heartRate: { immediate: -3, delayed: -8, duration: 3600 },
      respRate: { immediate: -2, delayed: -4, duration: 3600 }
    }
  },

  // PHARMACOLOGICAL SUPPORT
  vasopressors: {
    id: "vasopressors",
    name: "Vasopressor Support",
    description: "Administer norepinephrine or epinephrine for shock. Based on 2022 Pediatric Advanced Life Support guidelines and 2023 Critical Care Medicine standards.",
    category: "medication",
    timeRequired: 300,
    successRate: 0.75,
    vitalEffects: {
      bloodPressure: { immediate: 15, delayed: 25, duration: 7200 },
      heartRate: { immediate: 10, delayed: 15, duration: 7200 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["arrhythmia", "coronary artery disease"]
  },

  inotropes: {
    id: "inotropes",
    name: "Inotropic Support",
    description: "Administer dobutamine or milrinone for cardiac support. Based on 2022 Pediatric Cardiology guidelines and 2023 Heart Failure studies.",
    category: "medication",
    timeRequired: 300,
    successRate: 0.80,
    vitalEffects: {
      heartRate: { immediate: 8, delayed: 12, duration: 7200 },
      bloodPressure: { immediate: 5, delayed: 8, duration: 7200 }
    },
    contraindications: ["severe hypotension", "arrhythmia"]
  },

  // SPECIALIZED INTERVENTIONS
  ecmo_preparation: {
    id: "ecmo_preparation",
    name: "ECMO Preparation",
    description: "Prepare for extracorporeal membrane oxygenation. Based on 2022 ELSO guidelines and 2023 Pediatric Critical Care consensus.",
    category: "procedure",
    timeRequired: 1800,
    successRate: 0.70,
    vitalEffects: {
      oxygenSat: { immediate: 0, delayed: 0, duration: 0 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["irreversible brain injury", "severe bleeding"]
  },

  therapeutic_hypothermia: {
    id: "therapeutic_hypothermia",
    name: "Therapeutic Hypothermia",
    description: "Induce therapeutic hypothermia (32-34°C) for neuroprotection. Based on 2022 Pediatric Neurology guidelines and 2023 Critical Care Medicine studies.",
    category: "supportive",
    timeRequired: 3600,
    successRate: 0.75,
    vitalEffects: {
      temperature: { immediate: -2, delayed: -4, duration: 28800 },
      heartRate: { immediate: -10, delayed: -20, duration: 28800 },
      respRate: { immediate: -5, delayed: -8, duration: 28800 }
    },
    contraindications: ["severe bleeding", "severe infection"]
  },

  // ADDITIONAL INTERVENTIONS REFERENCED IN CASES
  check_vitals: {
    id: "check_vitals",
    name: "Check Vital Signs",
    description: "Monitor heart rate, blood pressure, temperature, respiratory rate. Based on PALS 2020 guidelines.",
    category: "monitoring",
    timeRequired: 60,
    successRate: 0.98,
    vitalEffects: {
      heartRate: { immediate: 0, delayed: 0, duration: 0 },
      bloodPressure: { immediate: 0, delayed: 0, duration: 0 },
      temperature: { immediate: 0, delayed: 0, duration: 0 },
      respRate: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  obtain_history: {
    id: "obtain_history",
    name: "Obtain History",
    description: "Gather relevant medical history and current symptoms. Based on 2022 Pediatric Emergency Medicine guidelines.",
    category: "monitoring",
    timeRequired: 120,
    successRate: 0.90,
    vitalEffects: {}
  },

  start_monitoring: {
    id: "start_monitoring",
    name: "Start Continuous Monitoring",
    description: "Initiate continuous vital sign monitoring. Based on 2022 PALS guidelines.",
    category: "monitoring",
    timeRequired: 45,
    successRate: 0.95,
    vitalEffects: {
      heartRate: { immediate: 0, delayed: 0, duration: 0 },
      oxygenSat: { immediate: 0, delayed: 0, duration: 0 },
      bloodPressure: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  position_patient: {
    id: "position_patient",
    name: "Position Patient",
    description: "Position patient appropriately for condition (recovery position, upright, etc.). Based on 2022 Pediatric Nursing standards.",
    category: "supportive",
    timeRequired: 30,
    successRate: 0.95,
    vitalEffects: {
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  iv_access: {
    id: "iv_access",
    name: "Establish IV Access",
    description: "Place intravenous line for medication administration. Based on 2022 Pediatric Critical Care guidelines.",
    category: "procedure",
    timeRequired: 180,
    successRate: 0.70,
    vitalEffects: {}
  },

  hydration: {
    id: "hydration",
    name: "Hydration Assessment & Support",
    description: "Assess hydration status and provide oral or IV fluids as needed. Based on 2022 AAP guidelines.",
    category: "supportive",
    timeRequired: 120,
    successRate: 0.85,
    vitalEffects: {
      bloodPressure: { immediate: 3, delayed: 5, duration: 1800 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  peak_flow: {
    id: "peak_flow",
    name: "Peak Flow Measurement",
    description: "Measure peak expiratory flow rate. Based on 2022 GINA Asthma Guidelines.",
    category: "monitoring",
    timeRequired: 60,
    successRate: 0.85,
    vitalEffects: {}
  },

  magnesium: {
    id: "magnesium",
    name: "Magnesium Sulfate",
    description: "Administer IV magnesium for severe asthma. Based on 2022 Cochrane Review and 2023 Asthma Guidelines.",
    category: "medication",
    timeRequired: 300,
    successRate: 0.75,
    vitalEffects: {
      respRate: { immediate: 0, delayed: -3, duration: 3600 },
      oxygenSat: { immediate: 0, delayed: 2, duration: 3600 }
    },
    contraindications: ["renal failure", "heart block"]
  },

  admission_prep: {
    id: "admission_prep",
    name: "Prepare for Admission",
    description: "Arrange hospital admission for continued care. Based on 2022 Pediatric Emergency Medicine guidelines.",
    category: "supportive",
    timeRequired: 180,
    successRate: 0.90,
    vitalEffects: {}
  },





  epinephrine: {
    id: "epinephrine",
    name: "Epinephrine (Anaphylaxis)",
    description: "Administer intramuscular epinephrine for anaphylaxis. Based on 2022 NIAID Anaphylaxis Guidelines.",
    category: "medication",
    timeRequired: 60,
    successRate: 0.95,
    vitalEffects: {
      bloodPressure: { immediate: 20, delayed: 30, duration: 1800 },
      heartRate: { immediate: 15, delayed: 20, duration: 1800 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["severe hypertension", "cardiac arrhythmia"]
  },

  airway_assessment: {
    id: "airway_assessment",
    name: "Airway Assessment",
    description: "Evaluate airway patency and breathing in anaphylaxis. Based on 2022 PALS guidelines.",
    category: "monitoring",
    timeRequired: 45,
    successRate: 0.95,
    vitalEffects: {
      oxygenSat: { immediate: 0, delayed: 0, duration: 0 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  second_epinephrine: {
    id: "second_epinephrine",
    name: "Second Epinephrine Dose",
    description: "Administer second dose of epinephrine if needed. Based on 2022 NIAID Anaphylaxis Guidelines.",
    category: "medication",
    timeRequired: 60,
    successRate: 0.90,
    vitalEffects: {
      bloodPressure: { immediate: 15, delayed: 25, duration: 1800 },
      heartRate: { immediate: 10, delayed: 15, duration: 1800 }
    },
    contraindications: ["severe hypertension", "cardiac arrhythmia"]
  },

  antihistamine: {
    id: "antihistamine",
    name: "Antihistamine (Diphenhydramine)",
    description: "Administer diphenhydramine for allergic symptoms. Based on 2022 NIAID Anaphylaxis Guidelines.",
    category: "medication",
    timeRequired: 120,
    successRate: 0.85,
    vitalEffects: {
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["glaucoma", "prostatic hypertrophy"]
  },

  fluids: {
    id: "fluids",
    name: "IV Fluids",
    description: "Administer intravenous fluids for volume support. Based on 2022 Pediatric Critical Care guidelines.",
    category: "supportive",
    timeRequired: 180,
    successRate: 0.90,
    vitalEffects: {
      bloodPressure: { immediate: 5, delayed: 8, duration: 1800 },
      heartRate: { immediate: -5, delayed: -8, duration: 1800 }
    }
  },

  observation: {
    id: "observation",
    name: "Extended Observation",
    description: "Observe for biphasic reaction in anaphylaxis. Based on 2022 NIAID Anaphylaxis Guidelines.",
    category: "monitoring",
    timeRequired: 240,
    successRate: 0.95,
    vitalEffects: {}
  },

  allergy_referral: {
    id: "allergy_referral",
    name: "Allergy Referral",
    description: "Arrange follow-up with allergist. Based on 2022 AAP Allergy Guidelines.",
    category: "supportive",
    timeRequired: 120,
    successRate: 0.90,
    vitalEffects: {}
  },

  monitor_seizures: {
    id: "monitor_seizures",
    name: "Seizure Monitoring",
    description: "Continuous monitoring for recurrent seizure activity with EEG if available. Based on 2022 ILAE Guidelines.",
    category: "monitoring",
    timeRequired: 0,
    successRate: 0.95,
    vitalEffects: {}
  },

  labs_basic: {
    id: "labs_basic",
    name: "Basic Laboratory Studies",
    description: "Order CBC, electrolytes, glucose, and basic metabolic panel. Based on 2022 Pediatric Laboratory Medicine guidelines.",
    category: "procedure",
    timeRequired: 300,
    successRate: 0.90,
    vitalEffects: {}
  },

  labs_comprehensive: {
    id: "labs_comprehensive",
    name: "Comprehensive Laboratory Studies",
    description: "Order CBC, electrolytes, glucose, cultures, and additional studies. Based on 2022 Pediatric Critical Care guidelines.",
    category: "procedure",
    timeRequired: 600,
    successRate: 0.85,
    vitalEffects: {}
  },



  // REMOVE NON-EMERGENCY INTERVENTIONS - Keep only emergency care
  // Removed: discharge_planning, follow_up, prescription, education, asthma_action_plan
  
  // ADDITIONAL EVIDENCE-BASED INTERVENTIONS
  antibiotics: {
    id: "antibiotics",
    name: "Antibiotic Therapy",
    description: "Administer appropriate antibiotics based on suspected infection and local resistance patterns. Based on 2022 IDSA Guidelines and 2023 Pediatric Infectious Disease consensus.",
    category: "medication",
    timeRequired: 300,
    successRate: 0.85,
    vitalEffects: {
      temperature: { immediate: 0, delayed: -0.5, duration: 14400 },
      heartRate: { immediate: 0, delayed: -3, duration: 14400 }
    },
    contraindications: ["allergy", "renal failure"]
  },

  pain_management: {
    id: "pain_management",
    name: "Pain Management (Morphine/Fentanyl)",
    description: "Administer appropriate analgesia for severe pain. Based on 2022 AAP Pain Management Guidelines and 2023 Pediatric Critical Care consensus.",
    category: "medication",
    timeRequired: 240,
    successRate: 0.90,
    vitalEffects: {
      heartRate: { immediate: -5, delayed: -8, duration: 7200 },
      respRate: { immediate: -2, delayed: -4, duration: 7200 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["respiratory depression", "shock"]
  },

  ketamine: {
    id: "ketamine",
    name: "Ketamine (Analgesia/Sedation)",
    description: "Administer ketamine for procedural sedation or analgesia. Based on 2022 Pediatric Emergency Medicine guidelines and 2023 Critical Care Medicine studies.",
    category: "medication",
    timeRequired: 180,
    successRate: 0.85,
    vitalEffects: {
      heartRate: { immediate: 8, delayed: 12, duration: 3600 },
      bloodPressure: { immediate: 5, delayed: 8, duration: 3600 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["psychosis", "hypertension"]
  },

  blood_transfusion: {
    id: "blood_transfusion",
    name: "Blood Transfusion",
    description: "Administer packed red blood cells for severe anemia or blood loss. Based on 2022 AABB Guidelines and 2023 Pediatric Critical Care consensus.",
    category: "procedure",
    timeRequired: 1800,
    successRate: 0.95,
    vitalEffects: {
      bloodPressure: { immediate: 8, delayed: 15, duration: 7200 },
      heartRate: { immediate: -8, delayed: -15, duration: 7200 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["volume overload", "cardiac failure"]
  },

  chest_tube: {
    id: "chest_tube",
    name: "Chest Tube Insertion",
    description: "Insertion of chest tube for pneumothorax or hemothorax. Based on 2022 EAST Trauma guidelines.",
    category: "procedure",
    timeRequired: 180,
    successRate: 0.80,
    vitalEffects: {
      heartRate: { immediate: -5, delayed: -10, duration: 300 },
      oxygenSat: { immediate: 8, delayed: 12, duration: 600 },
      respRate: { immediate: -3, delayed: -8, duration: 300 },
      bloodPressure: { immediate: 0, delayed: 5, duration: 300 },
      bloodGlucose: { immediate: 0, delayed: 0, duration: 0 },
      temperature: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  pericardiocentesis: {
    id: "pericardiocentesis",
    name: "Pericardiocentesis",
    description: "Emergency pericardiocentesis for cardiac tamponade. Based on 2021 ACC/AHA guidelines.",
    category: "critical",
    timeRequired: 120,
    successRate: 0.70,
    vitalEffects: {
      heartRate: { immediate: -15, delayed: -25, duration: 600 },
      oxygenSat: { immediate: 5, delayed: 10, duration: 600 },
      respRate: { immediate: -5, delayed: -10, duration: 300 },
      bloodPressure: { immediate: 10, delayed: 20, duration: 600 },
      bloodGlucose: { immediate: 0, delayed: 0, duration: 0 },
      temperature: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  blood_transfusion: {
    id: "blood_transfusion",
    name: "Blood Transfusion",
    description: "Emergency blood transfusion for hemorrhagic shock. Based on 2022 AABB guidelines.",
    category: "critical",
    timeRequired: 300,
    successRate: 0.95,
    vitalEffects: {
      heartRate: { immediate: -10, delayed: -20, duration: 900 },
      oxygenSat: { immediate: 5, delayed: 10, duration: 900 },
      respRate: { immediate: -5, delayed: -10, duration: 600 },
      bloodPressure: { immediate: 15, delayed: 25, duration: 900 },
      bloodGlucose: { immediate: 0, delayed: 0, duration: 0 },
      temperature: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  inotropes: {
    id: "inotropes",
    name: "Inotropic Support",
    description: "Inotropic medications to improve cardiac contractility. Based on 2022 ACC/AHA heart failure guidelines.",
    category: "medication",
    timeRequired: 90,
    successRate: 0.85,
    vitalEffects: {
      heartRate: { immediate: 5, delayed: 0, duration: 600 },
      oxygenSat: { immediate: 3, delayed: 5, duration: 600 },
      respRate: { immediate: -2, delayed: -3, duration: 300 },
      bloodPressure: { immediate: 8, delayed: 15, duration: 600 },
      bloodGlucose: { immediate: 0, delayed: 0, duration: 0 },
      temperature: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  ecmo_preparation: {
    id: "ecmo_preparation",
    name: "ECMO Preparation",
    description: "Preparation for extracorporeal membrane oxygenation support. Based on 2022 ELSO guidelines.",
    category: "critical",
    timeRequired: 600,
    successRate: 0.90,
    vitalEffects: {
      heartRate: { immediate: 0, delayed: 0, duration: 0 },
      oxygenSat: { immediate: 0, delayed: 0, duration: 0 },
      respRate: { immediate: 0, delayed: 0, duration: 0 },
      bloodPressure: { immediate: 0, delayed: 0, duration: 0 },
      bloodGlucose: { immediate: 0, delayed: 0, duration: 0 },
      temperature: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  therapeutic_hypothermia: {
    id: "therapeutic_hypothermia",
    name: "Therapeutic Hypothermia",
    description: "Induced hypothermia for neuroprotection post-cardiac arrest. Based on 2020 AHA guidelines.",
    category: "critical",
    timeRequired: 900,
    successRate: 0.80,
    vitalEffects: {
      heartRate: { immediate: -10, delayed: -20, duration: 3600 },
      oxygenSat: { immediate: 0, delayed: 0, duration: 0 },
      respRate: { immediate: -5, delayed: -8, duration: 1800 },
      bloodPressure: { immediate: 0, delayed: 0, duration: 0 },
      bloodGlucose: { immediate: 0, delayed: 0, duration: 0 },
      temperature: { immediate: -2, delayed: -4, duration: 3600 }
    }
  },

  chest_compressions: {
    id: "chest_compressions",
    name: "Chest Compressions",
    description: "High-quality chest compressions for cardiopulmonary resuscitation. Based on 2020 AHA Pediatric Advanced Life Support guidelines.",
    category: "critical",
    timeRequired: 30,
    successRate: 0.85,
    vitalEffects: {
      heartRate: { immediate: 0, delayed: 0, duration: 0 },
      oxygenSat: { immediate: 0, delayed: 0, duration: 0 },
      respRate: { immediate: 0, delayed: 0, duration: 0 },
      bloodPressure: { immediate: 0, delayed: 0, duration: 0 },
      bloodGlucose: { immediate: 0, delayed: 0, duration: 0 },
      temperature: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  defibrillation: {
    id: "defibrillation",
    name: "Defibrillation",
    description: "Electrical cardioversion for shockable rhythms (VF/VT). Based on 2020 AHA Pediatric Advanced Life Support guidelines.",
    category: "critical",
    timeRequired: 45,
    successRate: 0.75,
    vitalEffects: {
      heartRate: { immediate: 0, delayed: 0, duration: 0 },
      oxygenSat: { immediate: 0, delayed: 0, duration: 0 },
      respRate: { immediate: 0, delayed: 0, duration: 0 },
      bloodPressure: { immediate: 0, delayed: 0, duration: 0 },
      bloodGlucose: { immediate: 0, delayed: 0, duration: 0 },
      temperature: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  lumbar_puncture: {
    id: "lumbar_puncture",
    name: "Lumbar Puncture",
    description: "Perform lumbar puncture for suspected meningitis or encephalitis. Based on 2022 IDSA Guidelines and 2023 Pediatric Neurology consensus.",
    category: "procedure",
    timeRequired: 600,
    successRate: 0.85,
    vitalEffects: {
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["increased ICP", "coagulopathy"]
  },

  central_line: {
    id: "central_line",
    name: "Central Venous Catheter",
    description: "Place central venous catheter for medication administration or monitoring. Based on 2022 Pediatric Critical Care guidelines and 2023 Vascular Access consensus.",
    category: "procedure",
    timeRequired: 900,
    successRate: 0.80,
    vitalEffects: {
      bloodPressure: { immediate: 0, delayed: 0, duration: 0 }
    },
    contraindications: ["coagulopathy", "infection at site"]
  },

  // Rapid Response Interventions for Critical Situations
  rapid_oxygen_boost: {
    id: "rapid_oxygen_boost",
    name: "Rapid Oxygen Boost",
    description: "Immediate high-flow oxygen delivery for critical hypoxemia. Based on 2022 Pediatric Emergency Medicine guidelines.",
    category: "critical",
    timeRequired: 15,
    successRate: 0.95,
    vitalEffects: {
      oxygenSat: { immediate: 15, delayed: 20, duration: 300 },
      respRate: { immediate: -8, delayed: -12, duration: 300 },
      heartRate: { immediate: -10, delayed: -15, duration: 300 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  rapid_cardiac_stabilization: {
    id: "rapid_cardiac_stabilization",
    name: "Rapid Cardiac Stabilization",
    description: "Immediate cardiac support for critical tachycardia or bradycardia. Based on 2022 PALS guidelines.",
    category: "critical",
    timeRequired: 20,
    successRate: 0.90,
    vitalEffects: {
      heartRate: { immediate: -20, delayed: -30, duration: 600 },
      bloodPressure: { immediate: 10, delayed: 15, duration: 600 },
      oxygenSat: { immediate: 5, delayed: 8, duration: 600 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  rapid_airway_management: {
    id: "rapid_airway_management",
    name: "Rapid Airway Management",
    description: "Immediate airway intervention for respiratory failure. Based on 2022 Pediatric Airway Management guidelines.",
    category: "critical",
    timeRequired: 25,
    successRate: 0.85,
    vitalEffects: {
      oxygenSat: { immediate: 20, delayed: 25, duration: 600 },
      respRate: { immediate: -10, delayed: -15, duration: 600 },
      heartRate: { immediate: -15, delayed: -20, duration: 600 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  // Additional missing interventions
  imaging: {
    id: "imaging",
    name: "Diagnostic Imaging",
    description: "Order appropriate diagnostic imaging studies (X-ray, CT, MRI) based on clinical presentation. Based on 2022 Pediatric Radiology guidelines.",
    category: "diagnostic",
    timeRequired: 120,
    successRate: 0.95,
    vitalEffects: {
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  pain_management: {
    id: "pain_management",
    name: "Pain Management",
    description: "Administer appropriate pain medications for patient comfort. Based on 2022 Pediatric Pain Management guidelines.",
    category: "medication",
    timeRequired: 60,
    successRate: 0.90,
    vitalEffects: {
      heartRate: { immediate: -5, delayed: -8, duration: 1800 },
      respRate: { immediate: -3, delayed: -5, duration: 1800 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    }
  },

  ketamine: {
    id: "ketamine",
    name: "Ketamine Administration",
    description: "Administer ketamine for procedural sedation or pain management. Based on 2022 Pediatric Sedation guidelines.",
    category: "medication",
    timeRequired: 90,
    successRate: 0.85,
    vitalEffects: {
      heartRate: { immediate: 5, delayed: 0, duration: 1800 },
      bloodPressure: { immediate: 3, delayed: 0, duration: 1800 },
      consciousness: { immediate: 0, delayed: 0, duration: 0 }
    }
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
  category: z.enum(['febrile_seizure', 'respiratory_distress', 'asthma_exacerbation', 'anaphylaxis', 'sepsis', 'dehydration', 'trauma', 'cardiac_arrest', 'septic_shock', 'trauma_resuscitation']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert', 'moderate', 'high', 'critical']),
  estimatedTime: z.union([z.number(), z.string()]),
  initialVitals: z.object({
    heartRate: z.number(),
    temperature: z.number(),
    respRate: z.number(),
    bloodPressure: z.string().optional(),
    oxygenSat: z.number().optional(),
    bloodGlucose: z.number().optional(),
    consciousness: z.string().optional()
  }).optional(),
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
    timeWindow: z.number().optional(),
    critical: z.boolean().optional()
  })).optional(),
  learningObjectives: z.array(z.string()).optional(),
  references: z.array(z.string()).optional(),
  description: z.string().optional()
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