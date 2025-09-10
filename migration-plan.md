# MedRAG Integration Migration Plan

## Executive Summary

This migration plan documents the complete replacement of the existing RAG stack with MedRAG integration, including the proprietary **ProofPath™ evidence tracking** feature. The migration removes all legacy RAG components and introduces a clean, scalable architecture with FastAPI microservice and TypeScript client integration.

---

## Pre-Migration Audit Results

### Found RAG Components (REMOVED)

#### Directories:
- `server/rag/` - **REMOVED** - Complete legacy RAG implementation

#### Files Removed:
- `server/rag/compose.ts` - LLM composition with GPT-4 for grounded explanations
- `server/rag/retriever.ts` - Hybrid BM25 + embedding retrieval system  
- `server/rag/pubmed.ts` - PubMed API integration
- `server/rag/schemas.ts` - Zod validation schemas
- `server/rag/security.ts` - Security layer with PHI redaction
- `server/rag/ingestAliem.ts` - ALiEM document ingestion
- `server/rag/initKnowledgeBase.ts` - Knowledge base initialization
- `server/rag/test-rag.js` - RAG testing utility

#### Dependencies (Status):
- `openai: ^5.10.2` - **KEPT** - Still needed for MedRAG
- `cheerio: ^1.1.2` - **KEPT** - May be useful for document processing
- `pdf-parse: ^1.1.1` - **KEPT** - May be useful for MedRAG
- `pdf-lib: ^1.17.1` - **KEPT** - May be useful for MedRAG

#### Call Sites to Update:
- `server/routes.ts` lines: 665-669, 859, 905-907, 957-961, 1036, 1255, 1288, 1294, 1371
- `server/index.ts` line: 48 (RAG initialization)
- Client components using `/api/rag/*` endpoints

---

## New Architecture Components

### Added Files:

#### MedRAG Integration:
- `MedRAG-main/` - Vendored MedRAG repository (submodule/download)
- `services/medrag/main.py` - FastAPI wrapper service with ProofPath™
- `services/medrag/requirements.txt` - Python dependencies 
- `services/medrag/.env.example` - Configuration template
- `services/medrag/Dockerfile` - Container configuration
- `services/medragClient.ts` - TypeScript client with backward compatibility

#### Documentation:
- `migration-plan.md` - This migration plan
- `docs/medrag.md` - Technical documentation (to be created)
- `docs/proofpath.md` - ProofPath™ feature documentation (to be created)

---

## Step-by-Step Migration Instructions

### Prerequisites
1. Ensure Python 3.9+ is installed
2. Ensure Node.js and npm are available  
3. Obtain OpenAI API key
4. Have Java installed (required for BM25 in MedRAG)

### Phase 1: Environment Setup

```bash
# 1. Navigate to MedRAG service directory
cd services/medrag

# 2. Create Python virtual environment
python -m venv medrag_env
source medrag_env/bin/activate  # On Windows: medrag_env\Scripts\activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Copy and configure environment
cp .env.example .env
# Edit .env with your OpenAI API key and configuration
```

### Phase 2: MedRAG Service Startup

```bash
# 1. Start the MedRAG FastAPI service
cd services/medrag
python main.py

# Service will start on http://localhost:8000
# Health check: curl http://localhost:8000/health
```

### Phase 3: Backend Integration

```bash
# 1. Install TypeScript client dependencies (if new ones needed)
npm install

# 2. Update environment variables
echo "MEDRAG_SERVICE_URL=http://localhost:8000" >> .env
echo "MEDRAG_TIMEOUT=30000" >> .env  
echo "MEDRAG_MAX_RETRIES=3" >> .env
```

### Phase 4: Database Migration (if needed)

```bash
# Legacy RAG tables can be dropped if no longer needed:
# DROP TABLE IF EXISTS kb_passages;
# DROP TABLE IF EXISTS kb_queries; # May keep for telemetry

# Note: Consider backing up existing RAG data before dropping tables
```

### Phase 5: Application Restart

```bash
# 1. Restart the main application server
npm run build  # or your build command
npm start      # or your start command

# 2. Verify integration
curl http://localhost:3000/api/rag/clinical-guidance -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the signs of anaphylaxis?"}'
```

---

## Environment Variables

### Required:
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# MedRAG Service
MEDRAG_SERVICE_URL=http://localhost:8000
MEDRAG_TIMEOUT=30000
MEDRAG_MAX_RETRIES=3
```

### Optional ProofPath™ Configuration:
```bash
# ProofPath™ Evidence Tracking
PROOFPATH_ENABLED=true
PROOFPATH_MAX_PASSAGES=32
PROOFPATH_LOGGING_LEVEL=INFO
```

---

## API Changes

### Legacy Endpoints (Updated):
- `POST /api/rag/clinical-guidance` - **UPDATED** - Now uses MedRAG service
- `POST /api/rag/query` - **UPDATED** - Now uses MedRAG service  
- `GET /api/rag/stats` - **UPDATED** - Now returns MedRAG service stats
- `POST /api/rag/clear-cache` - **UPDATED** - Now clears MedRAG service cache

### New Endpoints:
- `GET /api/medrag/health` - MedRAG service health check
- `POST /api/medrag/query` - Direct MedRAG query endpoint
- `POST /api/medrag/ablate` - ProofPath™ counterfactual queries

### Response Format Changes:

#### Before (Legacy RAG):
```json
{
  "answer": "Clinical response",
  "sources": ["source1", "source2"],
  "confidence": 0.85
}
```

#### After (MedRAG with ProofPath™):
```json
{
  "answer": "Clinical response",
  "contexts": [{"title": "...", "content": "...", "source": "..."}],
  "citations": ["citation1", "citation2"],
  "latency_ms": 1250,
  "model_info": "OpenAI/gpt-3.5-turbo-16k",
  "evidence_trail": [
    {
      "id": "passage_0",
      "source_id": "doc_123",
      "title": "Clinical Guidelines",
      "similarity": 0.92,
      "weight": 0.85
    }
  ],
  "answer_confidence": 0.87,
  "proofpath_meta": {
    "retriever_params": {"name": "MedCPT", "corpus": "Textbooks", "k": 32},
    "generator_params": {"model": "OpenAI/gpt-3.5-turbo-16k"},
    "latency_ms": {"retrieve": 800, "generate": 450},
    "token_counts": {"context": 2048, "output": 156}
  }
}
```

---

## Testing Strategy

### Unit Tests:
```bash
# Test MedRAG client
npm test services/medragClient.test.ts

# Test FastAPI service  
cd services/medrag && python -m pytest tests/
```

### Integration Tests:
```bash
# End-to-end RAG query test
npm run test:integration

# ProofPath™ ablation test
curl -X POST http://localhost:8000/ablate \
  -H "Content-Type: application/json" \
  -d '{"query": "Test query", "ablate": ["passage_0"]}'
```

### Smoke Tests:
```bash
# 1. Health check
curl http://localhost:8000/health

# 2. Simple query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What causes chest pain?"}'

# 3. Multiple choice query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Which medication is first-line for anaphylaxis?",
    "options": {"A": "Diphenhydramine", "B": "Epinephrine", "C": "Albuterol"}
  }'
```

---

## Rollback Plan

### Emergency Rollback (if critical issues):
```bash
# 1. Switch to previous branch
git checkout main

# 2. Restart services  
npm start

# 3. Disable ProofPath™ if needed
export PROOFPATH_ENABLED=false
```

### Gradual Rollback:
```bash
# 1. Disable MedRAG service calls
export MEDRAG_SERVICE_URL=""

# 2. Implement fallback to previous logic
# (Legacy RAG code preserved in git history)

# 3. Monitor error rates and performance
```

---

## Performance Expectations

### Latency Targets:
- Simple queries: < 2 seconds  
- Complex queries with ProofPath™: < 5 seconds
- Health checks: < 100ms

### Throughput:
- Expected: 10-50 concurrent requests
- Max: 100 requests/minute per instance

### Resource Usage:
- MedRAG service: ~2GB RAM, 1-2 CPU cores
- Disk: ~5GB for corpus data
- Network: ~1MB per query (model downloads)

---

## Security & Compliance

### PHI Protection:
- Input sanitization for PHI patterns (SSN, email, etc.)
- Logging redaction for sensitive data
- No secrets stored in repository

### Rate Limiting:
- 100 requests/minute per IP
- 1000 requests/hour per user session

### Monitoring:
- Request/response logging (sanitized)
- Error rate tracking
- Performance metrics collection

---

## Troubleshooting

### Common Issues:

#### "MedRAG service not initialized"
- Check Python dependencies: `pip list`
- Verify OpenAI API key in `.env`
- Check service logs: `tail -f services/medrag/medrag_service.log`

#### "Connection refused to MedRAG service"  
- Ensure service is running: `curl http://localhost:8000/health`
- Check port conflicts: `netstat -tulpn | grep 8000`
- Verify firewall settings

#### "ProofPath™ features not working"
- Check `PROOFPATH_ENABLED=true` in environment
- Verify request includes `ablate` parameter for counterfactuals
- Check ProofPath™ logs for errors

#### Performance Issues:
- Check corpus cache is enabled: `MEDRAG_CORPUS_CACHE=true`
- Monitor memory usage during queries
- Consider reducing `k` parameter for fewer retrieved passages

---

## Support & Documentation

### Additional Resources:
- MedRAG GitHub: https://github.com/Teddy-XiongGZ/MedRAG  
- FastAPI Documentation: https://fastapi.tiangolo.com/
- Internal docs: `docs/medrag.md`, `docs/proofpath.md`

### Contact:
- For migration issues: Check this plan and troubleshooting section
- For ProofPath™ questions: See `docs/proofpath.md`
- For MedRAG core issues: Refer to upstream repository

---

## Migration Completion Checklist

- [x] Legacy RAG components removed
- [x] MedRAG service implemented with FastAPI  
- [x] TypeScript client created with backward compatibility
- [x] ProofPath™ evidence tracking implemented
- [ ] All call sites updated to use new client
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Smoke tests successful
- [ ] Performance benchmarks met

**Migration Status: IN PROGRESS**  
**Next Steps: Update remaining call sites and run integration tests**