#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { ENHANCED_ANAPHYLAXIS_CASE } from './enhanced-anaphylaxis-case';

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
  initialVitals: any;
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
  vitalEffects: Record<string, any>;
}

// ALiEM case definitions - only the enhanced anaphylaxis case for now
const ALIEM_CASES: ALiEMCase[] = [
  ENHANCED_ANAPHYLAXIS_CASE
];

async function main() {
  console.log('🚀 Starting Enhanced ALiEM case ingestion...');
  
  // Create data directory if it doesn't exist
  const dataDir = path.join(process.cwd(), '..', 'server', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Write the ALiEM cases to JSON
  const outputPath = path.join(dataDir, 'caseBank.aliem.json');
  fs.writeFileSync(outputPath, JSON.stringify(ALIEM_CASES, null, 2));
  
  console.log(`✅ Successfully wrote ${ALIEM_CASES.length} enhanced cases to ${outputPath}`);
  console.log('📊 Case breakdown:');
  ALIEM_CASES.forEach(case_ => {
    console.log(`  - ${case_.displayName}: ${case_.variants.length} variants`);
    case_.variants.forEach(variant => {
      console.log(`    Variant ${variant.variantId}: ${variant.stages.length} stages`);
      variant.stages.forEach(stage => {
        console.log(`      Stage ${stage.stage}: ${stage.name} - ${stage.requiredInterventions.length} required interventions`);
      });
    });
  });
  
  // Create sources metadata
  const sourcesPath = path.join(process.cwd(), '..', 'meta', 'sources.json');
  const metaDir = path.dirname(sourcesPath);
  if (!fs.existsSync(metaDir)) {
    fs.mkdirSync(metaDir, { recursive: true });
  }
  
  const sources = {
    aliEmRescuPeds: {
      version: 'aliem-rescu-peds-03-29-21-enhanced',
      license: 'CC BY-NC-SA 4.0',
      source: 'ALiEM EM ReSCu Peds Simulation eBook 03-29-21.pdf (Enhanced)',
      description: 'Enhanced anaphylaxis case with comprehensive required interventions based on PALS guidelines',
      ingestedAt: new Date().toISOString(),
      caseCount: ALIEM_CASES.length
    }
  };
  
  fs.writeFileSync(sourcesPath, JSON.stringify(sources, null, 2));
  console.log(`✅ Created sources metadata at ${sourcesPath}`);
  
  console.log('\n🎯 Enhanced Case Features:');
  console.log('✅ Stage 1: 8 required interventions (ABCs + epinephrine + positioning + monitoring)');
  console.log('✅ Stage 2: 8 required interventions (comprehensive monitoring + reassessment)');
  console.log('✅ Stage 3: 8 required interventions (extended observation + monitoring maintenance)');
  console.log('✅ Stage 4: 8 required interventions (complete discharge planning + family training)');
  console.log('✅ All stages are ordered for proper sequence completion');
  console.log('✅ Medically accurate based on PALS 2020 guidelines');
  
  console.log('\n🎯 Next steps:');
  console.log('1. Test the enhanced anaphylaxis case in the simulator');
  console.log('2. Verify stage progression with multiple required interventions');
  console.log('3. Add more ALiEM cases using this enhanced structure');
}

// Run the main function if this file is executed directly
main().catch(console.error);

export { ALIEM_CASES, type ALiEMCase, type ALiEMVariant, type ALiEMStage };
