"""
Simple MedRAG implementation for development without external dependencies
Uses mock medical knowledge base for testing
"""

import json
import re
from typing import List, Dict, Any, Optional, Tuple

class SimpleMedRAG:
    """Simple MedRAG implementation with mock medical knowledge"""
    
    def __init__(self, llm_name="OpenAI/gpt-3.5-turbo-16k", **kwargs):
        self.llm_name = llm_name
        self.retriever_name = "MockRetriever"
        self.corpus_name = "MockMedicalKnowledge"
        
        # Mock medical knowledge base
        self.knowledge_base = [
            {
                "id": "pediatric_fever_001",
                "title": "Fever in Children - Common Causes",
                "content": "Common causes of fever in children include viral infections (most common), bacterial infections, immunizations, teething, and inflammatory conditions. Viral causes include respiratory viruses, gastroenteritis viruses, and common childhood illnesses like hand-foot-mouth disease.",
                "source": "Pediatric Emergency Medicine Guidelines",
                "category": "pediatrics"
            },
            {
                "id": "pediatric_fever_002", 
                "title": "Fever Management in Pediatrics",
                "content": "Fever management in children focuses on comfort rather than temperature reduction. Antipyretics like acetaminophen or ibuprofen can be used for comfort. Red flags include fever in infants <3 months, altered mental status, signs of dehydration, or persistent high fever >5 days.",
                "source": "AAP Clinical Guidelines",
                "category": "pediatrics"
            },
            {
                "id": "respiratory_001",
                "title": "Pediatric Respiratory Infections",
                "content": "Upper respiratory infections are common in children, often caused by rhinovirus, RSV, or parainfluenza viruses. Symptoms include runny nose, cough, congestion, and low-grade fever. Most are self-limiting and require supportive care.",
                "source": "Pediatric Infectious Diseases Manual",
                "category": "respiratory"
            },
            {
                "id": "emergency_001",
                "title": "Pediatric Emergency Warning Signs",
                "content": "Warning signs requiring immediate medical attention in children include difficulty breathing, severe dehydration, altered mental status, high fever with petechial rash, severe abdominal pain, or signs of sepsis including poor feeding and lethargy.",
                "source": "Emergency Medicine Reference",
                "category": "emergency"
            },
            {
                "id": "growth_001",
                "title": "Normal Growth and Development",
                "content": "Normal pediatric growth follows predictable patterns. Growth charts help track height, weight, and head circumference. Failure to thrive may indicate underlying medical conditions, feeding problems, or psychosocial issues requiring evaluation.",
                "source": "Pediatric Clinical Manual",
                "category": "growth"
            }
        ]
        
    def answer(self, question: str, options: Optional[Dict[str, str]] = None, k: int = 32) -> Tuple[str, List[Dict], List[float]]:
        """
        Generate an answer using mock medical knowledge
        Returns: (answer, retrieved_snippets, scores)
        """
        
        # Simple keyword-based retrieval
        retrieved_snippets = []
        scores = []
        
        # Search for relevant snippets
        question_lower = question.lower()
        keywords = set(re.findall(r'\b\w+\b', question_lower))
        
        for snippet in self.knowledge_base:
            # Calculate relevance score based on keyword overlap
            content_lower = (snippet['title'] + ' ' + snippet['content']).lower()
            content_words = set(re.findall(r'\b\w+\b', content_lower))
            
            overlap = len(keywords.intersection(content_words))
            if overlap > 0:
                score = min(1.0, overlap / len(keywords))
                retrieved_snippets.append(snippet)
                scores.append(score)
        
        # Sort by score and limit to k
        sorted_results = sorted(zip(retrieved_snippets, scores), key=lambda x: x[1], reverse=True)
        retrieved_snippets = [item[0] for item in sorted_results[:k]]
        scores = [item[1] for item in sorted_results[:k]]
        
        # Generate contextual answer
        if retrieved_snippets:
            context = "\n".join([f"- {s['content']}" for s in retrieved_snippets[:3]])
            answer = f"Based on current medical literature:\n\n{self._generate_answer(question, context, options)}"
        else:
            answer = "I don't have specific information about this medical topic in my current knowledge base. Please consult with a healthcare professional."
            
        return answer, retrieved_snippets, scores
    
    def _generate_answer(self, question: str, context: str, options: Optional[Dict[str, str]] = None) -> str:
        """Generate a contextual answer based on retrieved information"""
        
        question_lower = question.lower()
        
        # Pattern matching for common question types
        if any(word in question_lower for word in ['fever', 'temperature']):
            return """Fever in children is commonly caused by:

1. **Viral infections** - Most frequent cause, including respiratory viruses and gastroenteritis
2. **Bacterial infections** - Less common but may require antibiotic treatment
3. **Immunizations** - Normal response to vaccines
4. **Teething** - May cause low-grade fever in infants

**Management**: Focus on comfort with appropriate doses of acetaminophen or ibuprofen. Seek immediate care for infants <3 months with fever, or any child with concerning symptoms like difficulty breathing, altered mental status, or signs of dehydration."""
        
        elif any(word in question_lower for word in ['respiratory', 'cough', 'cold']):
            return """Pediatric respiratory infections are typically viral and include:

- **Upper respiratory infections**: Runny nose, congestion, cough, low-grade fever
- **Common viruses**: Rhinovirus, RSV, parainfluenza
- **Treatment**: Supportive care with rest, fluids, and symptomatic relief

Seek medical care if child shows signs of respiratory distress, persistent high fever, or poor feeding."""
        
        elif any(word in question_lower for word in ['emergency', 'warning', 'urgent']):
            return """Key pediatric emergency warning signs include:

- Difficulty breathing or respiratory distress
- Severe dehydration (dry mouth, no tears, decreased urination)
- Altered mental status or extreme lethargy
- High fever with petechial rash
- Signs of sepsis (poor feeding, mottled skin, temperature instability)

These symptoms require immediate medical evaluation."""
        
        else:
            # Generic medical response
            return f"Regarding '{question}': Based on the available medical literature, this topic requires individualized assessment. The information provided suggests considering multiple factors including patient age, symptoms, and clinical presentation. Please consult with a healthcare professional for proper evaluation and management."

# Simple wrapper to match expected interface
class MedRAG(SimpleMedRAG):
    pass