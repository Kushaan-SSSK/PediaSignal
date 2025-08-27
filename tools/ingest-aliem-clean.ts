#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { COMPLETE_ALIEM_CASES } from './complete-aliem-cases';

interface ALiEMCase {
  id: string;
  category: string;
  displayName: string;
  name: string;
  description: string;
  sourceVersion: string;
  license: string;
  sourceCitation: string;
  difficulty: string;
  estimatedTime: string;
  stages: number;
  presentingSymptoms: string[];
  clinicalHistory: string;
  variants: ALiEMVariant[];
}

interface ALiEMVariant {
  variantId: string;
  ageBand: string;
  ageYears: number;
  weightKg: number;
  initialVitals: any;
  stages: ALiEMStage[];
}

interface ALiEMStage {
  stage: number;
  name: string;
  ordered: boolean;
  severity: 'low' | 'moderate' | 'severe' | 'critical';
  TTIsec: number;
  requiredInterventions: string[];
  helpful: string[];
  harmful: string[];
  neutral: string[];
  vitalEffects: Record<string, any>;
}

// Use the complete ALiEM cases
const ALIEM_CASES: ALiEMCase[] = COMPLETE_ALIEM_CASES;

// ============================================================================
// OUTPUT GENERATION
// ============================================================================

const outputPath = path.join(process.cwd(), 'server', 'data', 'caseBank.aliem.json');
const sourcesPath = path.join(process.cwd(), 'meta', 'sources.json');

// Ensure output directories exist
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sourcesDir = path.dirname(sourcesPath);
if (!fs.existsSync(sourcesDir)) {
  fs.mkdirSync(sourcesDir, { recursive: true });
}

// Write ALiEM cases to JSON
fs.writeFileSync(outputPath, JSON.stringify(ALIEM_CASES, null, 2));
console.log(`✅ Successfully wrote ${ALIEM_CASES.length} cases to ${outputPath}`);

// Generate sources metadata
const sources = {
  aliem: {
    version: "aliem-rescu-peds-03-29-21",
    license: "CC BY-NC-SA 4.0",
    source: "ALiEM EM ReSCu Peds Simulation eBook 03-29-21",
    citation: "ALiEM EM ReSCu Peds Simulation eBook 03-29-21 (CC BY-NC-SA 4.0)",
    cases: ALIEM_CASES.map(case_ => ({
      id: case_.id,
      category: case_.category,
      name: case_.displayName,
      sourceCitation: case_.sourceCitation
    })),
    caseCount: ALIEM_CASES.length
  }
};

fs.writeFileSync(sourcesPath, JSON.stringify(sources, null, 2));
console.log(`✅ Successfully wrote sources metadata to ${sourcesPath}`);

// Display summary
console.log('\n📊 ALiEM Case Summary:');
console.log(`Total Cases: ${ALIEM_CASES.length}`);
console.log('\nCategories:');
const categories = Array.from(new Set(ALIEM_CASES.map(c => c.category)));
categories.forEach(category => {
  const caseCount = ALIEM_CASES.filter(c => c.category === category).length;
  console.log(`  ${category}: ${caseCount} case(s)`);
});

console.log('\n🎯 Next Steps:');
console.log('1. Restart the server to load new cases');
console.log('2. Test case selection page');
console.log('3. Test simulation functionality');

export { ALIEM_CASES, type ALiEMCase, type ALiEMVariant, type ALiEMStage };
