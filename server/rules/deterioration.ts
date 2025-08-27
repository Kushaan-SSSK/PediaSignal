/**
 * Deterministic vital sign deterioration engine
 * Implements rules-based deterioration without AI calls
 */

export interface TickInput {
  caseType: string;
  stage: number;
  severity: 'mild' | 'moderate' | 'severe';
  ageBand: string;
  vitals: {
    heartRate: number;
    respRate: number;
    bloodPressureSys: number;
    bloodPressureDia: number;
    spo2: number;
    temperature: number;
    consciousness: string;
    capillaryRefill: number;
  };
  elapsedSec: number;
}

export interface TickOutput {
  vitals: {
    heartRate: number;
    respRate: number;
    bloodPressureSys: number;
    bloodPressureDia: number;
    spo2: number;
    temperature: number;
    consciousness: string;
    capillaryRefill: number;
  };
  alerts: string[];
}

// Configuration for deterioration limits and guardrails
const CONFIG = {
  // Per-tick maximum changes (for 1s intervals - PALS-based realistic rates)
  maxDeltas: {
    heartRate: 1,      // bpm per second (realistic physiologic change)
    respRate: 0.5,     // breaths/min per second 
    bloodPressureSys: 0.8, // mmHg per second
    bloodPressureDia: 0.4, // mmHg per second
    spo2: 0.5,         // percentage points per second (can drop quickly)
    temperature: 0.02, // °F per second
    capillaryRefill: 0.03 // seconds per second
  },
  
  // Physiologic guardrails (absolute limits)
  guardrails: {
    heartRate: { min: 40, max: 200 },
    respRate: { min: 8, max: 60 },
    bloodPressureSys: { min: 60, max: 200 },
    bloodPressureDia: { min: 40, max: 120 },
    spo2: { min: 70, max: 100 },
    temperature: { min: 94.0, max: 108.0 },
    capillaryRefill: { min: 1.0, max: 8.0 }
  },
  
  // Severity multipliers
  severityMultiplier: {
    mild: 0.5,
    moderate: 1.0,
    severe: 1.8
  },
  
  // Stage multipliers (later stages accelerate slightly)
  stageMultiplier: {
    1: 1.0,
    2: 1.1,
    3: 1.25,
    4: 1.4
  }
};

// Medical guidelines-based deterioration trends per case type (per second)
// Based on PALS Guidelines 2020 and ALiEM Emergency Medicine ReSCu Peds
const CASE_TRENDS = {
  // Anaphylaxis deterioration follows classic biphasic pattern
  // PALS Guidelines: Progressive hypotension, tachycardia, hypoxemia
  anaphylaxis: {
    heartRate: 0.4,      // Compensatory tachycardia from hypotension
    respRate: 0.25,      // Bronchospasm and laryngeal edema
    bloodPressureSys: -0.2, // Primary pathophysiology: vasodilation
    bloodPressureDia: -0.12,
    spo2: -0.12,         // Respiratory compromise from edema/bronchospasm
    temperature: 0.002,   // Minimal temperature change
    capillaryRefill: 0.03 // Poor perfusion from hypotension
  },
  // Status asthmaticus: Progressive respiratory failure
  // PALS: Increasing work of breathing, hypoxemia, eventual respiratory acidosis
  'status_asthmaticus': {
    heartRate: 0.35,     // Hypoxemia-induced tachycardia
    respRate: 0.4,       // Primary pathophysiology: airway obstruction
    bloodPressureSys: 0.08, // Mild hypertension from stress/hypoxemia
    bloodPressureDia: 0.03,
    spo2: -0.18,         // Progressive hypoxemia - most critical parameter
    temperature: 0.008,   // Mild hyperthermia from work of breathing
    capillaryRefill: 0.015
  },
  // Status epilepticus: Metabolic and respiratory consequences
  // PALS: Hyperthermia, hypoxemia from inadequate ventilation, hypertension
  'status_epilepticus': {
    heartRate: 0.3,      // Sympathetic activation
    respRate: 0.15,      // Decreased due to CNS depression
    bloodPressureSys: 0.15, // Hypertension from catecholamine release
    bloodPressureDia: 0.08,
    spo2: -0.1,          // Hypoventilation and aspiration risk
    temperature: 0.02,    // Hyperthermia from continuous muscle activity
    capillaryRefill: 0.015
  },
  // Diabetic ketoacidosis: Progressive dehydration and shock
  // PALS: Kussmaul respirations, dehydration, eventual shock
  dka: {
    heartRate: 0.35,     // Dehydration-induced tachycardia
    respRate: 0.3,       // Kussmaul respirations (compensatory)
    bloodPressureSys: -0.15, // Progressive dehydration leading to shock
    bloodPressureDia: -0.08,
    spo2: -0.06,         // Generally preserved until late shock
    temperature: 0.005,   // Variable temperature
    capillaryRefill: 0.025 // Poor perfusion from dehydration
  },
  // Sepsis/septic shock: Classic warm then cold shock progression
  // PALS: High cardiac output with vasodilation, then myocardial dysfunction
  sepsis: {
    heartRate: 0.45,     // Most prominent early sign
    respRate: 0.2,       // Compensatory for metabolic acidosis
    bloodPressureSys: -0.25, // Progressive vasodilation and myocardial depression
    bloodPressureDia: -0.15,
    spo2: -0.1,          // ARDS development
    temperature: 0.025,   // Fever or hypothermia in late stages
    capillaryRefill: 0.035 // Poor perfusion - key clinical sign
  },
  // Foreign body aspiration: Acute respiratory compromise
  // PALS: Hypoxemia, compensatory tachycardia, respiratory acidosis
  'foreign_body_aspiration': {
    heartRate: 0.3,      // Hypoxemia-induced
    respRate: 0.35,      // Increased work of breathing
    bloodPressureSys: 0.05, // Mild hypertension from hypoxemia
    bloodPressureDia: 0.0,
    spo2: -0.2,          // Rapid desaturation - most critical
    temperature: 0.0,     // No temperature change
    capillaryRefill: 0.02
  },
  // Opioid toxicity: Respiratory depression pattern
  'opioid_toxicity': {
    heartRate: -0.15,    // Bradycardia from CNS depression
    respRate: -0.25,     // Primary pathophysiology: respiratory depression
    bloodPressureSys: -0.1, // Hypotension from CNS/cardiac depression
    bloodPressureDia: -0.05,
    spo2: -0.15,         // Hypoventilation leading to hypoxemia
    temperature: -0.01,   // Hypothermia
    capillaryRefill: 0.02
  },
  // Default pattern for unspecified cases
  default: {
    heartRate: 0.15,
    respRate: 0.12,
    bloodPressureSys: -0.08,
    bloodPressureDia: -0.04,
    spo2: -0.08,
    temperature: 0.008,
    capillaryRefill: 0.015
  }
};

/**
 * Apply logistic braking near guardrails
 * Reduces delta as value approaches min/max
 */
function applyLogisticBraking(currentValue: number, delta: number, min: number, max: number): number {
  if (delta > 0) {
    // Approaching maximum
    const distanceToMax = max - currentValue;
    const totalRange = max - min;
    const brakingFactor = Math.max(0.1, distanceToMax / totalRange);
    return delta * brakingFactor;
  } else if (delta < 0) {
    // Approaching minimum
    const distanceToMin = currentValue - min;
    const totalRange = max - min;
    const brakingFactor = Math.max(0.1, distanceToMin / totalRange);
    return delta * brakingFactor;
  }
  return delta;
}

/**
 * Clamp value to guardrails
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate PALS guideline-based alerts for current vitals and case type
 */
function generateAlerts(vitals: TickOutput['vitals'], caseType: string): string[] {
  const alerts: string[] = [];
  
  // PALS-based SpO2 thresholds (age-appropriate)
  if (vitals.spo2 < 88) {
    alerts.push('CRITICAL: Severe hypoxemia - Consider intubation');
  } else if (vitals.spo2 < 92) {
    alerts.push('URGENT: Hypoxemia detected - Increase oxygen support');
  } else if (vitals.spo2 < 95) {
    alerts.push('SpO2 declining - Monitor airway closely');
  }
  
  // Case-specific blood pressure alerts (PALS shock definitions)
  const systolicThresholds = {
    anaphylaxis: { critical: 70, urgent: 85 },  // Distributive shock
    sepsis: { critical: 70, urgent: 85 },       // Septic shock
    dka: { critical: 75, urgent: 90 },          // Hypovolemic shock
    default: { critical: 80, urgent: 95 }
  };
  
  const thresholds = systolicThresholds[caseType as keyof typeof systolicThresholds] || systolicThresholds.default;
  
  if (vitals.bloodPressureSys < thresholds.critical) {
    alerts.push('CRITICAL: Hypotensive shock - Immediate intervention required');
  } else if (vitals.bloodPressureSys < thresholds.urgent) {
    alerts.push('URGENT: Hypotension developing - Consider fluid resuscitation');
  }
  
  // PALS heart rate alerts (pediatric-specific thresholds)
  if (caseType === 'opioid_toxicity') {
    if (vitals.heartRate < 60) {
      alerts.push('CRITICAL: Severe bradycardia - Consider CPR');
    } else if (vitals.heartRate < 80) {
      alerts.push('URGENT: Bradycardia detected - Monitor closely');
    }
  } else {
    // Tachycardia alerts for other conditions
    if (vitals.heartRate > 180) {
      alerts.push('CRITICAL: Severe tachycardia - Consider cardiovascular instability');
    } else if (vitals.heartRate > 160) {
      alerts.push('URGENT: Significant tachycardia - Assess underlying cause');
    } else if (vitals.heartRate > 140) {
      alerts.push('Tachycardia developing - Monitor trends');
    }
  }
  
  // Respiratory rate alerts based on PALS guidelines
  if (caseType === 'opioid_toxicity') {
    if (vitals.respRate < 10) {
      alerts.push('CRITICAL: Severe respiratory depression - Consider bag-mask ventilation');
    } else if (vitals.respRate < 15) {
      alerts.push('URGENT: Respiratory depression - Prepare for airway support');
    }
  } else {
    // Tachypnea for other conditions
    if (vitals.respRate > 45) {
      alerts.push('CRITICAL: Severe respiratory distress - Consider ventilatory support');
    } else if (vitals.respRate > 35) {
      alerts.push('URGENT: Significant tachypnea - Assess work of breathing');
    } else if (vitals.respRate > 28) {
      alerts.push('Respiratory rate elevated - Monitor closely');
    }
  }
  
  // Temperature alerts with case-specific context
  if (vitals.temperature > 105.0) {
    alerts.push('CRITICAL: Hyperthermia - Risk of organ dysfunction');
  } else if (vitals.temperature > 103.0) {
    alerts.push('URGENT: High fever - Consider cooling measures');
  } else if (vitals.temperature < 96.0 && (caseType.includes('sepsis') || caseType === 'opioid_toxicity')) {
    alerts.push('URGENT: Hypothermia - Sign of severe illness');
  }
  
  // Capillary refill alerts (PALS perfusion assessment)
  if (vitals.capillaryRefill > 4.0) {
    alerts.push('CRITICAL: Severely delayed capillary refill - Poor perfusion');
  } else if (vitals.capillaryRefill > 3.0) {
    alerts.push('URGENT: Delayed capillary refill - Assess circulation');
  }
  
  return alerts;
}

/**
 * Map case IDs to medical condition types
 */
function mapCaseTypeToCondition(caseType: string): string {
  // Handle ALiEM case IDs
  if (caseType.includes('anaphylaxis')) return 'anaphylaxis';
  if (caseType.includes('asthmaticus')) return 'status_asthmaticus';
  if (caseType.includes('epilepticus')) return 'status_epilepticus';
  if (caseType.includes('dka')) return 'dka';
  if (caseType.includes('sepsis') || caseType.includes('pneumonia')) return 'sepsis';
  if (caseType.includes('foreign_body')) return 'foreign_body_aspiration';
  if (caseType.includes('opioid')) return 'opioid_toxicity';
  
  // Direct matches
  if (caseType === 'anaphylaxis') return 'anaphylaxis';
  if (caseType === 'status_asthmaticus') return 'status_asthmaticus';
  if (caseType === 'status_epilepticus') return 'status_epilepticus';
  if (caseType === 'dka') return 'dka';
  if (caseType === 'sepsis') return 'sepsis';
  if (caseType === 'foreign_body_aspiration') return 'foreign_body_aspiration';
  if (caseType === 'opioid_toxicity') return 'opioid_toxicity';
  
  return 'default';
}

/**
 * Main deterioration tick function
 */
export function tick(input: TickInput): TickOutput {
  const { caseType, stage, severity, vitals, elapsedSec } = input;
  
  // Map case ID to medical condition
  const conditionType = mapCaseTypeToCondition(caseType);
  console.log(`🔄 Deterioration tick: ${caseType} → ${conditionType} (${severity}, stage ${stage}, ${elapsedSec}s)`);
  
  // Get base trends for this condition type
  const trends = CASE_TRENDS[conditionType as keyof typeof CASE_TRENDS] || CASE_TRENDS.default;
  
  // Apply multipliers
  const severityMult = CONFIG.severityMultiplier[severity];
  const stageMult = CONFIG.stageMultiplier[stage as keyof typeof CONFIG.stageMultiplier] || 1.0;
  const totalMult = severityMult * stageMult;
  
  // Calculate raw deltas based on elapsed time
  const rawDeltas = {
    heartRate: trends.heartRate * elapsedSec * totalMult,
    respRate: trends.respRate * elapsedSec * totalMult,
    bloodPressureSys: trends.bloodPressureSys * elapsedSec * totalMult,
    bloodPressureDia: trends.bloodPressureDia * elapsedSec * totalMult,
    spo2: trends.spo2 * elapsedSec * totalMult,
    temperature: trends.temperature * elapsedSec * totalMult,
    capillaryRefill: trends.capillaryRefill * elapsedSec * totalMult
  };
  
  // Apply per-tick caps
  const cappedDeltas = {
    heartRate: Math.max(-CONFIG.maxDeltas.heartRate, Math.min(CONFIG.maxDeltas.heartRate, rawDeltas.heartRate)),
    respRate: Math.max(-CONFIG.maxDeltas.respRate, Math.min(CONFIG.maxDeltas.respRate, rawDeltas.respRate)),
    bloodPressureSys: Math.max(-CONFIG.maxDeltas.bloodPressureSys, Math.min(CONFIG.maxDeltas.bloodPressureSys, rawDeltas.bloodPressureSys)),
    bloodPressureDia: Math.max(-CONFIG.maxDeltas.bloodPressureDia, Math.min(CONFIG.maxDeltas.bloodPressureDia, rawDeltas.bloodPressureDia)),
    spo2: Math.max(-CONFIG.maxDeltas.spo2, Math.min(CONFIG.maxDeltas.spo2, rawDeltas.spo2)),
    temperature: Math.max(-CONFIG.maxDeltas.temperature, Math.min(CONFIG.maxDeltas.temperature, rawDeltas.temperature)),
    capillaryRefill: Math.max(-CONFIG.maxDeltas.capillaryRefill, Math.min(CONFIG.maxDeltas.capillaryRefill, rawDeltas.capillaryRefill))
  };
  
  // Apply logistic braking near guardrails
  const brakedDeltas = {
    heartRate: applyLogisticBraking(vitals.heartRate, cappedDeltas.heartRate, CONFIG.guardrails.heartRate.min, CONFIG.guardrails.heartRate.max),
    respRate: applyLogisticBraking(vitals.respRate, cappedDeltas.respRate, CONFIG.guardrails.respRate.min, CONFIG.guardrails.respRate.max),
    bloodPressureSys: applyLogisticBraking(vitals.bloodPressureSys, cappedDeltas.bloodPressureSys, CONFIG.guardrails.bloodPressureSys.min, CONFIG.guardrails.bloodPressureSys.max),
    bloodPressureDia: applyLogisticBraking(vitals.bloodPressureDia, cappedDeltas.bloodPressureDia, CONFIG.guardrails.bloodPressureDia.min, CONFIG.guardrails.bloodPressureDia.max),
    spo2: applyLogisticBraking(vitals.spo2, cappedDeltas.spo2, CONFIG.guardrails.spo2.min, CONFIG.guardrails.spo2.max),
    temperature: applyLogisticBraking(vitals.temperature, cappedDeltas.temperature, CONFIG.guardrails.temperature.min, CONFIG.guardrails.temperature.max),
    capillaryRefill: applyLogisticBraking(vitals.capillaryRefill, cappedDeltas.capillaryRefill, CONFIG.guardrails.capillaryRefill.min, CONFIG.guardrails.capillaryRefill.max)
  };
  
  // Apply deltas and clamp to guardrails
  const updatedVitals = {
    heartRate: Math.round(clamp(vitals.heartRate + brakedDeltas.heartRate, CONFIG.guardrails.heartRate.min, CONFIG.guardrails.heartRate.max)),
    respRate: Math.round(clamp(vitals.respRate + brakedDeltas.respRate, CONFIG.guardrails.respRate.min, CONFIG.guardrails.respRate.max)),
    bloodPressureSys: Math.round(clamp(vitals.bloodPressureSys + brakedDeltas.bloodPressureSys, CONFIG.guardrails.bloodPressureSys.min, CONFIG.guardrails.bloodPressureSys.max)),
    bloodPressureDia: Math.round(clamp(vitals.bloodPressureDia + brakedDeltas.bloodPressureDia, CONFIG.guardrails.bloodPressureDia.min, CONFIG.guardrails.bloodPressureDia.max)),
    spo2: Math.round(clamp(vitals.spo2 + brakedDeltas.spo2, CONFIG.guardrails.spo2.min, CONFIG.guardrails.spo2.max)),
    temperature: Math.round((clamp(vitals.temperature + brakedDeltas.temperature, CONFIG.guardrails.temperature.min, CONFIG.guardrails.temperature.max)) * 10) / 10,
    consciousness: vitals.consciousness, // Keep consciousness unchanged for now
    capillaryRefill: Math.round((clamp(vitals.capillaryRefill + brakedDeltas.capillaryRefill, CONFIG.guardrails.capillaryRefill.min, CONFIG.guardrails.capillaryRefill.max)) * 10) / 10
  };
  
  // Generate alerts
  const alerts = generateAlerts(updatedVitals, caseType);
  
  return {
    vitals: updatedVitals,
    alerts
  };
}

export { CONFIG };