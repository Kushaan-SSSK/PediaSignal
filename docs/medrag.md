# MedRAG Integration Documentation

## Overview

This document describes the MedRAG integration in PediaSignal, including the FastAPI microservice architecture and **ProofPath™** evidence tracking feature. MedRAG (Medical Retrieval-Augmented Generation) provides state-of-the-art medical question answering with evidence-based responses.

---

## Architecture

### Components

1. **MedRAG Core** (`MedRAG-main/`): Vendored MedRAG repository with medical RAG capabilities
2. **FastAPI Service** (`services/medrag/main.py`): Microservice wrapper around MedRAG
3. **TypeScript Client** (`services/medragClient.ts`): Backend client for calling the MedRAG service
4. **Legacy Integration**: Updated call sites throughout the application

### Data Flow

```
Client Request → Routes → TypeScript Client → FastAPI Service → MedRAG Core → Response
```

---

## FastAPI Service API

### Base URL
```
http://localhost:8000
```

### Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "medrag_initialized": true,
  "proofpath_enabled": true
}
```

#### Query Endpoint
```http
POST /query
```

**Request Body:**
```json
{
  "query": "What are the signs of anaphylaxis?",
  "options": {
    "A": "Hives and swelling",
    "B": "Just difficulty breathing", 
    "C": "Only low blood pressure"
  },
  "k": 32,
  "temperature": 0.0,
  "ablate": ["passage_id_1", "source_id_2"]
}
```

**Response:**
```json
{
  "answer": "Anaphylaxis presents with multiple system involvement...",
  "contexts": [
    {
      "title": "Anaphylaxis Guidelines",
      "content": "Detailed clinical information...",
      "source": "guideline_001"
    }
  ],
  "citations": ["Anaphylaxis Guidelines - guideline_001"],
  "latency_ms": 1250,
  "model_info": "OpenAI/gpt-3.5-turbo-16k",
  "evidence_trail": [
    {
      "id": "passage_0",
      "source_id": "guideline_001",
      "title": "Anaphylaxis Guidelines",
      "similarity": 0.92,
      "weight": 0.85,
      "doc_url": "https://example.com/guidelines",
      "published_at": "2023-01-15",
      "span": "chars_0_150",
      "recency_signal": 0.95
    }
  ],
  "answer_confidence": 0.87,
  "proofpath_meta": {
    "retriever_params": {
      "name": "MedCPT",
      "corpus": "Textbooks",
      "k": 32
    },
    "generator_params": {
      "model": "OpenAI/gpt-3.5-turbo-16k",
      "temperature": 0.0
    },
    "latency_ms": {
      "retrieve": 800,
      "generate": 450,
      "postprocess": 50
    },
    "token_counts": {
      "prompt": 150,
      "context": 2048,
      "output": 156
    },
    "warnings": []
  },
  "counterfactual_note": "Excluded 2 passages based on ablation criteria: passage_id_1, source_id_2"
}
```

#### Ablation Endpoint (ProofPath™)
```http
POST /ablate
```

Same as `/query` but requires the `ablate` parameter for counterfactual analysis.

---

## ProofPath™ Evidence Tracking

### Overview

**ProofPath™** is our proprietary evidence tracking system that provides:

1. **Evidence Trail**: Ranked passages with contribution weights
2. **Answer Confidence**: Algorithmic confidence scoring
3. **Counterfactual Analysis**: "What-if" scenarios by excluding sources

### Features

#### Evidence Trail
Each retrieved passage includes:
- **ID**: Unique passage identifier
- **Source ID**: Document/source identifier  
- **Similarity**: Retrieval similarity score (0-1)
- **Weight**: Contribution weight to final answer (0-1)
- **Metadata**: Title, URL, publication date, text span

#### Confidence Scoring
Answer confidence is calculated using:
- Top-k score distribution and variance
- Retrieval density and agreement
- Source diversity and recency

Formula:
```
confidence = base_confidence - variance_penalty
where base_confidence = normalized_mean_score
      variance_penalty = min(0.3, score_variance * 2)
```

#### Counterfactual Analysis
Enable "what-if" analysis by excluding specific sources:

```javascript
const result = await medragClient.askMedRAGWithAblation(
  "What causes chest pain?",
  ["high_weight_source_id"], // Sources to exclude
  { k: 32 }
);

console.log(result.counterfactual_note);
// "Excluded 1 passages based on ablation criteria: high_weight_source_id"
```

---

## TypeScript Client Usage

### Basic Usage

```javascript
import { getMedRAGClient } from './services/medragClient';

const client = getMedRAGClient();

// Basic query
const result = await client.askMedRAG("What are symptoms of pneumonia?");
console.log(result.answer);

// Multiple choice
const mcResult = await client.askMedRAGMultipleChoice(
  "First-line treatment for anaphylaxis?",
  {
    "A": "Diphenhydramine",
    "B": "Epinephrine", 
    "C": "Albuterol"
  }
);

// ProofPath™ ablation
const ablatedResult = await client.askMedRAGWithAblation(
  "How to treat dehydration?",
  ["outdated_guideline_id"]  // Exclude this source
);
```

### Legacy Compatibility

```javascript
// These functions still work for backward compatibility
import { askMedRag, retrievePassages, composeGroundedExplanation } from './services/medragClient';

const answer = await askMedRag("Medical question");
const passages = await retrievePassages("Search query", 10);
const explanation = await composeGroundedExplanation("Complex medical scenario");
```

### Error Handling

```javascript
import { MedRAGError, MedRAGServiceUnavailableError, MedRAGTimeoutError } from './services/medragClient';

try {
  const result = await client.askMedRAG("Medical question");
} catch (error) {
  if (error instanceof MedRAGServiceUnavailableError) {
    console.error("MedRAG service is down");
  } else if (error instanceof MedRAGTimeoutError) {
    console.error("Request timed out");
  } else if (error instanceof MedRAGError) {
    console.error(`MedRAG error: ${error.message}`, error.details);
  }
}
```

---

## Configuration

### Environment Variables

#### Required
```bash
OPENAI_API_KEY=your_openai_api_key_here
MEDRAG_SERVICE_URL=http://localhost:8000
```

#### Optional Service Configuration
```bash
MEDRAG_LLM_NAME=OpenAI/gpt-3.5-turbo-16k
MEDRAG_RETRIEVER_NAME=MedCPT
MEDRAG_CORPUS_NAME=Textbooks
MEDRAG_DB_DIR=./corpus
MEDRAG_CORPUS_CACHE=true
MEDRAG_PORT=8000
MEDRAG_TIMEOUT=30000
MEDRAG_MAX_RETRIES=3
```

#### ProofPath™ Configuration
```bash
PROOFPATH_ENABLED=true
PROOFPATH_MAX_PASSAGES=32
PROOFPATH_LOGGING_LEVEL=INFO
```

### Supported Models

#### Language Models
- OpenAI: `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`
- Google: `gemini-pro`, `gemini-1.5-pro`
- Open Source: `mixtral`, `llama2`, `llama3`, `meditron-70b`, `pmc-llama`

#### Retrievers
- **MedCPT**: Medical domain-adapted retriever (recommended)
- **BM25**: Traditional term-based retrieval
- **Contriever**: Dense passage retrieval
- **SPECTER**: Scientific document retriever
- **RRF-2/RRF-4**: Reciprocal rank fusion combinations

#### Corpora
- **Textbooks**: Medical textbooks and reference materials
- **PubMed**: Biomedical literature abstracts
- **StatPearls**: Clinical reference encyclopedia
- **Wikipedia**: General medical knowledge
- **MedCorp**: Combined medical corpus

---

## Deployment

### Development Setup

1. **Install Dependencies:**
```bash
cd services/medrag
pip install -r requirements.txt
```

2. **Configure Environment:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Start Service:**
```bash
python main.py
```

4. **Verify Health:**
```bash
curl http://localhost:8000/health
```

### Docker Deployment

```bash
cd services/medrag
docker build -t medrag-service .
docker run -p 8000:8000 --env-file .env medrag-service
```

### Production Considerations

#### Scaling
- Use process managers like gunicorn/uvicorn workers
- Consider multiple service instances behind load balancer
- Monitor memory usage (MedRAG models are memory-intensive)

#### Security
- API key management (never commit to repo)
- Rate limiting and request validation
- PHI/PII redaction in logs
- Network security between services

#### Monitoring
- Health check endpoints for load balancers
- Latency and error rate metrics
- ProofPath™ confidence score distributions
- Resource usage (memory, CPU, disk)

---

## Performance

### Latency Expectations
- Simple queries: < 2 seconds
- Complex queries with ProofPath™: < 5 seconds  
- Health checks: < 100ms

### Throughput
- Expected: 10-50 concurrent requests
- Maximum: 100 requests/minute per instance

### Resource Requirements
- **Memory**: 2-4GB RAM (depends on model size)
- **Storage**: 5-10GB for corpus data
- **Network**: ~1MB per query for model inference

### Optimization Tips

1. **Enable Corpus Caching:**
```bash
MEDRAG_CORPUS_CACHE=true
```

2. **Tune Retrieval Parameters:**
```bash
# Reduce k for faster queries
k=16  # instead of 32

# Use faster retriever for simple queries
MEDRAG_RETRIEVER_NAME=BM25  # instead of MedCPT
```

3. **Model Selection:**
```bash
# Use faster model for development
MEDRAG_LLM_NAME=OpenAI/gpt-3.5-turbo  # instead of gpt-4
```

---

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
tail -f services/medrag/medrag_service.log

# Verify Python dependencies
pip list | grep -E "(fastapi|openai|transformers)"

# Test API key
python -c "import openai; print('API key works')"
```

#### High Latency
```bash
# Check corpus cache
ls -la ./corpus/cache/

# Monitor resource usage  
htop

# Reduce k parameter
# Use BM25 retriever for development
```

#### Memory Issues
```bash
# Check available memory
free -h

# Disable corpus caching if needed
MEDRAG_CORPUS_CACHE=false

# Use smaller model
MEDRAG_LLM_NAME=OpenAI/gpt-3.5-turbo
```

#### ProofPath™ Not Working
```bash
# Verify environment variable
echo $PROOFPATH_ENABLED

# Check service response
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

### Error Codes

- **503**: Service not initialized (check MedRAG setup)
- **500**: Internal service error (check logs)
- **422**: Invalid request parameters
- **408**: Request timeout (increase timeout or optimize query)

---

## API Migration Guide

### Before (Legacy RAG)
```javascript
// Old approach
const { retrievePassages } = require('./rag/retriever');
const result = await retrievePassages({query: "question", k: 10});
```

### After (MedRAG + ProofPath™) 
```javascript
// New approach with ProofPath™
import { getMedRAGClient } from './services/medragClient';
const client = getMedRAGClient();
const result = await client.askMedRAG("question", {k: 10});

// Access evidence trail and confidence
console.log(`Confidence: ${result.answer_confidence}`);
result.evidence_trail?.forEach(evidence => {
  console.log(`${evidence.title}: weight ${evidence.weight}`);
});
```

### Response Format Changes

| Field | Legacy RAG | MedRAG + ProofPath™ |
|-------|------------|-------------------|
| Answer | `answer` | `answer` |
| Sources | `sources[]` | `contexts[]` + `citations[]` |
| Confidence | `confidence` | `answer_confidence` |
| Evidence | ❌ | `evidence_trail[]` |
| Metadata | Basic | `proofpath_meta{}` |
| Ablation | ❌ | `counterfactual_note` |

---

## Testing

### Unit Tests
```bash
cd services
npm test medragClient.test.ts
```

### Service Tests
```bash
cd services/medrag
python -m pytest tests/ -v
```

### Integration Tests
```bash
# Requires MedRAG service running
python -m pytest tests/ -v --runintegration
```

### Manual Testing
```bash
# Health check
curl http://localhost:8000/health

# Basic query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What causes pneumonia?"}'

# ProofPath™ ablation
curl -X POST http://localhost:8000/ablate \
  -H "Content-Type: application/json" \
  -d '{"query": "Pneumonia treatment", "ablate": ["outdated_source"]}'
```

---

## Support & Contributing

### Documentation
- [MedRAG GitHub](https://github.com/Teddy-XiongGZ/MedRAG)
- [Migration Plan](../migration-plan.md)
- [ProofPath™ Details](./proofpath.md)

### Debugging
1. Check service logs: `tail -f services/medrag/medrag_service.log`
2. Verify health endpoint: `curl http://localhost:8000/health`
3. Test with simple query first
4. Check environment variables and API keys

### Development Guidelines
1. All queries must preserve patient privacy (PHI redaction)
2. Evidence citations must be accurate and traceable
3. ProofPath™ ablation should not break existing functionality
4. Maintain backward compatibility in TypeScript client

---

## License & Attribution

- **MedRAG Core**: See `MedRAG-main/LICENSE`  
- **ProofPath™**: Proprietary feature
- **Integration Code**: Same as PediaSignal project license

Please cite MedRAG in academic work:
```bibtex
@inproceedings{xiong-etal-2024-benchmarking,
    title = "Benchmarking Retrieval-Augmented Generation for Medicine",
    author = "Xiong, Guangzhi and others",
    year = "2024"
}
```