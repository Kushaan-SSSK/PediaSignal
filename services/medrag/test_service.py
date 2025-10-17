#!/usr/bin/env python3
"""
Simplified MedRAG test service for initial deployment testing
"""

import os
import sys
import time
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('medrag_service_test.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MedRAG Test Service",
    description="Simplified MedRAG service for testing deployment",
    version="1.0.0-test"
)

# Request/Response Models
class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Medical query to process")
    options: Optional[Dict[str, str]] = Field(None, description="Multiple choice options")
    k: int = Field(32, ge=1, le=100, description="Number of retrieved passages")
    temperature: float = Field(0.0, ge=0.0, le=1.0, description="Generation temperature")
    ablate: Optional[List[str]] = Field(None, description="List of source/passage IDs to exclude")

class EvidenceRef(BaseModel):
    id: str
    source_id: str
    title: Optional[str] = None
    similarity: float = Field(0.0, ge=0.0, le=1.0)
    weight: float = Field(0.0, ge=0.0, le=1.0)

class ProofPathMeta(BaseModel):
    retriever_params: Dict[str, Any]
    generator_params: Dict[str, Any]
    latency_ms: Dict[str, int]
    token_counts: Dict[str, int]
    warnings: List[str]

class QueryResponse(BaseModel):
    answer: str
    contexts: List[Dict[str, Any]]
    citations: List[str]
    latency_ms: int
    model_info: str
    evidence_trail: Optional[List[EvidenceRef]] = None
    answer_confidence: Optional[float] = None
    proofpath_meta: Optional[ProofPathMeta] = None
    counterfactual_note: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    medrag_initialized: bool
    proofpath_enabled: bool

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        medrag_initialized=True,  # Mock for testing
        proofpath_enabled=True
    )

@app.post("/query", response_model=QueryResponse)
async def query_medrag(request: QueryRequest):
    """Mock query endpoint for testing."""
    start_time = time.time()
    
    logger.info(f"Processing test query: {request.query[:50]}...")
    
    # Simulate processing time
    time.sleep(0.5)
    
    # Mock response based on query
    mock_contexts = [
        {
            "title": "Pediatric Emergency Guidelines",
            "content": f"Mock medical information related to: {request.query}",
            "source": "test_textbook_001"
        },
        {
            "title": "Clinical Reference Manual",
            "content": f"Additional context for: {request.query}",
            "source": "test_manual_002"
        }
    ]
    
    mock_answer = f"Based on current medical guidelines, regarding '{request.query}': This is a mock response for testing purposes. In a real deployment, MedRAG would provide evidence-based medical information."
    
    # Handle multiple choice
    if request.options:
        mock_answer += f" Among the provided options: {list(request.options.keys())}, this would be analyzed by the medical reasoning system."
    
    evidence_trail = [
        EvidenceRef(
            id="passage_0",
            source_id="test_textbook_001",
            title="Pediatric Emergency Guidelines",
            similarity=0.92,
            weight=0.85
        ),
        EvidenceRef(
            id="passage_1", 
            source_id="test_manual_002",
            title="Clinical Reference Manual",
            similarity=0.88,
            weight=0.75
        )
    ]
    
    # Handle ablation
    counterfactual_note = None
    if request.ablate:
        evidence_trail = [e for e in evidence_trail if e.id not in request.ablate and e.source_id not in request.ablate]
        counterfactual_note = f"Excluded {len(request.ablate)} passages based on ablation criteria: {', '.join(request.ablate)}"
    
    latency_ms = int((time.time() - start_time) * 1000)
    
    return QueryResponse(
        answer=mock_answer,
        contexts=mock_contexts,
        citations=["Pediatric Emergency Guidelines - test_textbook_001", "Clinical Reference Manual - test_manual_002"],
        latency_ms=latency_ms,
        model_info="MockMedRAG/test-model-v1",
        evidence_trail=evidence_trail,
        answer_confidence=0.85,
        proofpath_meta=ProofPathMeta(
            retriever_params={"name": "MockRetriever", "corpus": "TestBooks", "k": request.k},
            generator_params={"model": "MockMedRAG/test-model-v1", "temperature": request.temperature},
            latency_ms={"retrieve": latency_ms//2, "generate": latency_ms//2},
            token_counts={"context": len(mock_answer.split()), "output": len(mock_answer.split())},
            warnings=["This is a test/mock service"] if request.ablate else []
        ),
        counterfactual_note=counterfactual_note
    )

@app.post("/ablate", response_model=QueryResponse)
async def ablate_query(request: QueryRequest):
    """Counterfactual query endpoint - alias for /query with enforced ablation."""
    if not request.ablate:
        raise HTTPException(status_code=400, detail="Ablation endpoint requires 'ablate' parameter")
    
    return await query_medrag(request)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {str(exc)}")
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": "service_error"}
    )

if __name__ == "__main__":
    # Test server
    uvicorn.run(
        "test_service:app",
        host="0.0.0.0", 
        port=int(os.getenv("MEDRAG_PORT", "8000")),
        reload=False,
        log_level="info"
    )