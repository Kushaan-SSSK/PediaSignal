#!/usr/bin/env node

/**
 * Medical Guidelines Upload Helper
 * 
 * This script helps with uploading and processing medical guideline documents.
 * Run with: node upload-helper.js
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const GUIDELINES_DIR = path.join(__dirname);
const PDFS_DIR = path.join(GUIDELINES_DIR, 'pdfs');
const METADATA_DIR = path.join(GUIDELINES_DIR, 'metadata');
const PROCESSED_DIR = path.join(GUIDELINES_DIR, 'processed');

// Ensure directories exist
[GUIDELINES_DIR, PDFS_DIR, METADATA_DIR, PROCESSED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Determine document source based on filename
 */
function detectSource(filename) {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('aliem') || lowerFilename.includes('rescu')) {
    return 'ALiEM EM ReSCu Peds';
  } else if (lowerFilename.includes('pals')) {
    return 'PALS Guidelines';
  } else if (lowerFilename.includes('aap')) {
    return 'AAP Guidelines';
  } else if (lowerFilename.includes('who')) {
    return 'WHO Guidelines';
  } else if (lowerFilename.includes('case') || lowerFilename.includes('scenario')) {
    return 'ALiEM EM ReSCu Peds'; // Default cases to ALiEM
  } else {
    return 'Medical Guidelines'; // Generic fallback
  }
}

/**
 * Generate SHA256 checksum for a file
 */
function generateChecksum(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Get file information
 */
function getFileInfo(filePath) {
  const stats = fs.statSync(filePath);
  return {
    filename: path.basename(filePath),
    fileSize: stats.size,
    uploadDate: new Date().toISOString().split('T')[0],
    checksum: generateChecksum(filePath)
  };
}

/**
 * Create metadata for a document
 */
function createMetadata(filePath, additionalInfo = {}) {
  const fileInfo = getFileInfo(filePath);
  const filename = path.basename(filePath, '.pdf');
  const source = detectSource(fileInfo.filename);
  
  // Extract case information from filename if it's ALiEM
  let caseId = null;
  let stage = 1;
  
  if (source.toLowerCase().includes('aliem')) {
    const match = filename.match(/case-(\d+)/i) || filename.match(/aliem-(\d+)/i);
    if (match) {
      caseId = `aliem-case-${match[1].padStart(2, '0')}`;
    }
  }
  
  const metadata = {
    documentId: `${source.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`,
    filename: fileInfo.filename,
    title: filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    source: source,
    version: new Date().getFullYear().toString(),
    license: source.toLowerCase().includes('aliem') ? 'CC BY-NC-SA 4.0' : 'Check source license',
    uploadDate: fileInfo.uploadDate,
    uploadedBy: process.env.USERNAME || 'unknown',
    checksum: fileInfo.checksum,
    fileSize: fileInfo.fileSize,
    pageCount: null, // Will be updated during processing
    language: 'en',
    topics: [],
    tags: [],
    caseId: caseId,
    stage: stage,
    sections: ['objectives', 'critical_actions', 'debrief', 'actor_prompts', 'pitfalls'],
    processingStatus: 'pending',
    processedDate: null,
    chunkCount: null,
    embeddingStatus: 'pending',
    qualityScore: null,
    notes: '',
    attribution: {
      authors: [],
      publication: source,
      year: new Date().getFullYear(),
      url: ''
    },
    ...additionalInfo
  };
  
  return metadata;
}

/**
 * Save metadata to file
 */
function saveMetadata(metadata, filePath) {
  const metadataPath = path.join(METADATA_DIR, `${metadata.documentId}.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`✅ Metadata saved: ${metadataPath}`);
  return metadataPath;
}

/**
 * List all PDF files in the pdfs directory
 */
function listPDFs() {
  if (!fs.existsSync(PDFS_DIR)) {
    return [];
  }
  
  const files = fs.readdirSync(PDFS_DIR);
  const pdfs = [];
  
  files.forEach(file => {
    if (file.toLowerCase().endsWith('.pdf')) {
      pdfs.push({
        filepath: path.join(PDFS_DIR, file),
        filename: file
      });
    }
  });
  
  return pdfs;
}

/**
 * Process all PDFs and generate metadata
 */
function processAllPDFs() {
  console.log('🔍 Scanning for PDF files in pdfs folder...\n');
  
  const pdfs = listPDFs();
  
  if (pdfs.length === 0) {
    console.log('❌ No PDF files found in medical-guidelines/pdfs/ folder.');
    console.log('\n📁 To get started:');
    console.log('1. Place all your medical guideline PDFs in the medical-guidelines/pdfs/ folder');
    console.log('2. Run this script again to process them');
    console.log('\n💡 File naming tips:');
    console.log('   - aliem-case-01-status-epilepticus.pdf');
    console.log('   - pals-basic-life-support.pdf');
    console.log('   - aap-fever-guidelines.pdf');
    console.log('   - who-pediatric-emergency.pdf');
    return;
  }
  
  console.log(`📚 Found ${pdfs.length} PDF file(s):\n`);
  
  pdfs.forEach(({ filepath, filename }) => {
    console.log(`📄 Processing: ${filename}`);
    
    try {
      const metadata = createMetadata(filepath);
      const metadataPath = saveMetadata(metadata, filepath);
      
      console.log(`   └─ Source: ${metadata.source}`);
      console.log(`   └─ Document ID: ${metadata.documentId}`);
      console.log(`   └─ Checksum: ${metadata.checksum.substring(0, 8)}...`);
      console.log(`   └─ Status: ${metadata.processingStatus}\n`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${filename}: ${error.message}\n`);
    }
  });
  
  console.log('🎯 Next steps:');
  console.log('1. Review generated metadata files in medical-guidelines/metadata/');
  console.log('2. Update metadata with specific topics, tags, and attribution');
  console.log('3. Run the document processing pipeline to extract text and generate embeddings');
  console.log('4. Verify knowledge base population and test RAG functionality');
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Medical Guidelines Upload Helper

Usage:
  node upload-helper.js [command]

Commands:
  scan          Scan for PDFs and generate metadata (default)
  list          List all found PDF files
  help          Show this help message

Examples:
  node upload-helper.js scan
  node upload-helper.js list

Simple Workflow:
  1. Place ALL your PDF files in medical-guidelines/pdfs/ folder
  2. Run: node upload-helper.js scan
  3. The script automatically detects document types from filenames
  4. Review generated metadata in medical-guidelines/metadata/

File Naming Examples:
  - aliem-case-01-status-epilepticus.pdf  → ALiEM case
  - pals-basic-life-support.pdf           → PALS guidelines
  - aap-fever-guidelines.pdf              → AAP guidelines
  - who-pediatric-emergency.pdf           → WHO guidelines

Directory Structure:
  medical-guidelines/
  ├── pdfs/           # 📁 PUT ALL YOUR PDFS HERE
  ├── metadata/       # Generated metadata files
  └── processed/      # Processed document chunks
`);
}

// Main execution
const command = process.argv[2] || 'scan';

switch (command) {
  case 'scan':
    processAllPDFs();
    break;
  case 'list':
    const pdfs = listPDFs();
    if (pdfs.length > 0) {
      console.log('📚 Found PDF files in pdfs folder:');
      pdfs.forEach(({ filename }) => {
        console.log(`  📄 ${filename}`);
      });
    } else {
      console.log('❌ No PDF files found in pdfs folder.');
      console.log('Place your PDFs in medical-guidelines/pdfs/ and run scan again.');
    }
    break;
  case 'help':
  default:
    showHelp();
    break;
}
