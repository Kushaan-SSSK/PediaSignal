"""
Pytest configuration for MedRAG service tests
"""

import pytest
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path so we can import from main
sys.path.insert(0, str(Path(__file__).parent.parent))

@pytest.fixture(autouse=True)
def set_test_environment():
    """Set up test environment variables"""
    test_env = {
        "PROOFPATH_ENABLED": "true",
        "PROOFPATH_MAX_PASSAGES": "32",
        "MEDRAG_LLM_NAME": "OpenAI/gpt-3.5-turbo-16k",
        "MEDRAG_RETRIEVER_NAME": "MedCPT",
        "MEDRAG_CORPUS_NAME": "Textbooks",
        "MEDRAG_DB_DIR": "./test_corpus",
        "MEDRAG_CORPUS_CACHE": "false",  # Disable cache for tests
    }
    
    # Set environment variables for the test session
    original_env = {}
    for key, value in test_env.items():
        original_env[key] = os.environ.get(key)
        os.environ[key] = value
    
    yield
    
    # Restore original environment
    for key, value in original_env.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value

@pytest.fixture
def mock_medrag_response():
    """Standard mock MedRAG response for testing"""
    return {
        "answer": "Test medical answer with evidence-based recommendations.",
        "contexts": [
            {
                "title": "Clinical Guidelines",
                "content": "Detailed clinical information and recommendations.",
                "source": "guideline_001"
            },
            {
                "title": "Research Study",
                "content": "Evidence from peer-reviewed research.",
                "source": "pubmed_12345"
            }
        ],
        "citations": [
            "Clinical Guidelines - guideline_001",
            "Research Study - pubmed_12345"
        ],
        "latency_ms": 1250,
        "model_info": "OpenAI/gpt-3.5-turbo-16k",
        "evidence_trail": [
            {
                "id": "passage_0",
                "source_id": "guideline_001",
                "title": "Clinical Guidelines",
                "similarity": 0.92,
                "weight": 0.85,
                "doc_url": "https://example.com/guidelines",
                "published_at": "2023-01-15"
            },
            {
                "id": "passage_1", 
                "source_id": "pubmed_12345",
                "title": "Research Study",
                "similarity": 0.88,
                "weight": 0.75,
                "doc_url": "https://pubmed.ncbi.nlm.nih.gov/12345",
                "published_at": "2022-11-20"
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
        }
    }

@pytest.fixture
def sample_retrieved_snippets():
    """Sample retrieved snippets for testing"""
    return [
        {
            "id": "doc_001",
            "title": "Pediatric Emergency Guidelines",
            "content": "Comprehensive guidelines for pediatric emergency medicine including assessment, diagnosis, and treatment protocols.",
            "url": "https://example.com/guidelines/pediatric",
            "date": "2023-06-01",
            "source_id": "guideline_ped_001"
        },
        {
            "id": "doc_002", 
            "title": "Fever Management in Children",
            "content": "Evidence-based approaches to fever management in pediatric patients, including medication dosing and monitoring.",
            "url": "https://example.com/research/fever",
            "date": "2023-03-15",
            "source_id": "research_fever_001"
        },
        {
            "id": "doc_003",
            "title": "Dehydration Assessment",
            "content": "Clinical assessment tools and criteria for evaluating dehydration severity in pediatric patients.",
            "url": "https://example.com/clinical/dehydration", 
            "date": "2022-12-10",
            "source_id": "clinical_dehydr_001"
        }
    ]

@pytest.fixture
def sample_scores():
    """Sample similarity scores for testing"""
    return [0.95, 0.87, 0.82]

def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests (may require external services)"
    )
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )

def pytest_collection_modifyitems(config, items):
    """Modify test collection to handle markers"""
    if config.getoption("--runintegration"):
        # Run all tests including integration
        return
    
    skip_integration = pytest.mark.skip(reason="need --runintegration option to run")
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip_integration)

def pytest_addoption(parser):
    """Add custom command line options"""
    parser.addoption(
        "--runintegration",
        action="store_true",
        default=False,
        help="run integration tests that require external services"
    )