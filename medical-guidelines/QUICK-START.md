# Quick Start Guide - Medical Guidelines Upload

## 🚀 **Get Started in 2 Simple Steps**

### **Step 1: Upload ALL PDFs to One Folder**
Simply drag and drop **ALL** your medical guideline PDFs into:
```
medical-guidelines/pdfs/
```

**File Naming Examples:**
- `aliem-case-01-status-epilepticus.pdf` → ALiEM case
- `pals-basic-life-support.pdf` → PALS guidelines
- `aap-fever-guidelines.pdf` → AAP guidelines
- `who-pediatric-emergency.pdf` → WHO guidelines

**💡 Pro Tip:** The system automatically detects document types from filenames, so just use descriptive names!

### **Step 2: Run the Scanner**
The system will automatically process all your PDFs and generate metadata:

**Windows:**
```cmd
cd medical-guidelines
scan-documents.bat
```

**PowerShell:**
```powershell
cd medical-guidelines
.\scan-documents.ps1
```

**Node.js:**
```bash
cd medical-guidelines
node upload-helper.js scan
```

## 📁 **What Gets Created**

After running the scanner:
- ✅ **Metadata files** for each PDF in `metadata/` folder
- ✅ **Document tracking** and checksums
- ✅ **Processing status** tracking
- ✅ **License and attribution** records
- ✅ **Automatic categorization** by document type

## 🔍 **Available Commands**

```bash
# Scan all PDFs and generate metadata
node upload-helper.js scan

# List all found PDF files
node upload-helper.js list

# Show help
node upload-helper.js help
```

## 📋 **Next Steps After Upload**

1. **Review Metadata**: Check generated JSON files in `metadata/` folder
2. **Customize Tags**: Add relevant topics and tags for each document
3. **Verify Licensing**: Ensure proper attribution and license compliance
4. **Process Documents**: Run the RAG processing pipeline (coming next)
5. **Test Knowledge Base**: Verify document retrieval and search functionality

## ⚠️ **Important Notes**

- **ALiEM License**: Must comply with CC BY-NC-SA 4.0 (non-commercial use only)
- **PHI**: Do not upload documents containing patient information
- **Source Verification**: Ensure documents are from legitimate, authoritative sources
- **File Integrity**: The scanner generates checksums to verify document integrity

## 🔍 **How Auto-Detection Works**

The system recognizes document types by keywords in filenames:
- **ALiEM**: Contains "aliem", "rescu", "case", or "scenario"
- **PALS**: Contains "pals"
- **AAP**: Contains "aap"
- **WHO**: Contains "who"
- **Default**: Generic "Medical Guidelines" if no specific type detected

## 🆘 **Need Help?**

- Check the main `README.md` for detailed information
- Review `aliem/sample-case-structure.md` for ALiEM case examples
- Use `upload-helper.js help` for command options
- Ensure all dependencies are installed (`npm install`)

## 🎯 **Ready for RAG?**

Once you've uploaded and processed your documents:
1. The system will extract text and create chunks
2. Generate vector embeddings for semantic search
3. Build the knowledge base for RAG functionality
4. Enable evidence-based explanations in simulations

---

**Status**: ✅ Ready for PDF uploads (single folder workflow)
**Next Phase**: Document processing and RAG implementation

## 📁 **Simple Folder Structure**

```
medical-guidelines/
├── pdfs/           # 📁 PUT ALL YOUR PDFS HERE
├── metadata/       # Generated metadata files
├── processed/      # Processed document chunks
├── README.md       # This documentation
├── QUICK-START.md  # This quick start guide
└── upload-helper.js # Helper script
```

**That's it! Just put all PDFs in the `pdfs` folder and run the scanner.**
