"""End-to-end test: send the actual failing news text to /analyze."""
import asyncio
import httpx

NEWS = """Headline:
Government Approves "Miracle Herb" That Cures Diabetes in 3 Days

Article:
In a surprising announcement yesterday, health officials revealed that a newly discovered herb found in northern mountain regions can completely cure diabetes within just three days. According to unnamed insiders, the herb works by "resetting the pancreas naturally" and eliminates the need for insulin permanently.

Several social media influencers have already claimed success, saying their blood sugar returned to normal after drinking a tea made from the leaves. Despite the excitement, no official clinical trials or peer-reviewed research papers have been published.

Pharmacies are reportedly trying to suppress information about the herb because it could "destroy the insulin industry." fake news"""


async def main():
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "http://localhost:8000/analyze",
            data={"text": NEWS},
        )
    print(f"Status: {resp.status_code}")
    import json
    print(json.dumps(resp.json(), indent=2))


asyncio.run(main())
