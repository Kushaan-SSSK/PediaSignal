import { db } from '../db';
import { kbRules } from '@shared/schema';
import { DoseRequest, DoseResponse, AlgoRequest, AlgoResponse, DrugDose, AlgoStep, CriticalAction } from '@shared/kb';
import { eq, and } from 'drizzle-orm';

/**
 * Rules Service Module
 * Provides deterministic numerics from kb_rules: doses, algorithms, vital curves, critical actions
 * No LLM use - all calculations are rule-based
 */

/**
 * Get drug dose based on weight and age
 */
export async function getDose(request: DoseRequest): Promise<DoseResponse> {
  try {
    // Get dose rules for the drug
    const doseRules = await db
      .select()
      .from(kbRules)
      .where(
        and(
          eq(kbRules.kind, 'drug_doses'),
          eq(kbRules.caseId, 'general') // General dosing rules
        )
      );

    if (doseRules.length === 0) {
      throw new Error(`No dosing rules found for ${request.drug}`);
    }

    // Find the specific drug rule
    const drugRule = doseRules.find(rule => {
      const typedRule = rule as any;
      const payload = typedRule.payload as DrugDose;
      return payload.name.toLowerCase() === request.drug.toLowerCase();
    });

    if (!drugRule) {
      throw new Error(`No dosing rules found for ${request.drug}`);
    }

    const typedDrugRule = drugRule as any;
    const doseData = typedDrugRule.payload as DrugDose;
    
    // Calculate dose based on weight
    let calculatedDose = 0;
    let unit = 'mg';
    
    // Check weight bands first
    const weightBand = doseData.weightBands.find(band => 
      request.weight >= band.minWeight && request.weight <= band.maxWeight
    );
    
    if (weightBand) {
      calculatedDose = weightBand.dose;
    } else {
      // Calculate based on mg/kg range
      const mgPerKg = (doseData.mgPerKgMin + doseData.mgPerKgMax) / 2;
      calculatedDose = request.weight * mgPerKg;
    }
    
    // Apply safety bounds
    calculatedDose = Math.min(calculatedDose, doseData.maxDose);
    calculatedDose = Math.max(calculatedDose, doseData.mgPerKgMin * request.weight);
    
    // Round to appropriate precision
    calculatedDose = Math.round(calculatedDose * 100) / 100;
    
    // Generate warnings
    const warnings: string[] = [];
    if (calculatedDose >= doseData.maxDose) {
      warnings.push(`Maximum dose limit reached: ${doseData.maxDose}mg`);
    }
    if (request.weight < 1) {
      warnings.push('Weight below 1kg - verify calculation');
    }
    
    return {
      dose: calculatedDose,
      unit,
      route: doseData.route,
      warnings,
      source: `ALiEM EM ReSCu Peds - ${typedDrugRule.version}`,
    };

  } catch (error) {
    console.error('Error getting drug dose:', error);
    throw new Error(`Dose calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get algorithm steps for a case and stage
 */
export async function getAlgo(request: AlgoRequest): Promise<AlgoResponse> {
  try {
    // Get algorithm rules for the case
    const algoRules = await db
      .select()
      .from(kbRules)
      .where(
        and(
          eq(kbRules.kind, 'algo_steps'),
          eq(kbRules.caseId, request.caseId)
        )
      );

    if (algoRules.length === 0) {
      throw new Error(`No algorithm found for case ${request.caseId}`);
    }

    // Get the most recent version
    const latestRule = algoRules.sort((a, b) => {
      const typedA = a as any;
      const typedB = b as any;
      return new Date(typedB.version).getTime() - new Date(typedA.version).getTime();
    })[0];

    const typedLatestRule = latestRule as any;
    const algoData = typedLatestRule.payload as { steps: AlgoStep[] };
    
    // Filter steps based on current vitals and conditions
    const applicableSteps = algoData.steps.filter(step => {
      if (!step.appliesIf) return true;
      
      // Check if conditions are met
      return Object.entries(step.appliesIf).every(([key, value]) => {
        const currentValue = request.currentVitals[key as keyof typeof request.currentVitals];
        if (currentValue === undefined || currentValue === null) return false;
        
        if (typeof value === 'number') {
          return currentValue === value;
        } else if (typeof value === 'object' && 'min' in value && 'max' in value) {
          return currentValue >= value.min && currentValue <= value.max;
        }
        return true;
      });
    });

    // Get critical actions for the stage
    const criticalActions = await getCriticalActions(request.caseId, request.stage);
    
    // Determine next stage
    const nextStage = determineNextStage(request.stage, applicableSteps, criticalActions);

    return {
      steps: applicableSteps.sort((a, b) => a.order - b.order),
      criticalActions,
      nextStage,
      source: `ALiEM EM ReSCu Peds - ${typedLatestRule.version}`,
    };

  } catch (error) {
    console.error('Error getting algorithm:', error);
    throw new Error(`Algorithm retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get critical actions for a case and stage
 */
export async function getCriticalActions(caseId: string, stage: number): Promise<CriticalAction[]> {
  try {
    const actionRules = await db
      .select()
      .from(kbRules)
      .where(
        and(
          eq(kbRules.kind, 'critical_actions'),
          eq(kbRules.caseId, caseId)
        )
      );

    if (actionRules.length === 0) {
      return [];
    }

    const latestRule = actionRules.sort((a, b) => {
      const typedA = a as any;
      const typedB = b as any;
      return new Date(typedB.version).getTime() - new Date(typedA.version).getTime();
    })[0];

    const typedLatestRule = latestRule as any;
    const actionsData = typedLatestRule.payload as { actions: CriticalAction[] };
    
    // Filter actions for the current stage
    return actionsData.actions
      .filter(action => action.stage === stage)
      .sort((a, b) => a.order - b.order);

  } catch (error) {
    console.error('Error getting critical actions:', error);
    return [];
  }
}

/**
 * Get vital curve for deterioration modeling
 */
export async function getVitalCurve(curveId: string): Promise<any> {
  try {
    const curveRules = await db
      .select()
      .from(kbRules)
      .where(
        and(
          eq(kbRules.kind, 'vital_curves'),
          eq(kbRules.caseId, curveId)
        )
      );

    if (curveRules.length === 0) {
      throw new Error(`No vital curve found for ${curveId}`);
    }

    const latestRule = curveRules.sort((a, b) => {
      const typedA = a as any;
      const typedB = b as any;
      return new Date(typedB.version).getTime() - new Date(typedA.version).getTime();
    })[0];

    const typedLatestRule = latestRule as any;
    return typedLatestRule.payload;

  } catch (error) {
    console.error('Error getting vital curve:', error);
    throw new Error(`Vital curve retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Determine next stage based on completed actions
 */
export function determineNextStage(
  currentStage: number,
  steps: AlgoStep[],
  criticalActions: CriticalAction[]
): number {
  // Check if all required critical actions are completed
  const requiredActions = criticalActions.filter(action => action.required);
  const completedActions = requiredActions.length; // In real implementation, track completion
  
  // If all required actions completed, advance to next stage
  if (completedActions === requiredActions.length) {
    return currentStage + 1;
  }
  
  return currentStage;
}

/**
 * Validate dose calculation safety
 */
export function validateDoseSafety(
  calculatedDose: number,
  weight: number,
  doseData: DrugDose
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  let isValid = true;
  
  // Check weight-based limits
  const minDose = doseData.mgPerKgMin * weight;
  const maxDose = doseData.mgPerKgMax * weight;
  
  if (calculatedDose < minDose) {
    warnings.push(`Dose below minimum: ${calculatedDose}mg < ${minDose}mg`);
    isValid = false;
  }
  
  if (calculatedDose > maxDose) {
    warnings.push(`Dose above maximum: ${calculatedDose}mg > ${maxDose}mg`);
    isValid = false;
  }
  
  // Check absolute maximum
  if (calculatedDose > doseData.maxDose) {
    warnings.push(`Dose exceeds absolute maximum: ${calculatedDose}mg > ${doseData.maxDose}mg`);
    isValid = false;
  }
  
  // Check weight limits
  if (weight < 0.5) {
    warnings.push('Weight below 0.5kg - extreme caution required');
  }
  
  if (weight > 100) {
    warnings.push('Weight above 100kg - adult dosing may be more appropriate');
  }
  
  return { isValid, warnings };
}

/**
 * Get all available drugs
 */
export async function getAvailableDrugs(): Promise<string[]> {
  try {
    const doseRules = await db
      .select()
      .from(kbRules)
      .where(eq(kbRules.kind, 'drug_doses'));

    const drugs = new Set<string>();
    doseRules.forEach(rule => {
      const typedRule = rule as any;
      const payload = typedRule.payload as DrugDose;
      drugs.add(payload.name);
    });

    return Array.from(drugs).sort();
  } catch (error) {
    console.error('Error getting available drugs:', error);
    return [];
  }
}

/**
 * Get all available cases
 */
export async function getAvailableCases(): Promise<string[]> {
  try {
    const caseRules = await db
      .select()
      .from(kbRules)
      .where(eq(kbRules.kind, 'algo_steps'));

    const cases = new Set<string>();
    caseRules.forEach(rule => {
      const typedRule = rule as any;
      cases.add(typedRule.caseId);
    });

    return Array.from(cases).sort();
  } catch (error) {
    console.error('Error getting available cases:', error);
    return [];
  }
}


