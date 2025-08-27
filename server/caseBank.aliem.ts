import fs from 'fs';
import path from 'path';

// ALiEM Case Schema
export interface ALiEMCase {
  id: string;
  category: string;
  displayName: string;
  sourceVersion: string;
  license: string;
  sourceCitation: string;
  variants: ALiEMVariant[];
}

export interface ALiEMVariant {
  variantId: string;
  ageBand: string;
  ageYears: number;
  weightKg: number;
  initialVitals: {
    heartRate: number | null;
    respRate: number | null;
    bloodPressureSys: number | null;
    bloodPressureDia: number | null;
    spo2: number | null;
    temperature: number | null;
    bloodGlucose?: number | null;
    consciousness?: string | null;
    capillaryRefill?: number | null;
  };
  stages: ALiEMStage[];
}

export interface ALiEMStage {
  stage: number;
  name: string;
  ordered: boolean;
  severity: 'low' | 'moderate' | 'severe' | 'critical';
  TTIsec: number;
  requiredInterventions: string[];
  helpful: string[];
  harmful: string[];
  neutral: string[];
  vitalEffects: Record<string, {
    heartRate?: number;
    respRate?: number;
    bloodPressureSys?: number;
    bloodPressureDia?: number;
    spo2?: number;
    temperature?: number;
    bloodGlucose?: number;
    consciousness?: string | number;
    capillaryRefill?: number;
  }>;
}

// Load ALiEM cases from JSON file
function loadALiEMCases(): ALiEMCase[] {
  try {
    const casesPath = path.join(process.cwd(), 'server', 'data', 'caseBank.aliem.json');
    console.log('Loading ALiEM cases from:', casesPath);
    const casesData = fs.readFileSync(casesPath, 'utf8');
    const cases = JSON.parse(casesData);
    console.log(`Loaded ${cases.length} ALiEM cases`);
    return cases;
  } catch (error) {
    console.error('Failed to load ALiEM cases:', error);
    return [];
  }
}

// Load and export ALiEM cases
export const ALIEM_CASES = loadALiEMCases();

// Export ALiEM-specific functions
export function getALiEMCase(caseId: string): ALiEMCase | undefined {
  return ALIEM_CASES.find(c => c.id === caseId);
}

export function getALiEMCaseVariant(caseId: string, variantId: string): ALiEMVariant | undefined {
  const aliemCase = getALiEMCase(caseId);
  return aliemCase?.variants.find(v => v.variantId === variantId);
}

export function getAllALiEMCategories(): string[] {
  return Array.from(new Set(ALIEM_CASES.map(c => c.category)));
}

// Attribution helper
export function getCaseAttribution(caseId: string): {
  license: string;
  sourceVersion: string;
  sourceCitation: string;
} {
  const aliemCase = getALiEMCase(caseId);
  if (aliemCase) {
    return {
      license: aliemCase.license,
      sourceVersion: aliemCase.sourceVersion,
      sourceCitation: aliemCase.sourceCitation
    };
  }
  
  // Fallback for legacy cases
  return {
    license: 'CC BY-NC-SA 4.0',
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    sourceCitation: 'ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases'
  };
}

export default ALIEM_CASES;
