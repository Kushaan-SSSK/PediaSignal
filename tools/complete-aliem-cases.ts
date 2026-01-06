export const COMPLETE_ALIEM_CASES = [
  // 1. Anaphylaxis
  {
    id: "aliem_case_01_anaphylaxis",
    category: "Anaphylaxis",
    displayName: "Anaphylaxis - 6-year-old",
    name: "Anaphylaxis - 6-year-old",
    description: "Severe anaphylactic reaction in a 6-year-old child with comprehensive management through 3 stages",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 1: Anaphylaxis",
    difficulty: "Advanced",
    estimatedTime: "15-20 minutes",
    stages: 3,
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
    clinicalHistory: "A 6-year-old boy brought in by car with a parent presents with difficulty breathing, vomiting, rash, and facial swelling after eating at a restaurant.",
    variants: [
      {
        variantId: "A",
        ageBand: "school",
        ageYears: 6,
        weightKg: 20,
        initialVitals: {
          heartRate: 140,
          respRate: 32,
          bloodPressureSys: 85,
          bloodPressureDia: 50,
          spo2: 91,
          temperature: 37.0,
          consciousness: "anxious",
          capillaryRefill: 3
        },
        stages: [
          {
            stage: 1,
            name: "Recognition & ABCs",
            ordered: true,
            severity: "severe",
            TTIsec: 60,
            requiredInterventions: [
              "Placement in resuscitation",
              "Exam including airway and lung assessment",
              "Placement on cardiovascular monitoring",
              "IM epinephrine given"
            ],
            helpful: ["Oxygen", "IV access"],
            harmful: [
              "delay epinephrine",
              "delay IM epinephrine"
            ],
            neutral: ["CBC", "CXR"],
            vitalEffects: {
              "IM epinephrine given": { heartRate: -20, respRate: -5, bloodPressureSys: 15, spo2: 4 },
              "delay epinephrine": { heartRate: 10, respRate: 5, bloodPressureSys: -10, spo2: -5 }
            }
          },
          {
            stage: 2,
            name: "Stabilization",
            ordered: true,
            severity: "moderate",
            TTIsec: 300,
            requiredInterventions: [
              "Placement of an IV with medications",
              "nebulized albuterol"
            ],
            helpful: [
              "steroids",
              "H2 blocker",
              "diphenhydramine",
              "difficult airway equipment"
            ],
            harmful: ["sedation without airway control"],
            neutral: [],
            vitalEffects: {
              "nebulized albuterol": { respRate: -4, spo2: 2 },
              "IV fluids": { bloodPressureSys: 5 },
              "steroids": {},
              "H2 blocker": {},
              "diphenhydramine": {}
            }
          },
          {
            stage: 3,
            name: "Disposition",
            ordered: true,
            severity: "mild",
            TTIsec: 600,
            requiredInterventions: [
              "Discussion around need for admission",
              "Discussion with family about anaphylaxis/allergic reactions",
              "Outpatient treatment and follow up discussion"
            ],
            helpful: ["Epipen prescription"],
            harmful: ["Early discharge"],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 2. Cardiac Tamponade
  {
    id: "aliem_case_02_cardiac_tamponade",
    category: "Cardiac Tamponade",
    displayName: "Cardiac Tamponade",
    name: "Cardiac Tamponade",
    description: "Pediatric patient in respiratory distress with hypotension, tachycardia, hypoxia, and fever; exam notable for JVD and distant heart sounds.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 2: Cardiac Tamponade",
    difficulty: "Expert",
    estimatedTime: "15-20 minutes",
    stages: 6,
    presentingSymptoms: ["Respiratory distress", "Hypotension", "Tachycardia", "Hypoxia", "Fever"],
    clinicalHistory: "Pediatric patient in respiratory distress with hypotension, tachycardia, hypoxia, and fever; exam notable for JVD and distant heart sounds—concern for pericardial effusion/tamponade.",
    variants: [
      {
        variantId: "A",
        ageBand: "school",
        ageYears: 10,
        weightKg: 30,
        initialVitals: {
          heartRate: 150,
          respRate: 40,
          bloodPressureSys: 80,
          bloodPressureDia: 40,
          spo2: 88,
          temperature: 39.0,
          consciousness: "lethargic",
          capillaryRefill: 4
        },
        stages: [
          {
            stage: 1,
            name: "Initial Resuscitation",
            ordered: true,
            severity: "critical",
            TTIsec: 60,
            requiredInterventions: [
              "Recognize respiratory distress",
              "Obtain complete vital signs",
              "Place on supplemental oxygen",
              "Obtain focused history",
              "Perform focused physical exam",
              "Order two large-bore peripheral IVs",
              "Recognize hypotension",
              "Give 20 mL/kg crystalloid bolus"
            ],
            helpful: [],
            harmful: ["diuretic medication", "Lasix"],
            neutral: [],
            vitalEffects: {
              "Give 20 mL/kg crystalloid bolus": { bloodPressureSys: 10, heartRate: -5 },
              "Lasix": { bloodPressureSys: -10, heartRate: 10 }
            }
          },
          {
            stage: 2,
            name: "Differential & Workup",
            ordered: true,
            severity: "severe",
            TTIsec: 300,
            requiredInterventions: [
              "Recognize abnormal physical exam findings",
              "Formulate a broad, life-threatening differential",
              "Order STAT portable CXR",
              "Order STAT ECG",
              "Order appropriate blood tests",
              "Order a second 20 mL/kg IV fluid bolus"
            ],
            helpful: [],
            harmful: ["fluid restriction"],
            neutral: [],
            vitalEffects: {
              "Order a second 20 mL/kg IV fluid bolus": { bloodPressureSys: 5 },
              "fluid restriction": { bloodPressureSys: -5 }
            }
          },
          {
            stage: 3,
            name: "Diagnostic findings",
            ordered: true,
            severity: "severe",
            TTIsec: 400,
            requiredInterventions: [
              "Identify cardiomegaly on CXR",
              "Recognize low voltage and electrical alternans on ECG",
              "Interpret blood test results correctly"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          },
          {
            stage: 4,
            name: "Ultrasound",
            ordered: true,
            severity: "severe",
            TTIsec: 500,
            requiredInterventions: [
              "Perform bedside point-of-care ultrasound (heart/IVC)",
              "Recognize large pericardial effusion",
              "Recognize sonographic signs of tamponade"
            ],
            helpful: [],
            harmful: ["delay ultrasound"],
            neutral: [],
            vitalEffects: {}
          },
          {
            stage: 5,
            name: "Pericardiocentesis",
            ordered: true,
            severity: "critical",
            TTIsec: 600,
            requiredInterventions: [
              "Recognize need for emergent pericardiocentesis",
              "Perform bedside pericardiocentesis under ultrasound guidance",
              "Call interventional cardiology / CT surgery"
            ],
            helpful: [],
            harmful: ["delay procedure"],
            neutral: [],
            vitalEffects: {
              "Perform bedside pericardiocentesis under ultrasound guidance": { heartRate: -40, respRate: -15, bloodPressureSys: 30, spo2: 10 }
            }
          },
          {
            stage: 6,
            name: "Disposition",
            ordered: true,
            severity: "moderate",
            TTIsec: 900,
            requiredInterventions: [
              "Discuss with pediatric intensivist",
              "Transfer patient to the PICU",
              "Update the family and provide handoff"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 3. Adrenal Crisis
  {
    id: "aliem_case_03_adrenal_crisis",
    category: "Adrenal Crisis",
    displayName: "Adrenal Crisis (Hypoglycemia)",
    name: "Adrenal Crisis (Hypoglycemia)",
    description: "Pediatric patient in shock with hypoglycemia; concern for adrenal crisis.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 3: Adrenal Crisis",
    difficulty: "Advanced",
    estimatedTime: "10-15 minutes",
    stages: 3,
    presentingSymptoms: ["Shock", "Hypoglycemia", "Lethargy"],
    clinicalHistory: "Pediatric patient in shock with hypoglycemia; concern for adrenal crisis requiring stress-dose steroids after initial dextrose and stabilization.",
    variants: [
      {
        variantId: "A",
        ageBand: "toddler",
        ageYears: 3,
        weightKg: 15,
        initialVitals: {
          heartRate: 160,
          respRate: 35,
          bloodPressureSys: 65,
          bloodPressureDia: 35,
          spo2: 94,
          temperature: 37.0,
          bloodGlucose: 35,
          consciousness: "unresponsive",
          capillaryRefill: 5
        },
        stages: [
          {
            stage: 1,
            name: "Resuscitation & Hypoglycemia",
            ordered: true,
            severity: "critical",
            TTIsec: 60,
            requiredInterventions: [
              "Team leader assigns tasks",
              "Obtain brief history from parent",
              "Perform focused physical exam (ABCs)",
              "Place patient on continuous cardiac monitor",
              "Verbalize recognition of shock",
              "Obtain point-of-care glucose",
              "Obtain vascular access",
              "Verbalize recognition of hypoglycemia",
              "Administer D10W 5 mL/kg",
              "Administer normal saline bolus 10–20 mL/kg",
              "Administer antibiotics",
              "Discuss progress and plan with parent"
            ],
            helpful: ["D25W 2 mL/kg"],
            harmful: ["delay glucose"],
            neutral: [],
            vitalEffects: {
              "Administer D10W 5 mL/kg": { consciousness: 1, heartRate: -10 },
              "Administer normal saline bolus 10–20 mL/kg": { bloodPressureSys: 10 }
            }
          },
          {
            stage: 2,
            name: "Steroids",
            ordered: true,
            severity: "severe",
            TTIsec: 300,
            requiredInterventions: [
              "Verbalize recognition of adrenal crisis",
              "Administer hydrocortisone 2 mg/kg IV bolus"
            ],
            helpful: [],
            harmful: ["Thyroid hormone", "levothyroxine", "steroids before dextrose"],
            vitalEffects: {
              "Administer hydrocortisone 2 mg/kg IV bolus": { bloodPressureSys: 15, heartRate: -10 },
              "levothyroxine": { heartRate: 20 }
            }
          },
          {
            stage: 3,
            name: "Disposition",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: [
              "Explain diagnosis to parent and how it relates to presentation",
              "Notify admission team (sign-out/transfer)"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 4. Ductal-Dependent Congenital Heart Lesion
  {
    id: "aliem_case_04_ductal_dependent",
    category: "Congenital Heart Lesion",
    displayName: "Ductal-Dependent Congenital Heart Lesion",
    name: "Ductal-Dependent Congenital Heart Lesion",
    description: "Infant with suspected ductal-dependent congenital heart disease.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 4",
    difficulty: "Expert",
    estimatedTime: "10-15 minutes",
    stages: 4,
    presentingSymptoms: ["Cyanosis", "Poor perfusion", "Shock", "Respiratory distress"],
    clinicalHistory: "Infant with suspected ductal-dependent congenital heart disease; stabilize with ABCs/oxygen/IV access and labs, then initiate PGE1 and coordinate definitive care with cardiology and NICU/CICU.",
    variants: [
      {
        variantId: "A",
        ageBand: "neonate",
        ageYears: 0.1,
        weightKg: 3.5,
        initialVitals: {
          heartRate: 170,
          respRate: 70,
          bloodPressureSys: 55,
          bloodPressureDia: 35,
          spo2: 75,
          temperature: 36.5,
          consciousness: "lethargic",
          capillaryRefill: 4
        },
        stages: [
          {
            stage: 1,
            name: "Initial Stabilization",
            ordered: true,
            severity: "critical",
            TTIsec: 60,
            requiredInterventions: [
              "Assess ABCs",
              "Obtain vital signs",
              "Obtain IV access",
              "Place on oxygen",
              "Ask for POC glucose and labs"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Place on oxygen": { spo2: 5 }
            }
          },
          {
            stage: 2,
            name: "Workup",
            ordered: true,
            severity: "critical",
            TTIsec: 300,
            requiredInterventions: [
              "Attach ECG monitors",
              "Interpret POC labs",
              "Order normal saline bolus",
              "Order antibiotics",
              "Order chest X-ray"
            ],
            helpful: [],
            harmful: ["too much fluid"],
            neutral: [],
            vitalEffects: {
              "Order normal saline bolus": { bloodPressureSys: 5 },
              "too much fluid": { respRate: 20, spo2: -10, notes: "Acute heart failure" }
            }
          },
          {
            stage: 3,
            name: "PGE1",
            ordered: true,
            severity: "critical",
            TTIsec: 450,
            requiredInterventions: [
              "Order prostaglandin (PGE1)",
              "Request a STAT cardiology consult",
              "Repeat NS IV bolus"
            ],
            helpful: [],
            harmful: ["delay PGE1"],
            neutral: [],
            vitalEffects: {
              "Order prostaglandin (PGE1)": { spo2: 15, bloodPressureSys: 10, heartRate: -20 }
            }
          },
          {
            stage: 4,
            name: "Disposition",
            ordered: true,
            severity: "severe",
            TTIsec: 600,
            requiredInterventions: [
              "Discuss patient with NICU and state appropriate disposition"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 5. Diabetic Ketoacidosis
  {
    id: "aliem_case_05_dka",
    category: "DKA",
    displayName: "Diabetic Ketoacidosis",
    name: "Diabetic Ketoacidosis",
    description: "Pediatric patient with hyperglycemia and suspected DKA.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 5",
    difficulty: "Advanced",
    estimatedTime: "20 minutes",
    stages: 3,
    presentingSymptoms: ["Vomiting", "Abdominal pain", "Polyuria", "Polydipsia", "Altered mental status"],
    clinicalHistory: "Pediatric patient with hyperglycemia and suspected DKA; initial stabilization focuses on ABCs, monitoring, vascular access, labs, and recognition/treatment of hypokalemia, followed by fluid resuscitation, insulin infusion (after fluids), potassium repletion, frequent reassessment, and ICU/Endocrine involvement.",
    variants: [
      {
        variantId: "A",
        ageBand: "adolescent",
        ageYears: 13,
        weightKg: 50,
        initialVitals: {
          heartRate: 130,
          respRate: 30,
          bloodPressureSys: 100,
          bloodPressureDia: 60,
          spo2: 98,
          temperature: 37.0,
          bloodGlucose: 500,
          consciousness: "confused",
          capillaryRefill: 3
        },
        stages: [
          {
            stage: 1,
            name: "Recognition & Initial Workup",
            ordered: true,
            severity: "severe",
            TTIsec: 60,
            requiredInterventions: [
              "Team leader assigns tasks",
              "Obtain brief history from parent",
              "Perform primary survey",
              "Place on continuous cardiac monitor",
              "Perform focused physical exam",
              "Verbalize recognition of shock",
              "Obtain point-of-care glucose (high)",
              "Obtain vascular access",
              "Verbalize recognition of hyperglycemia",
              "Obtain point-of-care VBG/CBG and electrolytes",
              "Identify hypokalemia on POC testing or via ECG changes",
              "Discuss progress/plan with family"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          },
          {
            stage: 2,
            name: "Fluid & Insulin Management",
            ordered: true,
            severity: "severe",
            TTIsec: 300,
            requiredInterventions: [
              "Verbalize recognition of DKA complicated by hypokalemia",
              "Administer 10 mL/kg normal saline for moderate dehydration",
              "Reassess perfusion status after bolus",
              "Reassess mental status after bolus",
              "Reassess glucose after bolus",
              "Begin IV insulin after saline bolus (0.05–0.1 units/kg/hour)",
              "Begin IV potassium for K < 3.5 mEq/L"
            ],
            helpful: [],
            harmful: ["Too much fluid", "Insulin bolus"],
            vitalEffects: {
              "Administer 10 mL/kg normal saline for moderate dehydration": { heartRate: -10, bloodPressureSys: 5 },
              "Begin IV insulin after saline bolus (0.05–0.1 units/kg/hour)": { bloodGlucose: -50 },
              "Too much fluid": { consciousness: -2, notes: "Cerebral edema risk" }
            }
          },
          {
            stage: 3,
            name: "Disposition & Monitoring",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: [
              "Verbalize need for repeat neuro checks for cerebral edema evaluation",
              "Verbalize need for q2h electrolyte/glucose monitoring",
              "Order STAT VBG + electrolytes if worse in any way",
              "Explain diagnosis to parent and how it relates to presentation",
              "Consult PICU and/or Endocrine for admission"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 6. Foreign Body Aspiration
  {
    id: "aliem_case_06_fb_aspiration",
    category: "Foreign Body Aspiration",
    displayName: "Foreign Body Aspiration",
    name: "Foreign Body Aspiration",
    description: "Pediatric patient with stridor and impending airway compromise.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 6",
    difficulty: "Expert",
    estimatedTime: "10-15 minutes",
    stages: 5,
    presentingSymptoms: ["Stridor", "Respiratory distress", "Coughing"],
    clinicalHistory: "Pediatric patient with stridor and impending airway compromise; rapid primary survey and monitoring with escalation from intubation attempt to needle cricothyroidotomy and specialty consultation.",
    variants: [
      {
        variantId: "A",
        ageBand: "toddler",
        ageYears: 2,
        weightKg: 12,
        initialVitals: {
          heartRate: 150,
          respRate: 40,
          bloodPressureSys: 90,
          bloodPressureDia: 60,
          spo2: 92,
          temperature: 37.0,
          consciousness: "anxious",
          capillaryRefill: 2
        },
        stages: [
          {
            stage: 1,
            name: "Initial Assessment",
            ordered: true,
            severity: "severe",
            TTIsec: 60,
            requiredInterventions: [
              "Team leader assigns tasks",
              "Obtain relevant history from parent",
              "Perform primary survey",
              "Place patient on continuous cardiac monitor",
              "Perform focused physical exam",
              "Recognize stridor"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          },
          {
            stage: 2,
            name: "Airway Decision",
            ordered: true,
            severity: "critical",
            TTIsec: 120,
            requiredInterventions: [
              "Recognize airway difficulty and need for intubation",
              "Establish vascular access"
            ],
            helpful: [],
            harmful: ["delay intubation preparation"],
            neutral: [],
            vitalEffects: {}
          },
          {
            stage: 3,
            name: "Intubation Attempt",
            ordered: true,
            severity: "critical",
            TTIsec: 180,
            requiredInterventions: [
              "Intubation must be attempted",
              "Verbalize unsuccessful intubation"
            ],
            helpful: [],
            harmful: ["Multiple intubation attempts"],
            neutral: [],
            vitalEffects: {
              "Intubation must be attempted": { spo2: -10, heartRate: -20, notes: "Cannot pass tube" }
            }
          },
          {
            stage: 4,
            name: "Surgical Airway",
            ordered: true,
            severity: "critical",
            TTIsec: 240,
            requiredInterventions: [
              "Perform needle cricothyroidotomy"
            ],
            helpful: [],
            harmful: ["delay cricothyroidotomy"],
            neutral: [],
            vitalEffects: {
              "Perform needle cricothyroidotomy": { spo2: 15, heartRate: 20 }
            }
          },
          {
            stage: 5,
            name: "Consultation",
            ordered: true,
            severity: "severe",
            TTIsec: 300,
            requiredInterventions: [
              "Surgical, ENT, or pulmonary consultation"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 7. Multisystem Trauma
  {
    id: "aliem_case_07_multisystem_trauma",
    category: "Multisystem Trauma",
    displayName: "Multisystem Trauma",
    name: "Multisystem Trauma",
    description: "Pediatric patient with multisystem trauma requiring rapid primary survey and resuscitation.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 7",
    difficulty: "Expert",
    estimatedTime: "15-20 minutes",
    stages: 4,
    presentingSymptoms: ["Trauma", "Hypotension", "Tachycardia", "Altered mental status"],
    clinicalHistory: "Pediatric patient with multisystem trauma requiring rapid primary survey, early airway/ventilation support, fluid resuscitation, and preparation for transfer; subsequent secondary survey, fracture stabilization, ICP management, and definitively disposition to a trauma center.",
    variants: [
      {
        variantId: "A",
        ageBand: "school",
        ageYears: 8,
        weightKg: 28,
        initialVitals: {
          heartRate: 145,
          respRate: 35,
          bloodPressureSys: 80,
          bloodPressureDia: 40,
          spo2: 94,
          temperature: 36.5,
          consciousness: "unresponsive",
          capillaryRefill: 4
        },
        stages: [
          {
            stage: 1,
            name: "Primary Survey & Resuscitation",
            ordered: true,
            severity: "critical",
            TTIsec: 60,
            requiredInterventions: [
              "Team leader assigns tasks and uses Broselow/weight reference",
              "Obtain history from parent",
              "Perform primary survey",
              "Perform BMV",
              "Place patient on continuous cardiac monitor",
              "Order vascular access at two sites",
              "Obtain point-of-care glucose",
              "Place cervical collar",
              "Give two IV fluid boluses",
              "Perform rapid sequence intubation (RSI)",
              "Discuss progress and plan of care with the parent"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Perform BMV": { spo2: 4 },
              "Give two IV fluid boluses": { bloodPressureSys: 15, heartRate: -10 }
            }
          },
          {
            stage: 2,
            name: "Before Transfer",
            ordered: true,
            severity: "critical",
            TTIsec: 300,
            requiredInterventions: [
              "Perform RSI if not already performed",
              "Arrange transfer to trauma center with handoff to trauma physician",
              "Splint tibia-fibula fracture prior to transfer"
            ],
            helpful: [],
            harmful: ["skip splinting"],
            neutral: [],
            vitalEffects: {
              "skip splinting": { heartRate: 20, bloodPressureSys: -10, notes: "Worsening vital signs due to pain/blood loss" }
            }
          },
          {
            stage: 3,
            name: "ICP Management",
            ordered: true,
            severity: "critical",
            TTIsec: 450,
            requiredInterventions: [
              "Elevate head of bed",
              "State need to hyperventilate to pCO₂ 30–35 mmHg and order a blood gas",
              "Administer mannitol or hypertonic saline"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Administer mannitol or hypertonic saline": { consciousness: 1 }
            }
          },
          {
            stage: 4,
            name: "Handoff",
            ordered: true,
            severity: "severe",
            TTIsec: 600,
            requiredInterventions: [
              "Reassess patient and prepare for transfer",
              "Provide handoff communication to accepting trauma physician"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 8. Myocarditis
  {
    id: "aliem_case_08_myocarditis",
    category: "Myocarditis",
    displayName: "Myocarditis",
    name: "Myocarditis",
    description: "Pediatric patient with suspected myocarditis presenting in compensated cardiogenic shock.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 8",
    difficulty: "Advanced",
    estimatedTime: "15 minutes",
    stages: 4,
    presentingSymptoms: ["Respiratory distress", "Crackles", "Hepatomegaly", "Tachycardia"],
    clinicalHistory: "Pediatric patient with suspected myocarditis presenting in compensated cardiogenic shock that may decompensate; workup with ECG/CXR/labs, early vasoactive support, possible VT with pulses requiring synchronized cardioversion, and PICU admission with cardiology involvement.",
    variants: [
      {
        variantId: "A",
        ageBand: "adolescent",
        ageYears: 15,
        weightKg: 60,
        initialVitals: {
          heartRate: 150,
          respRate: 35,
          bloodPressureSys: 95,
          bloodPressureDia: 60,
          spo2: 90,
          temperature: 37.0,
          consciousness: "lethargic",
          capillaryRefill: 3
        },
        stages: [
          {
            stage: 1,
            name: "Initial Recognition",
            ordered: true,
            severity: "severe",
            TTIsec: 60,
            requiredInterventions: [
              "Team leader identifies patient is high acuity",
              "Obtain history from parent",
              "Perform primary survey",
              "Administer supplemental oxygen",
              "Place patient on continuous cardiac monitor",
              "Obtain vascular access",
              "Perform focused physical exam and recognize right-sided crackles",
              "Order diagnostic tests (ECG, CXR, labs)",
              "Verbalize recognition of compensated shock",
              "Discuss progress and plan of care with the parent"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          },
          {
            stage: 2,
            name: "Shock Management",
            ordered: true,
            severity: "critical",
            TTIsec: 300,
            requiredInterventions: [
              "Verbalize recognition of cardiogenic shock",
              "Perform bedside cardiac ultrasound",
              "Start pressor/inotropic agent (epinephrine, dobutamine, norepinephrine, milrinone)"
            ],
            helpful: [],
            harmful: ["excessive fluid"],
            neutral: [],
            vitalEffects: {
              "excessive fluid": { spo2: -10, bloodPressureSys: -10, notes: "Worsens if >10cc/kg given" },
              "Start pressor/inotropic agent (epinephrine, dobutamine, norepinephrine, milrinone)": { bloodPressureSys: 10, heartRate: 5 }
            }
          },
          {
            stage: 3,
            name: "Arrhythmia Management",
            ordered: true,
            severity: "critical",
            TTIsec: 450,
            requiredInterventions: [
              "Place defibrillator pads on patient",
              "Perform synchronized cardioversion (for ventricular tachycardia with pulses)"
            ],
            helpful: [],
            harmful: ["defibrillation (unsynchronized)"],
            neutral: [],
            vitalEffects: {
              "defibrillation (unsynchronized)": { heartRate: 0, notes: "R-on-T phenomenon risk" },
              "Perform synchronized cardioversion (for ventricular tachycardia with pulses)": { heartRate: -50, bloodPressureSys: 10 }
            }
          },
          {
            stage: 4,
            name: "Disposition",
            ordered: true,
            severity: "severe",
            TTIsec: 600,
            requiredInterventions: [
              "Verbalize concern for myocarditis",
              "Consult pediatric cardiology",
              "Transfer care of the patient to the pediatric ICU",
              "Address parental concerns and questions"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 9. Neonatal Delivery
  {
    id: "aliem_case_09_neonatal_delivery",
    category: "Neonatal Delivery",
    displayName: "Neonatal Delivery",
    name: "Neonatal Delivery",
    description: "Newborn requiring NRP-guided resuscitation.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 9",
    difficulty: "Advanced",
    estimatedTime: "10 minutes",
    stages: 4,
    presentingSymptoms: ["Apnea", "Bradycardia", "Poor tone", "Blue"],
    clinicalHistory: "Newborn requiring NRP-guided resuscitation with PPV by 60 seconds, transition to CPAP, hypothermia prevention, UVC access after failed PIVs, correction of hypoglycemia, and antibiotics.",
    variants: [
      {
        variantId: "A",
        ageBand: "neonate",
        ageYears: 0,
        weightKg: 3.0,
        initialVitals: {
          heartRate: 80,
          respRate: 10,
          bloodPressureSys: 50,
          bloodPressureDia: 30,
          spo2: 60,
          temperature: 36.5,
          consciousness: "unresponsive",
          capillaryRefill: 5
        },
        stages: [
          {
            stage: 1,
            name: "Initial Steps & PPV",
            ordered: true,
            severity: "critical",
            TTIsec: 60,
            requiredInterventions: [
              "Call for OB/Peds/NICU help",
              "Assemble supplies",
              "Assign team roles",
              "Acknowledge and follow the NRP algorithm",
              "By 60 seconds of life start PPV"
            ],
            helpful: [],
            harmful: ["delay PPV"],
            neutral: [],
            vitalEffects: {
              "By 60 seconds of life start PPV": { heartRate: 40, spo2: 15 }
            }
          },
          {
            stage: 2,
            name: "MR SOPA & CPAP",
            ordered: true,
            severity: "critical",
            TTIsec: 120,
            requiredInterventions: [
              "Continue NRP algorithm",
              "Continue PPV with MR SOPA maneuvers",
              "Note hypothermia and provide warming",
              "Reassess respiratory effort after HR/SpO₂ improve with PPV",
              "Recognize ongoing ventilatory needs",
              "Initiate CPAP and request neonatal CPAP setup"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Initiate CPAP and request neonatal CPAP setup": { spo2: 10, respRate: 30 }
            }
          },
          {
            stage: 3,
            name: "UVC & Labs",
            ordered: true,
            severity: "critical",
            TTIsec: 300,
            requiredInterventions: [
              "Continue CPAP and wean FiO₂",
              "Place emergency UVC after two failed PIV attempts",
              "Obtain POC labs and chest x-ray",
              "Recognize hypoglycemia at 30 mg/dL (<40)",
              "Give D10W bolus 2 mL/kg via UVC",
              "Start D10W at 60 mL/kg/24 h",
              "Order antibiotics (ampicillin and gentamicin)",
              "Call NICU and discuss the case"
            ],
            helpful: [],
            harmful: ["unrecognized hypoglycemia"],
            neutral: [],
            vitalEffects: {
              "Give D10W bolus 2 mL/kg via UVC": { bloodGlucose: 40, consciousness: 1 },
              "unrecognized hypoglycemia": { heartRate: -60, notes: "Cardiac Arrest Risk" }
            }
          },
          {
            stage: 4,
            name: "Disposition",
            ordered: true,
            severity: "severe",
            TTIsec: 450,
            requiredInterventions: [
              "Discuss patient with NICU and state appropriate disposition"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 10. Non-Accidental Trauma
  {
    id: "aliem_case_10_nat",
    category: "Non-Accidental Trauma",
    displayName: "Non-Accidental Trauma",
    name: "Non-Accidental Trauma",
    description: "Infant with altered mental status and seizure.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 10",
    difficulty: "Advanced",
    estimatedTime: "15 minutes",
    stages: 4,
    presentingSymptoms: ["Altered mental status", "Seizure"],
    clinicalHistory: "Infant with altered mental status; initial stabilization with oxygen, monitoring, and vascular access; broad labs; seizure and respiratory failure requiring RSI; post-intubation CXR shows posterior rib fractures; proceed to head CT, trauma/neurosurgery consults, ICP precautions, and mandated reporting.",
    variants: [
      {
        variantId: "A",
        ageBand: "infant",
        ageYears: 0.5,
        weightKg: 7,
        initialVitals: {
          heartRate: 160,
          respRate: 45,
          bloodPressureSys: 85,
          bloodPressureDia: 50,
          spo2: 94,
          temperature: 37.0,
          consciousness: "unresponsive",
          capillaryRefill: 2
        },
        stages: [
          {
            stage: 1,
            name: "Initial Stabilization",
            ordered: true,
            severity: "critical",
            TTIsec: 60,
            requiredInterventions: [
              "Team leader assigns tasks",
              "Obtain history from parent",
              "Perform primary survey",
              "Administer supplemental oxygen",
              "Place patient on continuous cardiac monitor",
              "Obtain IO access after failed IV",
              "Send labs once access obtained",
              "Discuss progress and plan with the parent"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          },
          {
            stage: 2,
            name: "Seizure & RSI",
            ordered: true,
            severity: "critical",
            TTIsec: 300,
            requiredInterventions: [
              "Demonstrate appropriate BMV technique",
              "Perform endotracheal intubation with appropriate RSI meds",
              "Manage seizure (benzodiazepine)",
              "Request and correctly interpret CXR"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Manage seizure (benzodiazepine)": { heartRate: -20, respRate: -10 }
            }
          },
          {
            stage: 3,
            name: "CT and Consults",
            ordered: true,
            severity: "severe",
            TTIsec: 450,
            requiredInterventions: [
              "Obtain CT head",
              "Consult trauma surgery and neurosurgery",
              "Take ICP precautions and consider cervical spine immobilization"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          },
          {
            stage: 4,
            name: "Reporting",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: [
              "Identify child abuse as likely etiology",
              "Request social work and ophthalmology consults and skeletal survey",
              "Discuss with parent why abuse is suspected and standard care/policy",
              "Initiate phone call to CPS"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 11. PEA -> VF
  {
    id: "aliem_case_11_pea_vf",
    category: "Cardiac Arrest",
    displayName: "PEA to VF",
    name: "PEA to VF",
    description: "Pediatric cardiac arrest initially in PEA evolving to VF.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 11",
    difficulty: "Critical",
    estimatedTime: "10-15 minutes",
    stages: 4,
    presentingSymptoms: ["Cardiac arrest", "Unresponsive", "No pulse"],
    clinicalHistory: "Pediatric cardiac arrest initially in PEA; immediate high-quality CPR/BMV, rapid IV/IO access, early epinephrine; rhythm evolves to VF requiring prompt defibrillation; post-ROSC stabilization.",
    variants: [
      {
        variantId: "A",
        ageBand: "child",
        ageYears: 5,
        weightKg: 20,
        initialVitals: {
          heartRate: 0,
          respRate: 0,
          bloodPressureSys: 0,
          bloodPressureDia: 0,
          spo2: 0,
          temperature: 36.0,
          consciousness: "unresponsive",
          capillaryRefill: 99
        },
        stages: [
          {
            stage: 1,
            name: "PEA Management",
            ordered: true,
            severity: "critical",
            TTIsec: 60,
            requiredInterventions: [
              "Team leader declares leadership",
              "Check for a pulse and recognize pulselessness",
              "Continue high-quality CPR with effective BMV",
              "Place patient on continuous cardiac monitor",
              "Apply defibrillator pads",
              "Obtain IV/IO access",
              "Estimate weight with length-based tape",
              "Verbalize recognition of PEA"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          },
          {
            stage: 2,
            name: "Epinephrine and Causes",
            ordered: true,
            severity: "critical",
            TTIsec: 180,
            requiredInterventions: [
              "Follow PALS algorithm for PEA",
              "Give epinephrine 0.01 mg/kg IV/IO",
              "Discuss and treat reversible causes (Hs and Ts)",
              "Verbalize rhythm change to VF"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          },
          {
            stage: 3,
            name: "VF Management",
            ordered: true,
            severity: "critical",
            TTIsec: 240,
            requiredInterventions: [
              "Continue BMV and CPR",
              "Defer intubation now—attempt immediate defibrillation",
              "Follow PALS VF algorithm and defibrillate (2–10 J/kg)",
              "Resume CPR immediately after each shock",
              "Recognize return of normal sinus rhythm (NSR)"
            ],
            helpful: [],
            harmful: ["intubation before defibrillation"],
            neutral: [],
            vitalEffects: {
              "Recognize return of normal sinus rhythm (NSR)": { heartRate: 110, bloodPressureSys: 80, spo2: 95 }
            }
          },
          {
            stage: 4,
            name: "Post-ROSC",
            ordered: true,
            severity: "critical",
            TTIsec: 360,
            requiredInterventions: [
              "Recognize ROSC and stabilize",
              "Titrate oxygen to SpO₂ 94–99%",
              "Order blood gas/electrolytes/calcium",
              "Update family",
              "Plan disposition (admit vs transfer)"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 12. Penetrating Trauma
  {
    id: "aliem_case_12_penetrating_trauma",
    category: "Penetrating Trauma",
    displayName: "Penetrating Trauma",
    name: "Penetrating Trauma",
    description: "Pediatric patient with penetrating trauma.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 12",
    difficulty: "Expert",
    estimatedTime: "15 minutes",
    stages: 3,
    presentingSymptoms: ["Trauma", "Respiratory distress", "Shock"],
    clinicalHistory: "Pediatric patient with penetrating trauma requiring rapid primary survey, recognition and decompression of tension pneumothorax, definitive airway, chest tube, hemorrhage control with MTP, and surgical disposition.",
    variants: [
      {
        variantId: "A",
        ageBand: "adolescent",
        ageYears: 14,
        weightKg: 50,
        initialVitals: {
          heartRate: 140,
          respRate: 30,
          bloodPressureSys: 80,
          bloodPressureDia: 40,
          spo2: 85,
          temperature: 36.5,
          consciousness: "confused",
          capillaryRefill: 3
        },
        stages: [
          {
            stage: 1,
            name: "Primary Survey & Tension Pneumothorax",
            ordered: true,
            severity: "critical",
            TTIsec: 60,
            requiredInterventions: [
              "Team lead assigns roles",
              "Place patient on monitor and obtain full set of vital signs",
              "Obtain vascular access and order labs",
              "Perform primary survey",
              "Identify tension pneumothorax",
              "Perform needle decompression",
              "Manage pediatric airway",
              "Initiate volume resuscitation (blood or saline)"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Perform needle decompression": { spo2: 10, respRate: -5, bloodPressureSys: 10 }
            }
          },
          {
            stage: 2,
            name: "Chest Tube & MTP",
            ordered: true,
            severity: "critical",
            TTIsec: 300,
            requiredInterventions: [
              "Complete secondary survey",
              "Perform chest tube placement",
              "Reassess volume resuscitation and initiate Massive Transfusion Protocol",
              "Call pediatric trauma for disposition",
              "Perform FAST exam and identify intra-abdominal hemorrhage"
            ],
            helpful: ["TXA"],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Reassess volume resuscitation and initiate Massive Transfusion Protocol": { bloodPressureSys: 15, heartRate: -10 }
            }
          },
          {
            stage: 3,
            name: "Disposition",
            ordered: true,
            severity: "severe",
            TTIsec: 600,
            requiredInterventions: [
              "Consult pediatric trauma surgery",
              "Activate appropriate level trauma",
              "Communicate effectively and compassionately with parents"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 13. Pneumonia & Septic Shock (Tracheostomy)
  {
    id: "aliem_case_13_pneumonia_sepsis",
    category: "Sepsis",
    displayName: "Pneumonia & Septic Shock (Trach)",
    name: "Pneumonia & Septic Shock (Trach)",
    description: "Tracheostomized pediatric patient in respiratory distress with suspected pneumonia and septic shock.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 13",
    difficulty: "Advanced",
    estimatedTime: "10-15 minutes",
    stages: 3,
    presentingSymptoms: ["Respiratory distress", "Fever", "Tachycardia", "Hypotension"],
    clinicalHistory: "Tracheostomized pediatric patient in respiratory distress with suspected pneumonia and septic shock; requires rapid trach troubleshooting/replacement, oxygenation/ventilation support, fluid resuscitation, antibiotics, and PICU transfer.",
    variants: [
      {
        variantId: "A",
        ageBand: "child",
        ageYears: 5,
        weightKg: 18,
        initialVitals: {
          heartRate: 160,
          respRate: 40,
          bloodPressureSys: 70,
          bloodPressureDia: 40,
          spo2: 88,
          temperature: 39.5,
          consciousness: "lethargic",
          capillaryRefill: 4
        },
        stages: [
          {
            stage: 1,
            name: "Trach Management & ABCs",
            ordered: true,
            severity: "critical",
            TTIsec: 60,
            requiredInterventions: [
              "Team leader assigns tasks",
              "Obtain relevant history from parent",
              "Perform primary survey",
              "Provide supplemental oxygen",
              "Perform BMV through tracheostomy",
              "Suction tracheostomy tube",
              "Replace tracheostomy tube",
              "Place patient on continuous cardiac monitor",
              "Establish vascular access",
              "Obtain point-of-care rapid glucose level"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Replace tracheostomy tube": { spo2: 8 }
            }
          },
          {
            stage: 2,
            name: "Sepsis Management",
            ordered: true,
            severity: "severe",
            TTIsec: 300,
            requiredInterventions: [
              "Recognize and promptly manage shock and pneumonia with IV fluids and antibiotics",
              "Discuss progress and develop plan of care with the parent"
            ],
            helpful: ["RUSH POCUS"],
            harmful: ["delay antibiotics", "delay fluids"],
            neutral: [],
            vitalEffects: {
              "delay antibiotics": { bloodPressureSys: -5, heartRate: 5 },
              "IV fluids": { bloodPressureSys: 10, heartRate: -5 }
            }
          },
          {
            stage: 3,
            name: "Disposition",
            ordered: true,
            severity: "severe",
            TTIsec: 600,
            requiredInterventions: [
              "Plan transfer to pediatric ICU",
              "Ensure family is updated on plan"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 14. Status Asthmaticus
  {
    id: "aliem_case_14_status_asthmaticus",
    category: "Asthma",
    displayName: "Status Asthmaticus",
    name: "Status Asthmaticus",
    description: "Pediatric patient with severe asthma exacerbation.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 14",
    difficulty: "Severe",
    estimatedTime: "15 minutes",
    stages: 4,
    presentingSymptoms: ["Wheezing", "Respiratory distress", "Hypoxia"],
    clinicalHistory: "Pediatric patient with severe asthma exacerbation; rapid team huddle, immediate bronchodilators + steroids, escalation to second-line therapies with NIV, vigilance for pneumothorax.",
    variants: [
      {
        variantId: "A",
        ageBand: "school",
        ageYears: 9,
        weightKg: 30,
        initialVitals: {
          heartRate: 150,
          respRate: 40,
          bloodPressureSys: 110,
          bloodPressureDia: 70,
          spo2: 88,
          temperature: 37.0,
          consciousness: "anxious",
          capillaryRefill: 2
        },
        stages: [
          {
            stage: 1,
            name: "Initial Management",
            ordered: true,
            severity: "severe",
            TTIsec: 60,
            requiredInterventions: [
              "Identify team leader and roles",
              "Prepare room",
              "Deliver albuterol/ipratropium and steroids immediately",
              "Bedside MD performs primary/secondary survey",
              "RN/MD team orders/administers albuterol, ipratropium, steroids, oxygen",
              "Place on monitor"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Deliver albuterol/ipratropium and steroids immediately": { spo2: 5, respRate: -2 }
            }
          },
          {
            stage: 2,
            name: "Escalation",
            ordered: true,
            severity: "severe",
            TTIsec: 300,
            requiredInterventions: [
              "Call for additional resources",
              "Give at least two second-line medications (Magnesium, Terbutaline, Epinephrine)",
              "Initiate noninvasive ventilation"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Initiate noninvasive ventilation": { spo2: 5, respRate: -5 }
            }
          },
          {
            stage: 3,
            name: "Complications",
            ordered: true,
            severity: "critical",
            TTIsec: 450,
            requiredInterventions: [
              "Recognize pneumothorax",
              "Perform needle decompression",
              "Give news to parent",
              "Maintain global perspective"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Perform needle decompression": { spo2: 5, respRate: -5 }
            }
          },
          {
            stage: 4,
            name: "Disposition",
            ordered: true,
            severity: "severe",
            TTIsec: 600,
            requiredInterventions: [
              "Sign out to PICU team",
              "Discuss further treatment/contingency planning"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 15. Status Epilepticus
  {
    id: "aliem_case_15_status_epilepticus",
    category: "Seizure",
    displayName: "Status Epilepticus",
    name: "Status Epilepticus",
    description: "Pediatric patient with ongoing seizure activity.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 15",
    difficulty: "Severe",
    estimatedTime: "15 minutes",
    stages: 4,
    presentingSymptoms: ["Seizure", "Unresponsive"],
    clinicalHistory: "Pediatric patient with ongoing seizure activity; initial stabilization with airway protection, monitoring, labs, and two benzodiazepine doses; escalate to RSI for airway compromise; transition to second-line AEDs.",
    variants: [
      {
        variantId: "A",
        ageBand: "child",
        ageYears: 4,
        weightKg: 16,
        initialVitals: {
          heartRate: 155,
          respRate: 20,
          bloodPressureSys: 100,
          bloodPressureDia: 60,
          spo2: 92,
          temperature: 37.5,
          consciousness: "unresponsive",
          capillaryRefill: 2
        },
        stages: [
          {
            stage: 1,
            name: "Initial Stabilization & Benzos",
            ordered: true,
            severity: "critical",
            TTIsec: 60,
            requiredInterventions: [
              "Assign team roles",
              "Obtain history from parent",
              "Perform primary assessment",
              "Place patient on side and suction",
              "Position airway and consider adjuncts",
              "Place patient on continuous cardiac monitor",
              "Establish access",
              "Send initial labs",
              "Administer glucose for hypoglycemia (if needed)",
              "Administer two rounds of benzodiazepines"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Administer two rounds of benzodiazepines": { heartRate: -10 }
            }
          },
          {
            stage: 2,
            name: "RSI",
            ordered: true,
            severity: "critical",
            TTIsec: 300,
            requiredInterventions: [
              "Select RSI medications",
              "Provide bag-mask ventilation",
              "Perform rapid sequence intubation"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Perform rapid sequence intubation": { spo2: 6, respRate: 12 } // improving ventilation
            }
          },
          {
            stage: 3,
            name: "Second-line Therapy",
            ordered: true,
            severity: "severe",
            TTIsec: 450,
            requiredInterventions: [
              "Identify appropriate antiepileptic medications and indications for second-line therapy",
              "Discuss patient status with the family",
              "Consult neurology"
            ],
            helpful: ["Levetiracetam", "Fosphenytoin", "Phenobarbital"],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          },
          {
            stage: 4,
            name: "Disposition",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: [
              "Determine disposition of patient",
              "Discuss patient status with the family"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  },

  // 16. SVT
  {
    id: "aliem_case_16_svt",
    category: "SVT",
    displayName: "Supraventricular Tachycardia",
    name: "Supraventricular Tachycardia",
    description: "Pediatric patient with SVT initially compensated.",
    sourceVersion: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    sourceCitation: "ALiEM EM ReSCu Peds – Case 16",
    difficulty: "Advanced",
    estimatedTime: "15 minutes",
    stages: 4,
    presentingSymptoms: ["Tachycardia", "Palpitations", "Fussiness"],
    clinicalHistory: "Pediatric patient with SVT initially compensated; treat with vagal maneuvers and adenosine, be ready to escalate to synchronized cardioversion if decompensated.",
    variants: [
      {
        variantId: "A",
        ageBand: "infant",
        ageYears: 1,
        weightKg: 10,
        initialVitals: {
          heartRate: 240,
          respRate: 50,
          bloodPressureSys: 80,
          bloodPressureDia: 50,
          spo2: 95,
          temperature: 37.0,
          consciousness: "irritable",
          capillaryRefill: 2
        },
        stages: [
          {
            stage: 1,
            name: "Initial Management & Adenosine",
            ordered: true,
            severity: "severe",
            TTIsec: 60,
            requiredInterventions: [
              "Team leader assigns tasks",
              "Obtain history from parent",
              "Perform primary survey",
              "Administer supplemental oxygen",
              "Place patient on continuous cardiac monitor",
              "Obtain vascular access",
              "Perform focused physical exam",
              "Verbalize recognition of SVT",
              "Perform vagal maneuver",
              "Administer normal saline bolus 5–10 mL/kg",
              "Administer adenosine",
              "Apply defibrillator pads prior to vagal maneuvers/adenosine"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Perform vagal maneuver": { heartRate: -40, notes: "Transient effect" },
              "Administer adenosine": { heartRate: -100, notes: "Transient blocks AV node" }
            }
          },
          {
            stage: 2,
            name: "Decompensation & Cardioversion",
            ordered: true,
            severity: "critical",
            TTIsec: 180,
            requiredInterventions: [
              "Verbalize decompensated state",
              "Support airway with BMV",
              "Perform synchronized electrical cardioversion (1–2 J/kg)"
            ],
            helpful: [],
            harmful: ["Unsynchronized cardioversion"],
            neutral: [],
            vitalEffects: {
              "Perform synchronized electrical cardioversion (1–2 J/kg)": { heartRate: -100, bloodPressureSys: 10 }
            }
          },
          {
            stage: 3,
            name: "Refractory SVT",
            ordered: true,
            severity: "critical",
            TTIsec: 300,
            requiredInterventions: [
              "Verbalize cardioversion is not working (refractory SVT)",
              "Support airway with BMV or intubation",
              "Manage SVT with antiarrhythmic medication (amiodarone or procainamide)"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {
              "Manage SVT with antiarrhythmic medication (amiodarone or procainamide)": { heartRate: -20 }
            }
          },
          {
            stage: 4,
            name: "Disposition",
            ordered: true,
            severity: "moderate",
            TTIsec: 600,
            requiredInterventions: [
              "Obtain post-conversion ECG and POC/baseline labs",
              "Verbalize recognition of sinus rhythm",
              "Explain diagnosis to parent and relation to presentation",
              "Consult pediatric cardiology",
              "Notify admission team / arrange transfer"
            ],
            helpful: [],
            harmful: [],
            neutral: [],
            vitalEffects: {}
          }
        ]
      }
    ]
  }
];
