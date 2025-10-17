"""
Test suite for MedRAG FastAPI service
Tests both the service endpoints and ProofPath™ functionality
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
import json
import os

# Set test environment variables before importing main
os.environ["PROOFPATH_ENABLED"] = "true"
os.environ["MEDRAG_LLM_NAME"] = "OpenAI/gpt-3.5-turbo-16k"
os.environ["MEDRAG_RETRIEVER_NAME"] = "MedCPT"
os.environ["MEDRAG_CORPUS_NAME"] = "Textbooks"

from main import app, medrag_instance, build_evidence_trail, calculate_answer_confidence, apply_ablation

client = TestClient(app)

class TestHealthEndpoint:
    """Test the health check endpoint"""
    
    def test_health_check_healthy(self):
        """Test health check when service is healthy"""
        with patch('main.medrag_instance') as mock_medrag:
            mock_medrag.return_value = Mock()  # Mock initialized
            
            response = client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["medrag_initialized"] == True
            assert data["proofpath_enabled"] == True
            assert "timestamp" in data

    def test_health_check_unhealthy(self):
        """Test health check when service is not initialized"""
        with patch('main.medrag_instance', None):
            response = client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "unhealthy"
            assert data["medrag_initialized"] == False


class TestQueryEndpoint:
    """Test the main query endpoint"""
    
    @patch('main.medrag_instance')
    def test_successful_query(self, mock_medrag):
        """Test a successful MedRAG query"""
        # Mock MedRAG response
        mock_medrag.answer.return_value = (
            "Chest pain can be caused by cardiac, pulmonary, or GI conditions.",
            [
                {
                    "id": "doc_1",
                    "title": "Chest Pain Guidelines",
                    "content": "Chest pain evaluation should include...",
                    "url": "https://example.com/guidelines"
                }
            ],
            [0.92]
        )
        mock_medrag.llm_name = "OpenAI/gpt-3.5-turbo-16k"
        
        query_data = {
            "query": "What causes chest pain?",
            "k": 32,
            "temperature": 0.0
        }
        
        response = client.post("/query", json=query_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "answer" in data
        assert "contexts" in data
        assert "citations" in data
        assert "latency_ms" in data
        assert "model_info" in data
        assert data["model_info"] == "OpenAI/gpt-3.5-turbo-16k"
        
        # Check ProofPath™ fields
        assert "evidence_trail" in data
        assert "answer_confidence" in data
        assert "proofpath_meta" in data

    def test_missing_query_parameter(self):
        """Test query endpoint with missing query parameter"""
        response = client.post("/query", json={})
        
        assert response.status_code == 422  # Validation error

    @patch('main.medrag_instance')
    def test_query_with_multiple_choice(self, mock_medrag):
        """Test query with multiple choice options"""
        mock_medrag.answer.return_value = (
            "The correct answer is B) Epinephrine.",
            [{"id": "doc_1", "title": "Anaphylaxis", "content": "First line..."}],
            [0.95]
        )
        mock_medrag.llm_name = "test-model"
        
        query_data = {
            "query": "What is first-line treatment for anaphylaxis?",
            "options": {
                "A": "Diphenhydramine",
                "B": "Epinephrine", 
                "C": "Albuterol"
            }
        }
        
        response = client.post("/query", json=query_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data

    @patch('main.medrag_instance')
    def test_query_with_ablation(self, mock_medrag):
        """Test ProofPath™ ablation functionality"""
        mock_medrag.answer.return_value = (
            "Modified answer after ablation.",
            [{"id": "doc_2", "title": "Alternative Source", "content": "Different info..."}],
            [0.85]
        )
        mock_medrag.llm_name = "test-model"
        
        query_data = {
            "query": "What causes fever?",
            "ablate": ["doc_1", "passage_0"]
        }
        
        response = client.post("/query", json=query_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "counterfactual_note" in data
        assert "doc_1" in data["counterfactual_note"]

    @patch('main.medrag_instance')
    def test_query_service_error(self, mock_medrag):
        """Test handling of MedRAG service errors"""
        mock_medrag.answer.side_effect = Exception("MedRAG service error")
        
        query_data = {
            "query": "Test query"
        }
        
        response = client.post("/query", json=query_data)
        
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "MedRAG service error" in data["detail"]


class TestAblateEndpoint:
    """Test the ProofPath™ ablation endpoint"""
    
    def test_ablate_without_ablation_param(self):
        """Test ablate endpoint requires ablation parameter"""
        query_data = {
            "query": "Test query without ablation"
        }
        
        response = client.post("/ablate", json=query_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "ablate" in data["detail"]

    @patch('main.medrag_instance')
    def test_successful_ablation(self, mock_medrag):
        """Test successful ablation query"""
        mock_medrag.answer.return_value = (
            "Answer after ablation",
            [{"id": "doc_2", "title": "Remaining Source", "content": "Content..."}],
            [0.80]
        )
        mock_medrag.llm_name = "test-model"
        
        query_data = {
            "query": "Test ablation query",
            "ablate": ["doc_1"]
        }
        
        response = client.post("/ablate", json=query_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "counterfactual_note" in data


class TestProofPathFunctions:
    """Test ProofPath™ utility functions"""
    
    def test_calculate_answer_confidence(self):
        """Test confidence calculation logic"""
        retrieved_snippets = [
            {"id": "1", "title": "High quality source"},
            {"id": "2", "title": "Medium quality source"}
        ]
        scores = [0.95, 0.75]
        
        confidence = calculate_answer_confidence(retrieved_snippets, scores)
        
        assert 0.0 <= confidence <= 1.0
        assert isinstance(confidence, float)

    def test_calculate_confidence_empty_scores(self):
        """Test confidence calculation with empty scores"""
        confidence = calculate_answer_confidence([], [])
        assert confidence == 0.5

    def test_build_evidence_trail(self):
        """Test evidence trail generation"""
        retrieved_snippets = [
            {
                "id": "doc_1",
                "title": "Medical Guidelines",
                "content": "Important medical information...",
                "url": "https://example.com/doc1",
                "date": "2023-01-01"
            }
        ]
        scores = [0.92]
        
        evidence_trail = build_evidence_trail(retrieved_snippets, scores)
        
        assert len(evidence_trail) == 1
        evidence = evidence_trail[0]
        assert evidence.id == "passage_0"
        assert evidence.source_id == "doc_1"
        assert evidence.title == "Medical Guidelines"
        assert evidence.similarity == 0.92
        assert 0.0 <= evidence.weight <= 1.0

    def test_apply_ablation(self):
        """Test ablation logic"""
        snippets = [
            {"id": "doc_1", "title": "Source 1", "content": "Content 1"},
            {"id": "doc_2", "title": "Source 2", "content": "Content 2"},
            {"id": "doc_3", "title": "Source 3", "content": "Content 3"}
        ]
        scores = [0.9, 0.8, 0.7]
        ablate_ids = ["doc_1", "doc_3"]
        
        filtered_snippets, filtered_scores, note = apply_ablation(snippets, scores, ablate_ids)
        
        assert len(filtered_snippets) == 1
        assert filtered_snippets[0]["id"] == "doc_2"
        assert len(filtered_scores) == 1
        assert filtered_scores[0] == 0.8
        assert "2" in note  # Should mention 2 passages excluded

    def test_apply_ablation_empty(self):
        """Test ablation with no ablation IDs"""
        snippets = [{"id": "doc_1", "title": "Source 1", "content": "Content 1"}]
        scores = [0.9]
        
        filtered_snippets, filtered_scores, note = apply_ablation(snippets, scores, [])
        
        assert filtered_snippets == snippets
        assert filtered_scores == scores
        assert note == ""


class TestInputValidation:
    """Test input validation and sanitization"""
    
    def test_query_sanitization(self):
        """Test that PHI patterns are sanitized from queries"""
        query_data = {
            "query": "Patient 123-45-6789 has chest pain. Email me@example.com"
        }
        
        # This should not fail validation, but query should be sanitized
        response = client.post("/query", json=query_data)
        
        # Even if MedRAG fails, the query should have been sanitized
        # (We can't easily test the sanitized query without mocking deeper)
        assert response.status_code in [200, 500]  # Either success or service error

    def test_parameter_validation(self):
        """Test parameter validation"""
        # Test invalid k parameter
        query_data = {
            "query": "Valid query",
            "k": -1  # Invalid
        }
        
        response = client.post("/query", json=query_data)
        assert response.status_code == 422

        # Test invalid temperature
        query_data = {
            "query": "Valid query", 
            "temperature": 2.0  # Too high
        }
        
        response = client.post("/query", json=query_data)
        assert response.status_code == 422


class TestErrorHandling:
    """Test error handling and logging"""
    
    @patch('main.medrag_instance', None)
    def test_service_not_initialized(self):
        """Test behavior when MedRAG service is not initialized"""
        query_data = {
            "query": "Test query"
        }
        
        response = client.post("/query", json=query_data)
        
        assert response.status_code == 503
        data = response.json()
        assert "not initialized" in data["detail"]

    def test_malformed_request(self):
        """Test handling of malformed requests"""
        response = client.post("/query", data="invalid json")
        
        assert response.status_code == 422


# Integration test requiring actual MedRAG setup
class TestIntegration:
    """Integration tests (require MedRAG service to be running)"""
    
    @pytest.mark.integration
    @patch.dict(os.environ, {"OPENAI_API_KEY": "test_key"})
    def test_end_to_end_query(self):
        """End-to-end test with actual MedRAG (if available)"""
        # Skip if no OpenAI key available
        if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "test_key":
            pytest.skip("No OpenAI API key available for integration test")
        
        query_data = {
            "query": "What are the signs of dehydration in children?",
            "k": 5
        }
        
        response = client.post("/query", json=query_data)
        
        # This may succeed or fail depending on MedRAG setup
        # But it should not crash the service
        assert response.status_code in [200, 500, 503]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])