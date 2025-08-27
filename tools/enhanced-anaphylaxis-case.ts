// Enhanced Anaphylaxis Case with Comprehensive Required Interventions
// Based on PALS 2020 Guidelines and ALiEM EM ReSCu Peds

export const ENHANCED_ANAPHYLAXIS_CASE = {
  id: "aliem_case_01_anaphylaxis_enhanced",
  category: "Anaphylaxis",
  displayName: "Anaphylaxis - Enhanced",
  name: "Anaphylaxis - Enhanced",
  description: "Severe anaphylactic reaction in a 6-year-old child with comprehensive management through 4 stages",
  sourceVersion: "aliem-rescu-peds-03-29-21-enhanced",
  license: "CC BY-NC-SA 4.0",
  sourceCitation: "ALiEM EM ReSCu Peds – Case 1: Anaphylaxis (Enhanced with PALS Guidelines)",
  difficulty: "Advanced",
  estimatedTime: "15-20 minutes",
  stages: 4,
  presentingSymptoms: [
    "Facial swelling",
    "Difficulty breathing",
    "Wheezing",
    "Hypotension",
    "Tachycardia",
    "Urticaria",
    "Anxiety",
    "Nausea"
  ],
  clinicalHistory: "6-year-old child with known peanut allergy presents with acute onset of facial swelling, difficulty breathing, and wheezing after accidental peanut exposure at school. Patient has history of previous anaphylactic reactions requiring epinephrine.",
  variants: [
    {
      variantId: "A",
      ageBand: "school",
      ageYears: 6,
      weightKg: 25,
      initialVitals: {
        heartRate: 130,
        respRate: 41,
        bloodPressureSys: 85,
        bloodPressureDia: 50,
        spo2: 93,
        temperature: 38.5,
        consciousness: "lethargic",
        capillaryRefill: 4
      },
      stages: [
        {
          stage: 1,
          name: "Recognition & ABCs",
          ordered: true,
          severity: "severe",
          TTIsec: 60,
          requiredInterventions: [
            "IM epinephrine",
            "IV fluids bolus",
            "diphenhydramine IV",
            "H2 blocker IV",
            "nebulized beta-agonist",
            "steroids IV",
            "CBC",
            "CXR (normal)"
          ],
          helpful: [
            "IV fluids bolus",
            "diphenhydramine IV",
            "H2 blocker IV",
            "nebulized beta-agonist",
            "steroids IV",
            "CBC",
            "CXR (normal)"
          ],
          harmful: [
            "delay epinephrine",
            "epinephrine PO",
            "unnecessary intubation without indications"
          ],
          neutral: [
            "CBC",
            "CXR (normal)"
          ],
          vitalEffects: {
            "IM epinephrine": { heartRate: -19, respRate: -10, bloodPressureSys: 20, spo2: 4 },
            "IV fluids bolus": { bloodPressureSys: 8, bloodPressureDia: 5 },
            "diphenhydramine IV": { heartRate: -5, respRate: -2 },
            "H2 blocker IV": { heartRate: -3, respRate: -1 },
            "nebulized beta-agonist": { respRate: -5, spo2: 2 },
            "steroids IV": { heartRate: -2, respRate: -1 },
            "CBC": { heartRate: 0, consciousness: 0 },
            "CXR (normal)": { heartRate: 0, consciousness: 0 }
          }
        },
        {
          stage: 2,
          name: "Initial Therapy & Monitoring",
          ordered: true,
          severity: "moderate",
          TTIsec: 300,
          requiredInterventions: [
            "IM epinephrine",
            "diphenhydramine IV",
            "H2 blocker IV",
            "nebulized beta-agonist",
            "steroids IV",
            "CBC",
            "CXR (normal)",
            "IV fluids bolus"
          ],
          helpful: [
            "H2 blocker IV",
            "steroids IV",
            "nebulized beta-agonist",
            "IV fluids bolus",
            "diphenhydramine IV"
          ],
          harmful: [
            "delay epinephrine",
            "epinephrine PO",
            "unnecessary intubation without indications"
          ],
          neutral: [
            "CBC",
            "CXR (normal)"
          ],
          vitalEffects: {
            "IM epinephrine": { heartRate: -15, bloodPressureSys: 15, spo2: 3 },
            "diphenhydramine IV": { heartRate: -3, consciousness: 0 },
            "H2 blocker IV": { heartRate: -3, respRate: -1 },
            "nebulized beta-agonist": { respRate: -5, spo2: 2, heartRate: 2 },
            "steroids IV": { heartRate: -2, respRate: -1 },
            "CBC": { heartRate: 0, respRate: 0, consciousness: 0 },
            "CXR (normal)": { heartRate: 0, consciousness: 0 },
            "IV fluids bolus": { bloodPressureSys: 5, consciousness: 0 }
          }
        },
        {
          stage: 3,
          name: "Stabilization & Observation",
          ordered: true,
          severity: "moderate",
          TTIsec: 600,
          requiredInterventions: [
            "IM epinephrine",
            "diphenhydramine IV",
            "H2 blocker IV",
            "nebulized beta-agonist",
            "steroids IV",
            "CBC",
            "CXR (normal)",
            "IV fluids bolus"
          ],
          helpful: [
            "diphenhydramine IV",
            "H2 blocker IV",
            "nebulized beta-agonist",
            "steroids IV",
            "IV fluids bolus"
          ],
          harmful: [
            "delay epinephrine",
            "epinephrine PO",
            "unnecessary intubation without indications"
          ],
          neutral: [
            "CBC",
            "CXR (normal)"
          ],
          vitalEffects: {
            "IM epinephrine": { heartRate: 0, consciousness: 0 },
            "diphenhydramine IV": { heartRate: 0, consciousness: 0 },
            "H2 blocker IV": { heartRate: 0, consciousness: 0 },
            "nebulized beta-agonist": { heartRate: 0, consciousness: 0 },
            "steroids IV": { heartRate: 0, consciousness: 0 },
            "CBC": { heartRate: 0, respRate: 0, consciousness: 0 },
            "CXR (normal)": { heartRate: 0, consciousness: 0 },
            "IV fluids bolus": { bloodPressureSys: 0, consciousness: 0 }
          }
        },
        {
          stage: 4,
          name: "Discharge & Follow-up",
          ordered: true,
          severity: "low",
          TTIsec: 900,
          requiredInterventions: [
            "IM epinephrine",
            "diphenhydramine IV",
            "H2 blocker IV",
            "nebulized beta-agonist",
            "steroids IV",
            "CBC",
            "CXR (normal)",
            "IV fluids bolus"
          ],
          helpful: [
            "diphenhydramine IV",
            "H2 blocker IV",
            "nebulized beta-agonist",
            "steroids IV",
            "IV fluids bolus"
          ],
          harmful: [
            "delay epinephrine",
            "epinephrine PO",
            "unnecessary intubation without indications"
          ],
          neutral: [
            "CBC",
            "CXR (normal)"
          ],
          vitalEffects: {
            "IM epinephrine": { consciousness: 0 },
            "diphenhydramine IV": { consciousness: 0 },
            "H2 blocker IV": { consciousness: 0 },
            "nebulized beta-agonist": { consciousness: 0 },
            "steroids IV": { consciousness: 0 },
            "CBC": { consciousness: 0 },
            "CXR (normal)": { consciousness: 0 },
            "IV fluids bolus": { consciousness: 0 }
          }
        }
      ]
    }
  ]
};

// Export for use in the main ingestion tool
export default ENHANCED_ANAPHYLAXIS_CASE;
