#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { COMPLETE_ALIEM_CASES } from './complete-aliem-cases';

interface ALiEMCase {
  id: string;
  category: string;
  displayName: string;
  sourceVersion: string;
  license: string;
  sourceCitation: string;
  variants: ALiEMVariant[];
}

interface ALiEMVariant {
  variantId: string;
  ageBand: string;
  ageYears: number;
  weightKg: number;
  initialVitals: any; // Changed to any to accommodate deterministic vitals
  stages: ALiEMStage[];
}

interface ALiEMStage {
  stage: number;
  name: string;
  ordered: boolean;
  severity: 'low' | 'moderate' | 'severe';
  TTIsec: number;
  requiredInterventions: string[];
  helpful: string[];
  harmful: string[];
  neutral: string[];
  vitalEffects: Record<string, any>; // Changed to any to accommodate deterministic vitals
}

// ============================================================================
// VITAL SIGNS CALCULATION ENGINE
// ============================================================================

interface AgeBasedVitals {
  heartRate: { min: number; max: number; normal: number };
  respRate: { min: number; max: number; normal: number };
  bloodPressureSys: { min: number; max: number; normal: number };
  bloodPressureDia: { min: number; max: number; normal: number };
  spo2: { min: number; max: number; normal: number };
  temperature: { min: number; max: number; normal: number };
}

interface SeverityOffsets {
  heartRate: number;
  respRate: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  spo2: number;
  temperature: number;
}

// Age-based normal vital signs (PALS guidelines)
const AGE_BASED_VITALS: Record<string, AgeBasedVitals> = {
  neonatal: {
    heartRate: { min: 100, max: 180, normal: 140 },
    respRate: { min: 30, max: 60, normal: 45 },
    bloodPressureSys: { min: 60, max: 90, normal: 75 },
    bloodPressureDia: { min: 35, max: 55, normal: 45 },
    spo2: { min: 95, max: 100, normal: 98 },
    temperature: { min: 36.5, max: 37.5, normal: 37.0 }
  },
  infant: {
    heartRate: { min: 80, max: 160, normal: 120 },
    respRate: { min: 24, max: 40, normal: 32 },
    bloodPressureSys: { min: 70, max: 100, normal: 85 },
    bloodPressureDia: { min: 40, max: 60, normal: 50 },
    spo2: { min: 95, max: 100, normal: 98 },
    temperature: { min: 36.5, max: 37.5, normal: 37.0 }
  },
  toddler: {
    heartRate: { min: 70, max: 140, normal: 105 },
    respRate: { min: 20, max: 32, normal: 26 },
    bloodPressureSys: { min: 80, max: 110, normal: 95 },
    bloodPressureDia: { min: 45, max: 65, normal: 55 },
    spo2: { min: 95, max: 100, normal: 98 },
    temperature: { min: 36.5, max: 37.5, normal: 37.0 }
  },
  preschool: {
    heartRate: { min: 65, max: 130, normal: 97 },
    respRate: { min: 18, max: 28, normal: 23 },
    bloodPressureSys: { min: 85, max: 115, normal: 100 },
    bloodPressureDia: { min: 50, max: 70, normal: 60 },
    spo2: { min: 95, max: 100, normal: 98 },
    temperature: { min: 36.5, max: 37.5, normal: 37.0 }
  },
  school: {
    heartRate: { min: 60, max: 120, normal: 90 },
    respRate: { min: 16, max: 26, normal: 21 },
    bloodPressureSys: { min: 90, max: 120, normal: 105 },
    bloodPressureDia: { min: 55, max: 75, normal: 65 },
    spo2: { min: 95, max: 100, normal: 98 },
    temperature: { min: 36.5, max: 37.5, normal: 37.0 }
  },
  adolescent: {
    heartRate: { min: 55, max: 110, normal: 82 },
    respRate: { min: 14, max: 24, normal: 19 },
    bloodPressureSys: { min: 95, max: 125, normal: 110 },
    bloodPressureDia: { min: 60, max: 80, normal: 70 },
    spo2: { min: 95, max: 100, normal: 98 },
    temperature: { min: 36.5, max: 37.5, normal: 37.0 }
  }
};

// Severity-based offsets for vital signs
const SEVERITY_OFFSETS: Record<string, SeverityOffsets> = {
  mild: {
    heartRate: 10,
    respRate: 5,
    bloodPressureSys: -5,
    bloodPressureDia: -3,
    spo2: -1,
    temperature: 0.5
  },
  moderate: {
    heartRate: 25,
    respRate: 12,
    bloodPressureSys: -10,
    bloodPressureDia: -8,
    spo2: -3,
    temperature: 1.0
  },
  severe: {
    heartRate: 40,
    respRate: 20,
    bloodPressureSys: -20,
    bloodPressureDia: -15,
    spo2: -5,
    temperature: 1.5
  },
  critical: {
    heartRate: 60,
    respRate: 30,
    bloodPressureSys: -30,
    bloodPressureDia: -25,
    spo2: -8,
    temperature: 2.0
  }
};

// Calculate deterministic vital signs based on age and severity
function calculateVitals(ageBand: string, severity: string): any {
  const baseVitals = AGE_BASED_VITALS[ageBand];
  const offsets = SEVERITY_OFFSETS[severity];
  
  if (!baseVitals || !offsets) {
    console.warn(`Missing vital data for ageBand: ${ageBand}, severity: ${severity}`);
    return {
      heartRate: null,
      respRate: null,
      bloodPressureSys: null,
      bloodPressureDia: null,
      spo2: null,
      temperature: null
    };
  }

  return {
    heartRate: Math.round(baseVitals.heartRate.normal + offsets.heartRate),
    respRate: Math.round(baseVitals.respRate.normal + offsets.respRate),
    bloodPressureSys: Math.round(baseVitals.bloodPressureSys.normal + offsets.bloodPressureSys),
    bloodPressureDia: Math.round(baseVitals.bloodPressureDia.normal + offsets.bloodPressureDia),
    spo2: Math.round(baseVitals.spo2.normal + offsets.spo2),
    temperature: Math.round((baseVitals.temperature.normal + offsets.temperature) * 10) / 10
  };
}

// Calculate vital effects for interventions
function calculateVitalEffects(intervention: string, severity: string): any {
  const baseEffects: Record<string, any> = {
    // Anaphylaxis interventions
    "IM epinephrine": { heartRate: -15, respRate: -8, bloodPressureSys: +15, spo2: +3 },
    "IV fluids bolus": { bloodPressureSys: +8, bloodPressureDia: +5 },
    "diphenhydramine IV": { heartRate: -5, respRate: -2 },
    "H2 blocker IV": { heartRate: -3, respRate: -1 },
    "nebulized beta-agonist": { respRate: -5, spo2: +2 },
    "steroids IV": { heartRate: -2, respRate: -1 },
    "delay epinephrine": { bloodPressureSys: -12, spo2: -4 },
    "epinephrine PO": { heartRate: +10, bloodPressureSys: -8 },
    
    // Cardiac interventions
    "PGE1": { heartRate: +5, bloodPressureSys: -5 },
    "consultant coordination": { heartRate: 0, respRate: 0, bloodPressureSys: 0, spo2: 0 },
    "pericardiocentesis": { heartRate: -10, respRate: -5, bloodPressureSys: +10, spo2: +3 },
    
    // Respiratory interventions
    "albuterol nebulizer": { respRate: -8, spo2: +4 },
    "ipratropium nebulizer": { respRate: -3, spo2: +2 },
    "magnesium sulfate": { heartRate: -5, respRate: -3 },
    "ketamine": { heartRate: +10, respRate: -5, bloodPressureSys: +5 },
    
    // Seizure interventions
    "lorazepam IV": { heartRate: -8, respRate: -5, bloodPressureSys: -5 },
    "midazolam IM": { heartRate: -5, respRate: -3, bloodPressureSys: -3 },
    "phenytoin IV": { heartRate: -3, respRate: -2, bloodPressureSys: -5 },
    "fosphenytoin IV": { heartRate: -3, respRate: -2, bloodPressureSys: -5 },
    
    // Shock interventions
    "crystalloid bolus": { bloodPressureSys: +10, bloodPressureDia: +6 },
    "vasopressor": { bloodPressureSys: +15, bloodPressureDia: +10, heartRate: -8 },
    "antibiotics": { heartRate: -5, respRate: -3, temperature: -0.5 },
    
    // Trauma interventions
    "cervical collar": { heartRate: 0, respRate: 0, bloodPressureSys: 0, spo2: 0 },
    "splinting": { heartRate: -3, respRate: -2 },
    "wound care": { heartRate: -2, respRate: -1 },
    
    // Default for unknown interventions
    "default": { heartRate: 0, respRate: 0, bloodPressureSys: 0, spo2: 0, temperature: 0 }
  };

  const effects = baseEffects[intervention] || baseEffects["default"];
  
  // Apply severity multiplier
  const severityMultiplier = {
    mild: 0.7,
    moderate: 1.0,
    severe: 1.3,
    critical: 1.6
  }[severity] || 1.0;

  return Object.fromEntries(
    Object.entries(effects).map(([key, value]) => [
      key,
      Math.round((value as number) * severityMultiplier)
    ])
  );
}

// ============================================================================
// ALiEM CASE DEFINITIONS
// ============================================================================

// ALiEM case definitions based on the PDF content
const ALIEM_CASES: ALiEMCase[] = COMPLETE_ALIEM_CASES;
    variants: [
      {
        variantId: "A",
        ageBand: "school",
        ageYears: 6,
        weightKg: 25,
        initialVitals: calculateVitals("school", "severe"),
        stages: [
          {
            stage: 1,
            name: "Recognition & ABCs",
            ordered: false,
            severity: "severe",
            TTIsec: 60,
            requiredInterventions: ["IM epinephrine"],
            helpful: ["IV fluids bolus", "diphenhydramine IV", "H2 blocker IV", "nebulized beta-agonist", "steroids IV"],
            harmful: ["delay epinephrine", "epinephrine PO", "unnecessary intubation without indications"],
            neutral: ["CBC", "CXR (normal)"],
            vitalEffects: {
              "IM epinephrine": calculateVitalEffects("IM epinephrine", "severe"),
              "IV fluids bolus": calculateVitalEffects("IV fluids bolus", "severe"),
              "delay epinephrine": calculateVitalEffects("delay epinephrine", "severe")
            }
          },
          {
            stage: 2,
            name: "Initial Therapy & Monitoring",
            ordered: true,
            severity: "moderate",
            TTIsec: 300,
            requiredInterventions: ["continuous monitoring", "IV access"],
            helpful: ["H2 blocker IV", "steroids IV", "albuterol nebulizer"],
            harmful: ["discharge without observation", "inadequate monitoring"],
            neutral: ["allergy testing", "discharge planning"],
            vitalEffects: {
              "continuous monitoring": calculateVitalEffects("default", "moderate"),
              "IV access": calculateVitalEffects("default", "moderate"),
              "H2 blocker IV": calculateVitalEffects("H2 blocker IV", "moderate"),
              "steroids IV": calculateVitalEffects("steroids IV", "moderate"),
              "albuterol nebulizer": calculateVitalEffects("albuterol nebulizer", "moderate")
            }
          },
          {
            stage: 3,
            name: "Stabilization & Observation",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: ["extended observation", "vital reassessment"],
            helpful: ["oral antihistamines", "epinephrine auto-injector training"],
            harmful: ["premature discharge", "inadequate follow-up planning"],
            neutral: ["allergy referral", "discharge instructions"],
            vitalEffects: {
              "extended observation": calculateVitalEffects("default", "moderate"),
              "vital reassessment": calculateVitalEffects("default", "moderate"),
              "oral antihistamines": calculateVitalEffects("diphenhydramine IV", "moderate")
            }
          },
          {
            stage: 4,
            name: "Discharge & Follow-up",
            ordered: true,
            severity: "low",
            TTIsec: 900,
            requiredInterventions: ["epinephrine auto-injector prescription", "discharge instructions", "follow-up planning"],
            helpful: ["allergy referral", "patient education"],
            harmful: ["missing epinephrine prescription", "inadequate discharge instructions"],
            neutral: ["allergy testing scheduling", "home monitoring instructions"],
            vitalEffects: {
              "epinephrine auto-injector prescription": calculateVitalEffects("default", "low"),
              "discharge instructions": calculateVitalEffects("default", "low"),
              "follow-up planning": calculateVitalEffects("default", "low")
            }
          }
        ]
      },
      {
        variantId: "B",
        ageBand: "toddler",
        ageYears: 3,
        weightKg: 15,
        initialVitals: calculateVitals("toddler", "severe"),
        stages: [
          {
            stage: 1,
            name: "Recognition & ABCs",
            ordered: false,
            severity: "severe",
            TTIsec: 60,
            requiredInterventions: ["IM epinephrine"],
            helpful: ["IV fluids bolus", "diphenhydramine IV", "H2 blocker IV", "nebulized beta-agonist", "steroids IV"],
            harmful: ["delay epinephrine", "epinephrine PO", "unnecessary intubation without indications"],
            neutral: ["CBC", "CXR (normal)"],
            vitalEffects: {
              "IM epinephrine": calculateVitalEffects("IM epinephrine", "severe"),
              "IV fluids bolus": calculateVitalEffects("IV fluids bolus", "severe"),
              "delay epinephrine": calculateVitalEffects("delay epinephrine", "severe")
            }
          },
          {
            stage: 2,
            name: "Initial Therapy & Monitoring",
            ordered: true,
            severity: "moderate",
            TTIsec: 300,
            requiredInterventions: ["continuous monitoring", "IV access"],
            helpful: ["H2 blocker IV", "steroids IV", "albuterol nebulizer"],
            harmful: ["discharge without observation", "inadequate monitoring"],
            neutral: ["allergy testing", "discharge planning"],
            vitalEffects: {
              "continuous monitoring": calculateVitalEffects("default", "moderate"),
              "IV access": calculateVitalEffects("default", "moderate"),
              "H2 blocker IV": calculateVitalEffects("H2 blocker IV", "moderate"),
              "steroids IV": calculateVitalEffects("steroids IV", "moderate"),
              "albuterol nebulizer": calculateVitalEffects("albuterol nebulizer", "moderate")
            }
          },
          {
            stage: 3,
            name: "Stabilization & Observation",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: ["extended observation", "vital reassessment"],
            helpful: ["oral antihistamines", "epinephrine auto-injector training"],
            harmful: ["premature discharge", "inadequate follow-up planning"],
            neutral: ["allergy referral", "discharge instructions"],
            vitalEffects: {
              "extended observation": calculateVitalEffects("default", "moderate"),
              "vital reassessment": calculateVitalEffects("default", "moderate"),
              "oral antihistamines": calculateVitalEffects("diphenhydramine IV", "moderate")
            }
          },
          {
            stage: 4,
            name: "Discharge & Follow-up",
            ordered: true,
            severity: "low",
            TTIsec: 900,
            requiredInterventions: ["epinephrine auto-injector prescription", "discharge instructions", "follow-up planning"],
            helpful: ["allergy referral", "patient education"],
            harmful: ["missing epinephrine prescription", "inadequate discharge instructions"],
            neutral: ["allergy testing scheduling", "home monitoring instructions"],
            vitalEffects: {
              "epinephrine auto-injector prescription": calculateVitalEffects("default", "low"),
              "discharge instructions": calculateVitalEffects("default", "low"),
              "follow-up planning": calculateVitalEffects("default", "low")
            }
          }
        ]
      },
      {
        variantId: "C",
        ageBand: "school",
        ageYears: 6,
        weightKg: 25,
        initialVitals: calculateVitals("school", "severe"),
        stages: [
          {
            stage: 1,
            name: "Recognition & ABCs",
            ordered: false,
            severity: "severe",
            TTIsec: 60,
            requiredInterventions: ["IM epinephrine"],
            helpful: ["IV fluids bolus", "diphenhydramine IV", "H2 blocker IV", "nebulized beta-agonist", "steroids IV"],
            harmful: ["delay epinephrine", "epinephrine PO", "unnecessary intubation without indications"],
            neutral: ["CBC", "CXR (normal)"],
            vitalEffects: {
              "IM epinephrine": calculateVitalEffects("IM epinephrine", "severe"),
              "IV fluids bolus": calculateVitalEffects("IV fluids bolus", "severe"),
              "delay epinephrine": calculateVitalEffects("delay epinephrine", "severe")
            }
          },
          {
            stage: 2,
            name: "Initial Therapy & Monitoring",
            ordered: true,
            severity: "moderate",
            TTIsec: 300,
            requiredInterventions: ["continuous monitoring", "IV access"],
            helpful: ["H2 blocker IV", "steroids IV", "albuterol nebulizer"],
            harmful: ["discharge without observation", "inadequate monitoring"],
            neutral: ["allergy testing", "discharge planning"],
            vitalEffects: {
              "continuous monitoring": calculateVitalEffects("default", "moderate"),
              "IV access": calculateVitalEffects("default", "moderate"),
              "H2 blocker IV": calculateVitalEffects("H2 blocker IV", "moderate"),
              "steroids IV": calculateVitalEffects("steroids IV", "moderate"),
              "albuterol nebulizer": calculateVitalEffects("albuterol nebulizer", "moderate")
            }
          },
          {
            stage: 3,
            name: "Stabilization & Observation",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: ["extended observation", "vital reassessment"],
            helpful: ["oral antihistamines", "epinephrine auto-injector training"],
            harmful: ["premature discharge", "inadequate follow-up planning"],
            neutral: ["allergy referral", "discharge instructions"],
            vitalEffects: {
              "extended observation": calculateVitalEffects("default", "moderate"),
              "vital reassessment": calculateVitalEffects("default", "moderate"),
              "oral antihistamines": calculateVitalEffects("diphenhydramine IV", "moderate")
            }
          },
          {
            stage: 4,
            name: "Discharge & Follow-up",
            ordered: true,
            severity: "low",
            TTIsec: 900,
            requiredInterventions: ["epinephrine auto-injector prescription", "discharge instructions", "follow-up planning"],
            helpful: ["allergy referral", "patient education"],
            harmful: ["missing epinephrine prescription", "inadequate discharge instructions"],
            neutral: ["allergy testing scheduling", "home monitoring instructions"],
            vitalEffects: {
              "epinephrine auto-injector prescription": calculateVitalEffects("default", "low"),
              "discharge instructions": calculateVitalEffects("default", "low"),
              "follow-up planning": calculateVitalEffects("default", "low")
            }
          }
        ]
      }
    ]
  },
  {
    id: "aliem_case_02_cardiac_tamponade",
    category: "Cardiac Tamponade",
    displayName: "Cardiac Tamponade",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 2: Cardiac Tamponade",
    variants: [
      {
        variantId: "A",
        ageBand: "adolescent",
        ageYears: 16,
        weightKg: 60,
        initialVitals: calculateVitals("adolescent", "critical"),
        stages: [
          {
            stage: 1,
            name: "Recognition & ABCs",
            ordered: false,
            severity: "critical",
            TTIsec: 30,
            requiredInterventions: ["pericardiocentesis", "consultant coordination"],
            helpful: ["IV fluids bolus", "vasopressors", "ECG monitoring"],
            harmful: ["delay pericardiocentesis", "inadequate monitoring", "aggressive fluid resuscitation"],
            neutral: ["CBC", "CXR", "echocardiogram"],
            vitalEffects: {
              "pericardiocentesis": calculateVitalEffects("pericardiocentesis", "critical"),
              "consultant coordination": calculateVitalEffects("consultant coordination", "critical"),
              "IV fluids bolus": calculateVitalEffects("crystalloid bolus", "critical"),
              "vasopressors": calculateVitalEffects("vasopressor", "critical")
            }
          },
          {
            stage: 2,
            name: "Stabilization & Monitoring",
            ordered: true,
            severity: "severe",
            TTIsec: 300,
            requiredInterventions: ["continuous monitoring", "repeat echocardiogram"],
            helpful: ["antibiotics if infectious", "steroids if inflammatory"],
            harmful: ["premature discharge", "inadequate follow-up"],
            neutral: ["cardiology referral", "discharge planning"],
            vitalEffects: {
              "continuous monitoring": calculateVitalEffects("default", "severe"),
              "repeat echocardiogram": calculateVitalEffects("default", "severe"),
              "antibiotics if infectious": calculateVitalEffects("antibiotics", "severe"),
              "steroids if inflammatory": calculateVitalEffects("steroids IV", "severe")
            }
          },
          {
            stage: 3,
            name: "Disposition & Follow-up",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: ["cardiology consultation", "discharge planning"],
            helpful: ["patient education", "follow-up appointment"],
            harmful: ["inadequate follow-up", "missing patient instructions"],
            neutral: ["referral to specialist", "home monitoring instructions"],
            vitalEffects: {
              "cardiology consultation": calculateVitalEffects("default", "moderate"),
              "discharge planning": calculateVitalEffects("default", "moderate"),
              "patient education": calculateVitalEffects("default", "moderate")
            }
          }
        ]
      },
      {
        variantId: "B",
        ageBand: "school",
        ageYears: 8,
        weightKg: 30,
        initialVitals: calculateVitals("school", "critical"),
        stages: [
          {
            stage: 1,
            name: "Recognition & ABCs",
            ordered: false,
            severity: "critical",
            TTIsec: 30,
            requiredInterventions: ["pericardiocentesis", "consultant coordination"],
            helpful: ["IV fluids bolus", "vasopressors", "ECG monitoring"],
            harmful: ["delay pericardiocentesis", "inadequate monitoring", "aggressive fluid resuscitation"],
            neutral: ["CBC", "CXR", "echocardiogram"],
            vitalEffects: {
              "pericardiocentesis": calculateVitalEffects("pericardiocentesis", "critical"),
              "consultant coordination": calculateVitalEffects("consultant coordination", "critical"),
              "IV fluids bolus": calculateVitalEffects("crystalloid bolus", "critical"),
              "vasopressors": calculateVitalEffects("vasopressor", "critical")
            }
          },
          {
            stage: 2,
            name: "Stabilization & Monitoring",
            ordered: true,
            severity: "severe",
            TTIsec: 300,
            requiredInterventions: ["continuous monitoring", "repeat echocardiogram"],
            helpful: ["antibiotics if infectious", "steroids if inflammatory"],
            harmful: ["premature discharge", "inadequate follow-up"],
            neutral: ["cardiology referral", "discharge planning"],
            vitalEffects: {
              "continuous monitoring": calculateVitalEffects("default", "severe"),
              "repeat echocardiogram": calculateVitalEffects("default", "severe"),
              "antibiotics if infectious": calculateVitalEffects("antibiotics", "severe"),
              "steroids if inflammatory": calculateVitalEffects("steroids IV", "severe")
            }
          },
          {
            stage: 3,
            name: "Disposition & Follow-up",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: ["cardiology consultation", "discharge planning"],
            helpful: ["patient education", "follow-up appointment"],
            harmful: ["inadequate follow-up", "missing patient instructions"],
            neutral: ["referral to specialist", "home monitoring instructions"],
            vitalEffects: {
              "cardiology consultation": calculateVitalEffects("default", "moderate"),
              "discharge planning": calculateVitalEffects("default", "moderate"),
              "patient education": calculateVitalEffects("default", "moderate")
            }
          }
        ]
      },
      {
        variantId: "C",
        ageBand: "adolescent",
        ageYears: 16,
        weightKg: 60,
        initialVitals: calculateVitals("adolescent", "critical"),
        stages: [
          {
            stage: 1,
            name: "Recognition & ABCs",
            ordered: false,
            severity: "critical",
            TTIsec: 30,
            requiredInterventions: ["pericardiocentesis", "consultant coordination"],
            helpful: ["IV fluids bolus", "vasopressors", "ECG monitoring"],
            harmful: ["delay pericardiocentesis", "inadequate monitoring", "aggressive fluid resuscitation"],
            neutral: ["CBC", "CXR", "echocardiogram"],
            vitalEffects: {
              "pericardiocentesis": calculateVitalEffects("pericardiocentesis", "critical"),
              "consultant coordination": calculateVitalEffects("consultant coordination", "critical"),
              "IV fluids bolus": calculateVitalEffects("crystalloid bolus", "critical"),
              "vasopressors": calculateVitalEffects("vasopressor", "critical")
            }
          },
          {
            stage: 2,
            name: "Stabilization & Monitoring",
            ordered: true,
            severity: "severe",
            TTIsec: 300,
            requiredInterventions: ["continuous monitoring", "repeat echocardiogram"],
            helpful: ["antibiotics if infectious", "steroids if inflammatory"],
            harmful: ["premature discharge", "inadequate follow-up"],
            neutral: ["cardiology referral", "discharge planning"],
            vitalEffects: {
              "continuous monitoring": calculateVitalEffects("default", "severe"),
              "repeat echocardiogram": calculateVitalEffects("default", "severe"),
              "antibiotics if infectious": calculateVitalEffects("antibiotics", "severe"),
              "steroids if inflammatory": calculateVitalEffects("steroids IV", "severe")
            }
          },
          {
            stage: 3,
            name: "Disposition & Follow-up",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: ["cardiology consultation", "discharge planning"],
            helpful: ["patient education", "follow-up appointment"],
            harmful: ["inadequate follow-up", "missing patient instructions"],
            neutral: ["referral to specialist", "home monitoring instructions"],
            vitalEffects: {
              "cardiology consultation": calculateVitalEffects("default", "moderate"),
              "discharge planning": calculateVitalEffects("default", "moderate"),
              "patient education": calculateVitalEffects("default", "moderate")
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_03_cah_adrenal_insufficiency',
    category: 'CAH/Adrenal Insufficiency',
    displayName: 'CAH/Adrenal Insufficiency Shock',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 3: CAH/Adrenal Insufficiency',
    variants: [
      {
        variantId: 'A',
        ageBand: 'infant',
        ageYears: 8,
        weightKg: 8,
        initialVitals: {
          heartRate: 160,
          respRate: 40,
          bloodPressureSys: 70,
          bloodPressureDia: 40,
          spo2: 85,
          temperature: 96.8,
          bloodGlucose: 45,
          consciousness: 'lethargic',
          capillaryRefill: 4
        },
        stages: [
          {
            stage: 1,
            name: 'Recognition & ABCs',
            ordered: false,
            severity: 'critical',
            TTIsec: 30,
            requiredInterventions: ['IV hydrocortisone', 'IV fluids', 'dextrose'],
            helpful: ['stress dose steroids', 'electrolyte correction', 'warmth'],
            harmful: ['delay steroids', 'cold fluids', 'insulin'],
            neutral: ['CBC', 'electrolytes', 'discharge planning'],
            vitalEffects: {
              'IV hydrocortisone': { heartRate: -20, respRate: -8, bloodPressureSys: 25, spo2: 8, bloodGlucose: 50 },
              'IV fluids': { bloodPressureSys: 15, temperature: 2 },
              'dextrose': { bloodGlucose: 80, consciousness: 1 }
            }
          },
          {
            stage: 2,
            name: 'Stabilization & Monitoring',
            ordered: true,
            severity: 'moderate',
            TTIsec: 300,
            requiredInterventions: ['continuous monitoring', 'electrolyte monitoring'],
            helpful: ['maintenance fluids', 'ongoing steroids', 'nutrition support'],
            harmful: ['discharge too early', 'missing endocrine follow-up'],
            neutral: ['discharge instructions', 'follow-up scheduling'],
            vitalEffects: {
              'continuous monitoring': {},
              'maintenance fluids': { bloodPressureSys: 5, temperature: 1 }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_04_congenital_heart_lesion',
    category: 'Congenital Heart Lesion',
    displayName: 'Congenital Heart Lesion',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 4: Congenital Heart Lesion',
    variants: [
      {
        variantId: 'A',
        ageBand: 'neonate',
        ageYears: 0.1,
        weightKg: 3.5,
        initialVitals: {
          heartRate: 180,
          respRate: 60,
          bloodPressureSys: 65,
          bloodPressureDia: 35,
          spo2: 75,
          temperature: 97.0,
          consciousness: 'irritable',
          capillaryRefill: 4
        },
        stages: [
          {
            stage: 1,
            name: 'Recognition & ABCs',
            ordered: false,
            severity: 'critical',
            TTIsec: 30,
            requiredInterventions: ['PGE1 infusion', 'cardiology consult', 'IV access'],
            helpful: ['oxygen', 'IV fluids', 'prostaglandin preparation'],
            harmful: ['delay PGE1', 'cold stress', 'dehydration'],
            neutral: ['CBC', 'chest X-ray', 'discharge planning'],
            vitalEffects: {
              'PGE1 infusion': { heartRate: -25, respRate: -10, spo2: 15, bloodPressureSys: 20 },
              'cardiology consult': { heartRate: -5, bloodPressureSys: 3 },
              'delay PGE1': { spo2: -10, bloodPressureSys: -15 }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_05_dka',
    category: 'DKA',
    displayName: 'Diabetic Ketoacidosis',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 5: DKA',
    variants: [
      {
        variantId: 'A',
        ageBand: 'adolescent',
        ageYears: 14,
        weightKg: 55,
        initialVitals: {
          heartRate: 130,
          respRate: 35,
          bloodPressureSys: 90,
          bloodPressureDia: 60,
          spo2: 95,
          temperature: 98.6,
          bloodGlucose: 450,
          consciousness: 'alert',
          capillaryRefill: 3
        },
        stages: [
          {
            stage: 1,
            name: 'Recognition & ABCs',
            ordered: false,
            severity: 'severe',
            TTIsec: 60,
            requiredInterventions: ['IV fluids', 'insulin drip', 'electrolyte monitoring'],
            helpful: ['cardiac monitoring', 'ABG', 'ketone monitoring'],
            harmful: ['bicarbonate bolus', 'insulin bolus', 'rapid fluid bolus'],
            neutral: ['CBC', 'CMP', 'discharge planning'],
            vitalEffects: {
              'IV fluids': { heartRate: -8, bloodPressureSys: 10, consciousness: 1 },
              'insulin drip': { bloodGlucose: -100, consciousness: 1 },
              'bicarbonate bolus': { heartRate: 5, consciousness: -1 }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_06_foreign_body_aspiration',
    category: 'Foreign Body Aspiration',
    displayName: 'Foreign Body Aspiration',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 6: Foreign Body Aspiration',
    variants: [
      {
        variantId: 'A',
        ageBand: 'toddler',
        ageYears: 2,
        weightKg: 12,
        initialVitals: {
          heartRate: 140,
          respRate: 45,
          bloodPressureSys: 80,
          bloodPressureDia: 50,
          spo2: 85,
          temperature: 98.6,
          consciousness: 'alert',
          capillaryRefill: 3
        },
        stages: [
          {
            stage: 1,
            name: 'Recognition & ABCs',
            ordered: false,
            severity: 'severe',
            TTIsec: 60,
            requiredInterventions: ['back blows', 'chest thrusts', 'laryngoscopy'],
            helpful: ['oxygen', 'IV access', 'chest X-ray'],
            harmful: ['blind finger sweep', 'delay intervention', 'Heimlich on infant'],
            neutral: ['CBC', 'discharge planning'],
            vitalEffects: {
              'back blows': { respRate: -5, spo2: 3 },
              'chest thrusts': { respRate: -8, spo2: 5 },
              'laryngoscopy': { respRate: -10, spo2: 8 }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_07_multisystem_trauma',
    category: 'Multisystem Trauma',
    displayName: 'Multisystem Trauma',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 7: Multisystem Trauma',
    variants: [
      {
        variantId: 'A',
        ageBand: 'child',
        ageYears: 10,
        weightKg: 35,
        initialVitals: {
          heartRate: 160,
          respRate: 40,
          bloodPressureSys: 70,
          bloodPressureDia: 45,
          spo2: 88,
          temperature: 97.5,
          consciousness: 'confused',
          capillaryRefill: 4
        },
        stages: [
          {
            stage: 1,
            name: 'Primary Survey & ABCs',
            ordered: true,
            severity: 'critical',
            TTIsec: 30,
            requiredInterventions: ['airway management', 'IV access', 'chest tube if needed'],
            helpful: ['oxygen', 'IV fluids', 'cervical spine immobilization'],
            harmful: ['delay airway', 'missed injuries', 'inadequate resuscitation'],
            neutral: ['CBC', 'chest X-ray', 'discharge planning'],
            vitalEffects: {
              'airway management': { respRate: -8, spo2: 10, consciousness: 1 },
              'IV fluids': { heartRate: -10, bloodPressureSys: 15 },
              'chest tube': { respRate: -5, spo2: 5 }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_08_myocarditis',
    category: 'Myocarditis',
    displayName: 'Myocarditis',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 8: Myocarditis',
    variants: [
      {
        variantId: 'A',
        ageBand: 'adolescent',
        ageYears: 16,
        weightKg: 65,
        initialVitals: {
          heartRate: 140,
          respRate: 30,
          bloodPressureSys: 80,
          bloodPressureDia: 50,
          spo2: 90,
          temperature: 99.2,
          consciousness: 'alert',
          capillaryRefill: 3
        },
        stages: [
          {
            stage: 1,
            name: 'Recognition & ABCs',
            ordered: false,
            severity: 'severe',
            TTIsec: 60,
            requiredInterventions: ['cardiology consult', 'ECG', 'cardiac monitoring'],
            helpful: ['IV fluids', 'oxygen', 'echocardiogram'],
            harmful: ['exercise', 'NSAIDs', 'delay cardiology consult'],
            neutral: ['CBC', 'troponin', 'discharge planning'],
            vitalEffects: {
              'cardiology consult': { heartRate: -5, bloodPressureSys: 3 },
              'IV fluids': { bloodPressureSys: 5 },
              'exercise': { heartRate: 15, bloodPressureSys: -8 }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_09_neonatal_delivery',
    category: 'Neonatal Delivery',
    displayName: 'Neonatal Delivery',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 9: Neonatal Delivery',
    variants: [
      {
        variantId: 'A',
        ageBand: 'neonate',
        ageYears: 0,
        weightKg: 3.2,
        initialVitals: {
          heartRate: 120,
          respRate: 50,
          bloodPressureSys: 60,
          bloodPressureDia: 30,
          spo2: 85,
          temperature: 96.5,
          consciousness: 'irritable',
          capillaryRefill: 3
        },
        stages: [
          {
            stage: 1,
            name: 'Neonatal Resuscitation',
            ordered: true,
            severity: 'moderate',
            TTIsec: 60,
            requiredInterventions: ['warming', 'stimulation', 'oxygen if needed'],
            helpful: ['skin-to-skin', 'breastfeeding support', 'vital monitoring'],
            harmful: ['cold stress', 'delayed feeding', 'inadequate warming'],
            neutral: ['newborn screen', 'discharge planning'],
            vitalEffects: {
              'warming': { temperature: 3, heartRate: 5, consciousness: 1 },
              'stimulation': { respRate: -5, consciousness: 1 },
              'oxygen': { spo2: 8, consciousness: 1 }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_10_non_accidental_trauma',
    category: 'Non-Accidental Trauma',
    displayName: 'Non-Accidental Trauma',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 10: Non-Accidental Trauma',
    variants: [
      {
        variantId: 'A',
        ageBand: 'infant',
        ageYears: 6,
        weightKg: 7,
        initialVitals: {
          heartRate: 150,
          respRate: 35,
          bloodPressureSys: 75,
          bloodPressureDia: 45,
          spo2: 90,
          temperature: 98.6,
          consciousness: 'lethargic',
          capillaryRefill: 4
        },
        stages: [
          {
            stage: 1,
            name: 'Recognition & ABCs',
            ordered: false,
            severity: 'severe',
            TTIsec: 60,
            requiredInterventions: ['child protection consult', 'complete trauma workup', 'documentation'],
            helpful: ['IV access', 'imaging studies', 'forensic evidence collection'],
            harmful: ['discharge without protection plan', 'missed injuries', 'inadequate documentation'],
            neutral: ['CBC', 'discharge planning'],
            vitalEffects: {
              'child protection consult': { consciousness: 1 },
              'complete trauma workup': { consciousness: 1 },
              'documentation': {}
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_11_pea_vf',
    category: 'PEA/VF',
    displayName: 'PEA/VF',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 11: PEA/VF',
    variants: [
      {
        variantId: 'A',
        ageBand: 'child',
        ageYears: 8,
        weightKg: 25,
        initialVitals: {
          heartRate: 0,
          respRate: 0,
          bloodPressureSys: 0,
          bloodPressureDia: 0,
          spo2: 0,
          temperature: 98.6,
          consciousness: 'unresponsive',
          capillaryRefill: 0
        },
        stages: [
          {
            stage: 1,
            name: 'Cardiac Arrest',
            ordered: true,
            severity: 'critical',
            TTIsec: 0,
            requiredInterventions: ['CPR', 'defibrillation', 'epinephrine'],
            helpful: ['advanced airway', 'IV access', 'cardiac monitoring'],
            harmful: ['delay defibrillation', 'inadequate CPR', 'missed reversible causes'],
            neutral: ['documentation', 'family support'],
            vitalEffects: {
              'CPR': { heartRate: 40, respRate: 10, bloodPressureSys: 30, spo2: 20 },
              'defibrillation': { heartRate: 80, consciousness: 1 },
              'epinephrine': { heartRate: 60, bloodPressureSys: 40 }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_12_penetrating_trauma',
    category: 'Penetrating Trauma',
    displayName: 'Penetrating Trauma',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 12: Penetrating Trauma',
    variants: [
      {
        variantId: 'A',
        ageBand: 'adolescent',
        ageYears: 15,
        weightKg: 60,
        initialVitals: {
          heartRate: 140,
          respRate: 35,
          bloodPressureSys: 75,
          bloodPressureDia: 45,
          spo2: 88,
          temperature: 97.8,
          consciousness: 'alert',
          capillaryRefill: 4
        },
        stages: [
          {
            stage: 1,
            name: 'Primary Survey & ABCs',
            ordered: true,
            severity: 'critical',
            TTIsec: 30,
            requiredInterventions: ['airway management', 'IV access', 'surgical consult'],
            helpful: ['oxygen', 'IV fluids', 'imaging studies'],
            harmful: ['remove impaled objects', 'delay surgery', 'inadequate resuscitation'],
            neutral: ['CBC', 'discharge planning'],
            vitalEffects: {
              'airway management': { respRate: -5, spo2: 8, consciousness: 1 },
              'IV fluids': { heartRate: -8, bloodPressureSys: 12 },
              'surgical consult': { consciousness: 1 }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_13_pneumonia_septic_shock',
    category: 'Pneumonia & Septic Shock',
    displayName: 'Pneumonia & Septic Shock',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 13: Pneumonia & Septic Shock',
    variants: [
      {
        variantId: 'A',
        ageBand: 'infant',
        ageYears: 9,
        weightKg: 8.5,
        initialVitals: {
          heartRate: 170,
          respRate: 50,
          bloodPressureSys: 65,
          bloodPressureDia: 40,
          spo2: 82,
          temperature: 103.2,
          consciousness: 'lethargic',
          capillaryRefill: 4
        },
        stages: [
          {
            stage: 1,
            name: 'Recognition & ABCs',
            ordered: false,
            severity: 'critical',
            TTIsec: 30,
            requiredInterventions: ['IV antibiotics', 'IV fluids', 'oxygen'],
            helpful: ['chest X-ray', 'blood cultures', 'fever management'],
            harmful: ['delay antibiotics', 'cold fluids', 'inadequate resuscitation'],
            neutral: ['CBC', 'discharge planning'],
            vitalEffects: {
              'IV antibiotics': { temperature: -2, consciousness: 1 },
              'IV fluids': { heartRate: -10, bloodPressureSys: 15, capillaryRefill: -1 },
              'oxygen': { spo2: 10, consciousness: 1 }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_14_status_asthmaticus',
    category: 'Status Asthmaticus',
    displayName: 'Status Asthmaticus',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 14: Status Asthmaticus',
    variants: [
      {
        variantId: 'A',
        ageBand: 'child',
        ageYears: 7,
        weightKg: 25,
        initialVitals: {
          heartRate: 150,
          respRate: 45,
          bloodPressureSys: 85,
          bloodPressureDia: 55,
          spo2: 88,
          temperature: 98.6,
          consciousness: 'alert',
          capillaryRefill: 3
        },
        stages: [
          {
            stage: 1,
            name: 'Recognition & ABCs',
            ordered: false,
            severity: 'severe',
            TTIsec: 60,
            requiredInterventions: ['nebulized albuterol', 'IV steroids', 'oxygen'],
            helpful: ['magnesium sulfate', 'terbutaline', 'chest X-ray'],
            harmful: ['delay steroids', 'sedation without airway', 'inadequate monitoring'],
            neutral: ['CBC', 'discharge planning'],
            vitalEffects: {
              'nebulized albuterol': { respRate: -8, spo2: 5, heartRate: 5 },
              'IV steroids': { respRate: -5, consciousness: 1 },
              'magnesium sulfate': { respRate: -3, heartRate: -3 }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_15_status_epilepticus',
    category: 'Status Epilepticus',
    displayName: 'Status Epilepticus',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 15: Status Epilepticus',
    variants: [
      {
        variantId: 'A',
        ageBand: 'preschool',
        ageYears: 4,
        weightKg: 18,
        initialVitals: calculateVitals("preschool", "critical"),
        stages: [
          {
            stage: 1,
            name: "First-Line Therapy",
            ordered: true,
            severity: "critical",
            TTIsec: 60,
            requiredInterventions: ["lorazepam IV", "IV access", "glucose check"],
            helpful: ["oxygen", "positioning", "vital monitoring"],
            harmful: ["delay benzodiazepines", "inadequate monitoring", "restraints"],
            neutral: ["CBC", "electrolytes", "CXR"],
            vitalEffects: {
              "lorazepam IV": calculateVitalEffects("lorazepam IV", "critical"),
              "IV access": calculateVitalEffects("default", "critical"),
              "glucose check": calculateVitalEffects("default", "critical"),
              "oxygen": calculateVitalEffects("default", "critical")
            }
          },
          {
            stage: 2,
            name: "Second-Line Therapy",
            ordered: true,
            severity: "severe",
            TTIsec: 300,
            requiredInterventions: ["phenytoin IV", "continuous monitoring"],
            helpful: ["fosphenytoin if available", "EEG if possible"],
            harmful: ["delay second-line", "inadequate monitoring"],
            neutral: ["anticonvulsant levels", "discharge planning"],
            vitalEffects: {
              "phenytoin IV": calculateVitalEffects("phenytoin IV", "severe"),
              "continuous monitoring": calculateVitalEffects("default", "severe"),
              "fosphenytoin if available": calculateVitalEffects("fosphenytoin IV", "severe"),
              "EEG if possible": calculateVitalEffects("default", "severe")
            }
          },
          {
            stage: 3,
            name: "Third-Line & ICU",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: ["ketamine", "intubation preparation"],
            helpful: ["neurology consultation", "ICU transfer"],
            harmful: ["delay third-line", "inadequate preparation"],
            neutral: ["MRI planning", "follow-up scheduling"],
            vitalEffects: {
              "ketamine": calculateVitalEffects("ketamine", "moderate"),
              "intubation preparation": calculateVitalEffects("default", "moderate"),
              "neurology consultation": calculateVitalEffects("default", "moderate")
            }
          }
        ]
      },
      {
        variantId: "B",
        ageBand: "toddler",
        ageYears: 2,
        weightKg: 12,
        initialVitals: calculateVitals("toddler", "critical"),
        stages: [
          {
            stage: 1,
            name: "First-Line Therapy",
            ordered: true,
            severity: "critical",
            TTIsec: 60,
            requiredInterventions: ["midazolam IM", "IV access", "glucose check"],
            helpful: ["oxygen", "positioning", "vital monitoring"],
            harmful: ["delay benzodiazepines", "inadequate monitoring", "restraints"],
            neutral: ["CBC", "electrolytes", "CXR"],
            vitalEffects: {
              "midazolam IM": calculateVitalEffects("midazolam IM", "critical"),
              "IV access": calculateVitalEffects("default", "critical"),
              "glucose check": calculateVitalEffects("default", "critical"),
              "oxygen": calculateVitalEffects("default", "critical")
            }
          },
          {
            stage: 2,
            name: "Second-Line Therapy",
            ordered: true,
            severity: "severe",
            TTIsec: 300,
            requiredInterventions: ["phenytoin IV", "continuous monitoring"],
            helpful: ["fosphenytoin if available", "EEG if possible"],
            harmful: ["delay second-line", "inadequate monitoring"],
            neutral: ["anticonvulsant levels", "discharge planning"],
            vitalEffects: {
              "phenytoin IV": calculateVitalEffects("phenytoin IV", "severe"),
              "continuous monitoring": calculateVitalEffects("default", "severe"),
              "fosphenytoin if available": calculateVitalEffects("fosphenytoin IV", "severe"),
              "EEG if possible": calculateVitalEffects("default", "severe")
            }
          },
          {
            stage: 3,
            name: "Third-Line & ICU",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: ["ketamine", "intubation preparation"],
            helpful: ["neurology consultation", "ICU transfer"],
            harmful: ["delay third-line", "inadequate preparation"],
            neutral: ["MRI planning", "follow-up scheduling"],
            vitalEffects: {
              "ketamine": calculateVitalEffects("ketamine", "moderate"),
              "intubation preparation": calculateVitalEffects("default", "moderate"),
              "neurology consultation": calculateVitalEffects("default", "moderate")
            }
          }
        ]
      },
      {
        variantId: "C",
        ageBand: "preschool",
        ageYears: 4,
        weightKg: 18,
        initialVitals: calculateVitals("preschool", "critical"),
        stages: [
          {
            stage: 1,
            name: "First-Line Therapy",
            ordered: true,
            severity: "critical",
            TTIsec: 60,
            requiredInterventions: ["lorazepam IV", "IV access", "glucose check"],
            helpful: ["oxygen", "positioning", "vital monitoring"],
            harmful: ["delay benzodiazepines", "inadequate monitoring", "restraints"],
            neutral: ["CBC", "electrolytes", "CXR"],
            vitalEffects: {
              "lorazepam IV": calculateVitalEffects("lorazepam IV", "critical"),
              "IV access": calculateVitalEffects("default", "critical"),
              "glucose check": calculateVitalEffects("default", "critical"),
              "oxygen": calculateVitalEffects("default", "critical")
            }
          },
          {
            stage: 2,
            name: "Second-Line Therapy",
            ordered: true,
            severity: "severe",
            TTIsec: 300,
            requiredInterventions: ["phenytoin IV", "continuous monitoring"],
            helpful: ["fosphenytoin if available", "EEG if possible"],
            harmful: ["delay second-line", "inadequate monitoring"],
            neutral: ["anticonvulsant levels", "discharge planning"],
            vitalEffects: {
              "phenytoin IV": calculateVitalEffects("phenytoin IV", "severe"),
              "continuous monitoring": calculateVitalEffects("default", "severe"),
              "fosphenytoin if available": calculateVitalEffects("fosphenytoin IV", "severe"),
              "EEG if possible": calculateVitalEffects("default", "severe")
            }
          },
          {
            stage: 3,
            name: "Third-Line & ICU",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: ["ketamine", "intubation preparation"],
            helpful: ["neurology consultation", "ICU transfer"],
            harmful: ["delay third-line", "inadequate preparation"],
            neutral: ["MRI planning", "follow-up scheduling"],
            vitalEffects: {
              "ketamine": calculateVitalEffects("ketamine", "moderate"),
              "intubation preparation": calculateVitalEffects("default", "moderate"),
              "neurology consultation": calculateVitalEffects("default", "moderate")
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aliem_case_16_svt',
    category: 'SVT',
    displayName: 'Supraventricular Tachycardia',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0',
    sourceCitation: 'ALiEM EM ReSCu Peds – Case 16: SVT',
    variants: [
      {
        variantId: 'A',
        ageBand: 'infant',
        ageYears: 6,
        weightKg: 7,
        initialVitals: {
          heartRate: 220,
          respRate: 50,
          bloodPressureSys: 70,
          bloodPressureDia: 45,
          spo2: 90,
          temperature: 98.6,
          consciousness: 'irritable',
          capillaryRefill: 3
        },
        stages: [
          {
            stage: 1,
            name: 'Recognition & ABCs',
            ordered: true,
            severity: 'severe',
            TTIsec: 60,
            requiredInterventions: ['vagal maneuvers', 'adenosine', 'IV access'],
            helpful: ['oxygen', 'cardiac monitoring', '12-lead ECG'],
            harmful: ['delay adenosine', 'beta-blockers', 'calcium channel blockers'],
            neutral: ['CBC', 'discharge planning'],
            vitalEffects: {
              'vagal maneuvers': { heartRate: -50, consciousness: 1 },
              'adenosine': { heartRate: -100, consciousness: 1 },
              'oxygen': { spo2: 3, consciousness: 1 }
            }
          }
        ]
      }
    ]
  }
];

async function main() {
  console.log('🚀 Starting ALiEM case ingestion...');
  
  // Create data directory if it doesn't exist
  const dataDir = path.join(process.cwd(), '..', 'server', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Write the ALiEM cases to JSON
  const outputPath = path.join(dataDir, 'caseBank.aliem.json');
  fs.writeFileSync(outputPath, JSON.stringify(ALIEM_CASES, null, 2));
  
  console.log(`✅ Successfully wrote ${ALIEM_CASES.length} cases to ${outputPath}`);
  console.log('📊 Case breakdown:');
  ALIEM_CASES.forEach(case_ => {
    console.log(`  - ${case_.displayName}: ${case_.variants.length} variants`);
  });
  
  // Create sources metadata
  const sourcesPath = path.join(process.cwd(), '..', 'meta', 'sources.json');
  const metaDir = path.dirname(sourcesPath);
  if (!fs.existsSync(metaDir)) {
    fs.mkdirSync(metaDir, { recursive: true });
  }
  
  const sources = {
    aliEmRescuPeds: {
      version: 'aliem-rescu-peds-03-29-21',
      license: 'CC BY-NC-SA 4.0',
      source: 'ALiEM EM ReSCu Peds Simulation eBook 03-29-21.pdf',
      description: '16 pediatric emergency medicine simulation cases',
      ingestedAt: new Date().toISOString(),
      caseCount: ALIEM_CASES.length
    }
  };
  
  fs.writeFileSync(sourcesPath, JSON.stringify(sources, null, 2));
  console.log(`✅ Created sources metadata at ${sourcesPath}`);
  
  console.log('\n🎯 Next steps:');
  console.log('1. Complete all 16 ALiEM cases with proper stages and interventions');
  console.log('2. Update server/caseBank.ts to export ALiEM cases');
  console.log('3. Test the new case system in the simulator');
}

// Run the main function if this file is executed directly
main().catch(console.error);

export { ALIEM_CASES, type ALiEMCase, type ALiEMVariant, type ALiEMStage };
