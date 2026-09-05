"""
Shared AI gateway for orchestration-ready generation and embeddings.
This keeps provider selection isolated from feature routes.
"""

from __future__ import annotations

import os
from typing import Any

import httpx
import numpy as np
from fastapi import HTTPException

EMBEDDING_DIM = 384
EMBEDDING_URL = (
    "https://router.huggingface.co/hf-inference/models/"
    "sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
)
DEFAULT_MODELS = [
    "mistralai/Mistral-7B-Instruct-v0.2",
    "google/flan-t5-large",
    "microsoft/phi-2",
]
PREMIUM_MODELS = [
    "mistralai/Mistral-7B-Instruct-v0.2",
    "microsoft/phi-2",
]


def _headers() -> dict[str, str]:
    token = os.getenv("HF_API_KEY", "").strip() or os.getenv("HUGGINGFACE_API_TOKEN", "").strip()
    return {"Authorization": f"Bearer {token}"} if token else {}


def choose_model_tier(task_type: str, complexity: str = "default") -> dict[str, Any]:
    premium_tasks = {"code", "research", "synthesis"}
    if task_type in premium_tasks or complexity == "high":
        return {"tier": "premium", "models": PREMIUM_MODELS}
    return {"tier": "default", "models": DEFAULT_MODELS}


async def embed_text(text: str) -> np.ndarray:
    payload = {"inputs": text[:2500], "options": {"wait_for_model": True}}
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(EMBEDDING_URL, headers=_headers(), json=payload)

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Embedding API failure ({response.status_code}).")

    raw = response.json()
    vector = np.array(raw, dtype=np.float32)
    if vector.ndim == 2:
        vector = vector.mean(axis=0)
    vector = vector.flatten()

    if vector.shape[0] < EMBEDDING_DIM:
        vector = np.pad(vector, (0, EMBEDDING_DIM - vector.shape[0]), mode="constant")
    if vector.shape[0] > EMBEDDING_DIM:
        vector = vector[:EMBEDDING_DIM]

    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
    return vector.astype(np.float32)


async def generate_text(
    prompt: str,
    task_type: str = "general",
    complexity: str = "default",
    max_new_tokens: int = 420,
) -> str:
    route = choose_model_tier(task_type, complexity)
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": max_new_tokens,
            "temperature": 0.2,
            "return_full_text": False,
        },
        "options": {"wait_for_model": True},
    }

    errors: list[str] = []
    async with httpx.AsyncClient(timeout=90) as client:
        for model in route["models"]:
            url = f"https://router.huggingface.co/hf-inference/models/{model}"
            try:
                response = await client.post(url, headers=_headers(), json=payload)
            except httpx.HTTPError as exc:
                errors.append(f"{model}: {exc}")
                continue

            if response.status_code != 200:
                errors.append(f"{model}: status {response.status_code}")
                continue

            data = response.json()
            if isinstance(data, list) and data and isinstance(data[0], dict) and "generated_text" in data[0]:
                return str(data[0]["generated_text"]).strip()
            if isinstance(data, dict) and "generated_text" in data:
                return str(data["generated_text"]).strip()
            if isinstance(data, str):
                return data.strip()
            errors.append(f"{model}: unexpected response")

    raise HTTPException(status_code=502, detail=f"LLM providers failed. {', '.join(errors[:3])}")
