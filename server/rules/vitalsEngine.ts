import { Vitals, VitalCurve } from '@shared/kb';

/**
 * Vitals Engine Module
 * Applies vital effects and deterioration curves deterministically
 * No LLM use - all calculations are rule-based
 */

/**
 * Apply vital effects to current vitals
 */
export function applyVitalEffects(
  currentVitals: Vitals,
  effects: Partial<Vitals>
): Vitals {
  const updatedVitals = { ...currentVitals };
  
  // Apply each effect
  Object.entries(effects).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const vitalKey = key as keyof Vitals;
      
      switch (vitalKey) {
        case 'heartRate':
          if (typeof currentVitals.heartRate === 'number' && typeof value === 'number') {
            updatedVitals.heartRate = Math.max(0, Math.min(300, currentVitals.heartRate + value));
          }
          break;
        case 'respRate':
          if (typeof currentVitals.respRate === 'number' && typeof value === 'number') {
            updatedVitals.respRate = Math.max(0, Math.min(100, currentVitals.respRate + value));
          }
          break;
        case 'bloodPressureSys':
          if (typeof currentVitals.bloodPressureSys === 'number' && typeof value === 'number') {
            updatedVitals.bloodPressureSys = Math.max(0, Math.min(300, currentVitals.bloodPressureSys + value));
          }
          break;
        case 'bloodPressureDia':
          if (typeof currentVitals.bloodPressureDia === 'number' && typeof value === 'number') {
            updatedVitals.bloodPressureDia = Math.max(0, Math.min(200, currentVitals.bloodPressureDia + value));
          }
          break;
        case 'spo2':
          if (typeof currentVitals.spo2 === 'number' && typeof value === 'number') {
            updatedVitals.spo2 = Math.max(0, Math.min(100, currentVitals.spo2 + value));
          }
          break;
        case 'temperature':
          if (typeof currentVitals.temperature === 'number' && typeof value === 'number') {
            updatedVitals.temperature = Math.max(30, Math.min(45, currentVitals.temperature + value));
          }
          break;
        case 'capillaryRefill':
          if (typeof value === 'number') {
            updatedVitals.capillaryRefill = Math.max(0, Math.min(10, currentVitals.capillaryRefill || 0 + value));
          }
          break;
        case 'consciousness':
          updatedVitals.consciousness = value as string;
          break;
      }
    }
  });
  
  return updatedVitals;
}

/**
 * Tick vitals based on deterioration curve
 */
export function tickVitals(
  currentVitals: Vitals,
  curve: VitalCurve,
  deltaTime: number = 10 // seconds
): { vitals: Vitals; deteriorationRates: Record<string, number> } {
  const deteriorationRates: Record<string, number> = {};
  const updatedVitals = { ...currentVitals };
  
  // Calculate deterioration for each vital parameter
  Object.entries(curve.params).forEach(([param, rate]) => {
    const vitalKey = param as keyof Vitals;
    const currentValue = currentVitals[vitalKey];
    
    if (typeof currentValue === 'number' && typeof rate === 'number') {
      // Calculate deterioration over time
      const deterioration = (rate * deltaTime) / 60; // Convert to per-minute rate
      deteriorationRates[param] = deterioration;
      
      // Apply deterioration based on parameter type
      switch (vitalKey) {
        case 'heartRate':
          // Heart rate can increase or decrease based on clinical context
          if (rate > 0) {
            updatedVitals.heartRate = Math.min(300, currentValue + deterioration);
          } else {
            updatedVitals.heartRate = Math.max(0, currentValue + deterioration);
          }
          break;
          
        case 'respRate':
          // Respiratory rate typically increases in distress
          if (rate > 0) {
            updatedVitals.respRate = Math.min(100, currentValue + deterioration);
          } else {
            updatedVitals.respRate = Math.max(0, currentValue + deterioration);
          }
          break;
          
        case 'bloodPressureSys':
          // Blood pressure can decrease in shock
          if (rate < 0) {
            updatedVitals.bloodPressureSys = Math.max(0, currentValue + deterioration);
          } else {
            updatedVitals.bloodPressureSys = Math.min(300, currentValue + deterioration);
          }
          break;
          
        case 'bloodPressureDia':
          // Diastolic pressure can decrease in shock
          if (rate < 0) {
            updatedVitals.bloodPressureDia = Math.max(0, currentValue + deterioration);
          } else {
            updatedVitals.bloodPressureDia = Math.min(200, currentValue + deterioration);
          }
          break;
          
        case 'spo2':
          // Oxygen saturation typically decreases
          if (rate < 0) {
            updatedVitals.spo2 = Math.max(0, currentValue + deterioration);
          } else {
            updatedVitals.spo2 = Math.min(100, currentValue + deterioration);
          }
          break;
          
        case 'temperature':
          // Temperature can increase in fever or decrease in shock
          if (rate > 0) {
            updatedVitals.temperature = Math.min(45, currentValue + deterioration);
          } else {
            updatedVitals.temperature = Math.max(30, currentValue + deterioration);
          }
          break;
          
        case 'capillaryRefill':
          // Capillary refill time increases in shock
          if (rate > 0) {
            updatedVitals.capillaryRefill = Math.min(10, (updatedVitals.capillaryRefill || 0) + deterioration);
          }
          break;
      }
    }
  });
  
  return { vitals: updatedVitals, deteriorationRates };
}

/**
 * Calculate clinical severity score
 */
export function calculateSeverityScore(vitals: Vitals): number {
  let score = 0;
  
  // Heart rate scoring
  if (vitals.heartRate < 60) score += 2;
  else if (vitals.heartRate > 180) score += 3;
  else if (vitals.heartRate > 160) score += 2;
  else if (vitals.heartRate > 140) score += 1;
  
  // Respiratory rate scoring
  if (vitals.respRate < 20) score += 2;
  else if (vitals.respRate > 60) score += 3;
  else if (vitals.respRate > 50) score += 2;
  else if (vitals.respRate > 40) score += 1;
  
  // Blood pressure scoring
  if (vitals.bloodPressureSys < 90) score += 3;
  else if (vitals.bloodPressureSys < 100) score += 2;
  else if (vitals.bloodPressureSys < 110) score += 1;
  
  // Oxygen saturation scoring
  if (vitals.spo2 < 90) score += 3;
  else if (vitals.spo2 < 95) score += 1;
  
  // Temperature scoring
  if (vitals.temperature > 40) score += 2;
  else if (vitals.temperature > 39) score += 1;
  else if (vitals.temperature < 36) score += 1;
  
  // Capillary refill scoring
  if (vitals.capillaryRefill && vitals.capillaryRefill > 3) score += 2;
  
  // Consciousness scoring
  if (vitals.consciousness === 'unresponsive') score += 4;
  else if (vitals.consciousness === 'lethargic') score += 2;
  else if (vitals.consciousness === 'confused') score += 1;
  
  return Math.min(score, 20); // Cap at 20
}

/**
 * Determine clinical status based on vitals
 */
export function determineClinicalStatus(vitals: Vitals): {
  status: 'stable' | 'concerning' | 'critical' | 'emergent';
  priority: number;
  recommendations: string[];
} {
  const severityScore = calculateSeverityScore(vitals);
  
  let status: 'stable' | 'concerning' | 'critical' | 'emergent';
  let priority: number;
  let recommendations: string[] = [];
  
  if (severityScore <= 3) {
    status = 'stable';
    priority = 4;
    recommendations = ['Continue monitoring', 'Reassess in 15 minutes'];
  } else if (severityScore <= 6) {
    status = 'concerning';
    priority = 3;
    recommendations = ['Increase monitoring frequency', 'Consider intervention', 'Reassess in 5 minutes'];
  } else if (severityScore <= 10) {
    status = 'critical';
    priority = 2;
    recommendations = ['Immediate intervention required', 'Prepare for escalation', 'Continuous monitoring'];
  } else {
    status = 'emergent';
    priority = 1;
    recommendations = ['Immediate life-saving intervention', 'Call for help', 'Prepare for resuscitation'];
  }
  
  // Add specific recommendations based on individual vitals
  if (vitals.spo2 < 90) {
    recommendations.push('Oxygen therapy indicated');
  }
  
  if (vitals.bloodPressureSys < 90) {
    recommendations.push('Fluid resuscitation may be needed');
  }
  
  if (vitals.heartRate > 180 || vitals.heartRate < 60) {
    recommendations.push('Cardiac monitoring essential');
  }
  
  return { status, priority, recommendations };
}

/**
 * Calculate time to critical threshold
 */
export function calculateTimeToCritical(
  currentVitals: Vitals,
  curve: VitalCurve,
  criticalThresholds: Partial<Vitals>
): Record<string, number> {
  const timeToCritical: Record<string, number> = {};
  
  Object.entries(criticalThresholds).forEach(([param, threshold]) => {
    const vitalKey = param as keyof Vitals;
    const currentValue = currentVitals[vitalKey];
    const rate = curve.params[param];
    
    if (typeof currentValue === 'number' && typeof threshold === 'number' && typeof rate === 'number') {
      if (rate !== 0) {
        const timeToReach = Math.abs((threshold - currentValue) / rate);
        timeToCritical[param] = Math.max(0, timeToReach * 60); // Convert to seconds
      } else {
        timeToCritical[param] = Infinity;
      }
    }
  });
  
  return timeToCritical;
}

/**
 * Validate vital ranges
 */
export function validateVitalRanges(vitals: Vitals): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let isValid = true;
  
  // Heart rate validation
  if (vitals.heartRate < 0 || vitals.heartRate > 300) {
    warnings.push(`Heart rate out of range: ${vitals.heartRate}`);
    isValid = false;
  }
  
  // Respiratory rate validation
  if (vitals.respRate < 0 || vitals.respRate > 100) {
    warnings.push(`Respiratory rate out of range: ${vitals.respRate}`);
    isValid = false;
  }
  
  // Blood pressure validation
  if (vitals.bloodPressureSys < 0 || vitals.bloodPressureSys > 300) {
    warnings.push(`Systolic BP out of range: ${vitals.bloodPressureSys}`);
    isValid = false;
  }
  
  if (vitals.bloodPressureDia < 0 || vitals.bloodPressureDia > 200) {
    warnings.push(`Diastolic BP out of range: ${vitals.bloodPressureDia}`);
    isValid = false;
  }
  
  // Oxygen saturation validation
  if (vitals.spo2 < 0 || vitals.spo2 > 100) {
    warnings.push(`SpO2 out of range: ${vitals.spo2}`);
    isValid = false;
  }
  
  // Temperature validation
  if (vitals.temperature < 30 || vitals.temperature > 45) {
    warnings.push(`Temperature out of range: ${vitals.temperature}`);
    isValid = false;
  }
  
  // Capillary refill validation
  if (vitals.capillaryRefill !== undefined && (vitals.capillaryRefill < 0 || vitals.capillaryRefill > 10)) {
    warnings.push(`Capillary refill out of range: ${vitals.capillaryRefill}`);
    isValid = false;
  }
  
  return { isValid, warnings };
}


