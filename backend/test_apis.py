"""Quick diagnostic: test HuggingFace + Cloudflare API tokens."""
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "")
CF_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN", "")
CF_ACCOUNT = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")


async def test_hf():
    print("=" * 50)
    print("Testing HuggingFace Embedding API...")
    print(f"  Token: {HF_TOKEN[:10]}...{HF_TOKEN[-4:]}")
    url = (
        "https://router.huggingface.co/hf-inference/models/"
        "sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
    )
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    payload = {"inputs": "This is a test sentence.", "options": {"wait_for_model": True}}

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload, headers=headers)

    print(f"  Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"  Embedding length: {len(data)}")
        print("  ✅ HuggingFace API works!")
    else:
        print(f"  ❌ Error: {resp.text[:300]}")


async def test_cf():
    print("=" * 50)
    print("Testing Cloudflare Workers AI...")
    print(f"  Account ID: {CF_ACCOUNT}")
    print(f"  Token: {CF_TOKEN[:10]}...{CF_TOKEN[-4:]}")
    # Try multiple model names
    headers = {
        "Authorization": f"Bearer {CF_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messages": [{"role": "user", "content": "Say hello in one word."}],
        "max_tokens": 20,
    }
    models = [
        "@cf/mistral/mistral-7b-instruct-v0.2",
        "@cf/mistral/mistral-7b-instruct-v0.1",
        "@hf/mistral/mistral-7b-instruct-v0.2",
        "@cf/meta/llama-3.1-8b-instruct",
    ]
    for model in models:
        url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT}/ai/run/{model}"
        print(f"  Trying: {model}")
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, json=payload, headers=headers)
        print(f"    Status: {resp.status_code}")
        if resp.status_code == 200:
            body = resp.json()
            print(f"    Response: {body}")
            print(f"    ✅ Model {model} works!")
            return
        else:
            print(f"    ❌ {resp.text[:200]}")
    print("  ❌ No working model found")


async def main():
    await test_hf()
    print()
    await test_cf()
    print()
    print("=" * 50)
    print("Diagnostics complete.")


asyncio.run(main())
