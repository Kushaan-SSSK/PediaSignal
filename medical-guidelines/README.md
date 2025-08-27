# Medical Guidelines Repository

This folder contains medical guidelines, protocols, and reference materials for PediaSignal AI.

## 🚀 **Simple Upload Process**

### **Step 1: Upload All PDFs to One Folder**
Simply place **ALL** your medical guideline PDFs in the `pdfs/` folder:
```
medical-guidelines/
└── pdfs/           # 📁 PUT ALL YOUR PDFS HERE
    ├── aliem-case-01-status-epilepticus.pdf
    ├── pals-basic-life-support.pdf
    ├── aap-fever-guidelines.pdf
    └── who-pediatric-emergency.pdf
```

### **Step 2: Run the Scanner**
The system automatically detects document types from filenames:
```bash
cd medical-guidelines
node upload-helper.js scan
```

### **Step 3: Review Generated Metadata**
Check the `metadata/` folder for automatically generated tracking information.

## 📁 **Folder Structure**

### `/pdfs/` - **Main Upload Folder**
- **Purpose**: Single location for all medical guideline PDFs
- **Content**: ALiEM cases, PALS guidelines, AAP guidelines, WHO guidelines
- **Usage**: Drag and drop all your PDFs here

### `/metadata/` - **Document Tracking**
- **Purpose**: Automatically generated metadata and tracking information
- **Content**: JSON files with document information, checksums, versions
- **Usage**: Generated automatically during document processing
- **Note**: Do not manually edit these files

### `/processed/` - **Processed Documents**
- **Purpose**: Chunked and processed text from uploaded PDFs
- **Content**: JSON files with extracted text, metadata, and embeddings
- **Usage**: Generated automatically during document processing
- **Note**: Do not manually edit these files

## 📝 **File Naming Convention**

The system automatically detects document types from filenames:

- **ALiEM**: `aliem-case-01-status-epilepticus.pdf` or `case-01-seizure.pdf`
- **PALS**: `pals-basic-life-support.pdf` or `pals-2020-algorithms.pdf`
- **AAP**: `aap-fever-guidelines.pdf` or `aap-2021-immunization.pdf`
- **WHO**: `who-pediatric-emergency.pdf` or `who-2020-respiratory.pdf`

## 🔍 **Automatic Detection**

The system recognizes document types by keywords in filenames:
- **ALiEM**: Contains "aliem", "rescu", "case", or "scenario"
- **PALS**: Contains "pals"
- **AAP**: Contains "aap"
- **WHO**: Contains "who"
- **Default**: Generic "Medical Guidelines" if no specific type detected

## 📋 **Upload Instructions**

1. **Prepare PDFs**: Ensure all documents are in English and readable
2. **Name Files**: Use descriptive names (the system will auto-detect types)
3. **Upload**: Place all PDFs in `medical-guidelines/pdfs/` folder
4. **Scan**: Run the document scanner to process everything
5. **Review**: Check generated metadata and customize if needed

## 🔄 **Processing Workflow**

1. **Upload**: Place PDFs in `pdfs/` folder
2. **Scan**: Run `node upload-helper.js scan`
3. **Auto-Detect**: System identifies document types from filenames
4. **Generate Metadata**: Creates tracking and attribution records
5. **Process**: Extract text and create chunks (coming in RAG upgrade)
6. **Index**: Generate embeddings and build knowledge base

## 📊 **What Gets Created**

After running the scanner:
- ✅ **Metadata Files**: One JSON file per PDF with tracking information
- ✅ **Document IDs**: Unique identifiers for each document
- ✅ **Checksums**: File integrity verification
- ✅ **Source Detection**: Automatic categorization by document type
- ✅ **License Tracking**: CC BY-NC-SA compliance for ALiEM content

## ⚠️ **Important Notes**

- **ALiEM License**: Must comply with CC BY-NC-SA 4.0 (non-commercial use only)
- **PHI**: Do not upload documents containing patient information
- **Source Verification**: Ensure documents are from legitimate, authoritative sources
- **File Integrity**: The scanner generates checksums to verify document integrity

## 🎯 **Next Steps**

After uploading documents:
1. Run the document scanner: `node upload-helper.js scan`
2. Review generated metadata in `metadata/` folder
3. Update topics, tags, and attribution information if needed
4. Run the RAG processing pipeline (coming next)
5. Test knowledge base functionality

## 🆘 **Need Help?**

- **Quick Start**: See `QUICK-START.md` for step-by-step instructions
- **Commands**: Run `node upload-helper.js help` for available options
- **Sample Structure**: Review `aliem/sample-case-structure.md` for examples
- **Dependencies**: Ensure `npm install` has been run

---

**Status**: ✅ Ready for PDF uploads (single folder workflow)
**Next Phase**: Document processing and RAG implementation
