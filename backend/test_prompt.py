"""Test prompt formatting with the actual failing input."""
from utils.prompts import CLASSIFICATION_PROMPT

news = '''Headline:
Government Approves "Miracle Herb" That Cures Diabetes in 3 Days

Article:
In a surprising announcement yesterday, health officials revealed that a newly discovered herb found in northern mountain regions can completely cure diabetes within just three days. According to unnamed insiders, the herb works by "resetting the pancreas naturally" and eliminates the need for insulin permanently.

Several social media influencers have already claimed success, saying their blood sugar returned to normal after drinking a tea made from the leaves. Despite the excitement, no official clinical trials or peer-reviewed research papers have been published.

Pharmacies are reportedly trying to suppress information about the herb because it could "destroy the insulin industry." fake news'''

try:
    result = CLASSIFICATION_PROMPT.format(news_text=news)
    print("Format OK, length:", len(result))
    print("---PROMPT START---")
    print(result[-200:])
    print("---PROMPT END---")
except Exception as e:
    print(f"FORMAT ERROR: {type(e).__name__}: {e}")
