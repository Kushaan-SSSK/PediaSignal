#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { COMPLETE_ALIEM_CASES } from './complete-aliem-cases';

async function main() {
  console.log('🚀 Starting ALiEM case ingestion...');

  // Create data directory if it doesn't exist
  const dataDir = path.join(process.cwd(), 'server', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Write the ALiEM cases to JSON
  const outputPath = path.join(dataDir, 'caseBank.aliem.json');
  fs.writeFileSync(outputPath, JSON.stringify(COMPLETE_ALIEM_CASES, null, 2));

  console.log(`✅ Successfully wrote ${COMPLETE_ALIEM_CASES.length} cases to ${outputPath}`);
  console.log('📊 Case breakdown:');
  COMPLETE_ALIEM_CASES.forEach(case_ => {
    // Check if variants exist before accessing length
    const variantCount = case_.variants ? case_.variants.length : 0;
    console.log(`  - ${case_.displayName}: ${variantCount} variants`);
  });

  // Create sources metadata
  const sourcesPath = path.join(process.cwd(), 'meta', 'sources.json');
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
      caseCount: COMPLETE_ALIEM_CASES.length
    }
  };

  fs.writeFileSync(sourcesPath, JSON.stringify(sources, null, 2));
  console.log(`✅ Created sources metadata at ${sourcesPath}`);

  console.log('\n🎯 Next steps:');
  console.log('1. Verify server/data/caseBank.aliem.json content');
  console.log('2. Update server/caseBank.ts to export ALiEM cases');
  console.log('3. Test the new case system in the simulator');
}

// Run the main function if this file is executed directly
main().catch(console.error);
