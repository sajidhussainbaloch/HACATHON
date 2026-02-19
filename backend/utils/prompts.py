"""
RealityCheck AI — LLM Prompt Templates
Structured prompts for classification and explanation.
"""

CLASSIFICATION_PROMPT = """You are an expert fact-checker. Classify the news below as Real, Fake, or Misleading.

Rules:
- Real: factually accurate and supported by credible evidence.
- Fake: demonstrably false or fabricated.
- Misleading: contains some truth but presented deceptively.

Respond with ONLY this exact JSON format, no other text:
{{"label": "Fake", "confidence": 0.95, "reasoning_summary": "brief reason"}}

News to analyze:
{news_text}

JSON:"""


EXPLANATION_PROMPT = """You are an expert fact-checker. Provide a detailed analysis.

News: {news_text}

Classification: {label} (confidence: {confidence})
Summary: {reasoning_summary}

Evidence:
{evidence_block}

Respond with ONLY this JSON format, no other text:
{{"detailed_explanation": "3-5 sentence explanation", "key_inconsistencies": ["point1", "point2"], "evidence_alignment": "how evidence relates"}}

JSON:"""
