"""Debug: see raw LLM response for the failing input."""
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

CF_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
CF_ACCOUNT = os.getenv("CLOUDFLARE_ACCOUNT_ID")

NEWS = """Headline:
Government Approves "Miracle Herb" That Cures Diabetes in 3 Days

Article:
In a surprising announcement yesterday, health officials revealed that a newly discovered herb found in northern mountain regions can completely cure diabetes within just three days. According to unnamed insiders, the herb works by "resetting the pancreas naturally" and eliminates the need for insulin permanently.

Several social media influencers have already claimed success, saying their blood sugar returned to normal after drinking a tea made from the leaves. Despite the excitement, no official clinical trials or peer-reviewed research papers have been published.

Pharmacies are reportedly trying to suppress information about the herb because it could "destroy the insulin industry." fake news"""

PROMPT = f"""You are an expert fact-checker. Classify the news below as Real, Fake, or Misleading.

Respond with ONLY this JSON, nothing else:
{{"label": "Fake", "confidence": 0.95, "reasoning_summary": "example"}}

News:
{NEWS}

JSON:"""


async def main():
    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT}/ai/run/@cf/mistral/mistral-7b-instruct-v0.1"
    headers = {"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"}
    payload = {"messages": [{"role": "user", "content": PROMPT}], "max_tokens": 512, "temperature": 0.2}

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload, headers=headers)

    print(f"Status: {resp.status_code}")
    body = resp.json()
    raw = body.get("result", {}).get("response", "NO RESPONSE")
    print(f"Raw response:\n---\n{raw}\n---")


asyncio.run(main())
