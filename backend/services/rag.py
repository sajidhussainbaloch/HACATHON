"""
RealityCheck AI — RAG Service
Generates embeddings via Hugging Face Inference API,
stores / retrieves vectors with FAISS.
"""

from __future__ import annotations

import hashlib
import numpy as np
import httpx
import faiss
from functools import lru_cache
from fastapi import HTTPException

from utils.config import (
    HUGGINGFACE_API_TOKEN,
    HUGGINGFACE_EMBEDDING_URL,
    EMBEDDING_DIM,
    TOP_K_RESULTS,
    EMBEDDING_CACHE_SIZE,
    SEED_ARTICLES,
)

# ── In-memory FAISS index & article store ─────────────────────────────────────
_index: faiss.IndexFlatIP | None = None
_articles: list[dict] = []
_embedding_cache: dict[str, np.ndarray] = {}


def _cache_key(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


async def get_embedding(text: str) -> np.ndarray:
    """Fetch embedding from HF Inference API with caching."""
    key = _cache_key(text)
    if key in _embedding_cache and len(_embedding_cache) <= EMBEDDING_CACHE_SIZE:
        return _embedding_cache[key]

    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"}
    payload = {"inputs": text[:2000], "options": {"wait_for_model": True}}

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            resp = await client.post(
                HUGGINGFACE_EMBEDDING_URL, json=payload, headers=headers
            )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Embedding API timed out.")
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"Embedding API error: {exc}")

    if resp.status_code == 429:
        raise HTTPException(
            status_code=429,
            detail="Hugging Face rate limit hit. Please wait and retry.",
        )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Embedding API status {resp.status_code}: {resp.text[:300]}",
        )

    data = resp.json()
    vec = np.array(data, dtype=np.float32).flatten()

    # Handle occasional nested list
    if vec.ndim == 0:
        raise HTTPException(status_code=502, detail="Invalid embedding response.")
    if vec.shape[0] != EMBEDDING_DIM:
        # token-level embeddings returned — mean-pool
        vec = np.array(data, dtype=np.float32)
        if vec.ndim == 2:
            vec = vec.mean(axis=0)
        vec = vec[:EMBEDDING_DIM]

    # Normalise for cosine similarity via inner-product
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm

    _embedding_cache[key] = vec
    return vec


async def build_index() -> None:
    """Build FAISS index from seed articles (called once at startup)."""
    global _index, _articles
    _index = faiss.IndexFlatIP(EMBEDDING_DIM)
    _articles = list(SEED_ARTICLES)

    vectors: list[np.ndarray] = []
    for art in _articles:
        vec = await get_embedding(art["text"])
        vectors.append(vec)

    if vectors:
        matrix = np.stack(vectors).astype(np.float32)
        _index.add(matrix)


async def retrieve_similar(query_text: str) -> list[dict]:
    """Return top-K similar articles from the FAISS index."""
    global _index, _articles
    if _index is None or _index.ntotal == 0:
        return []

    query_vec = await get_embedding(query_text)
    query_vec = query_vec.reshape(1, -1).astype(np.float32)

    k = min(TOP_K_RESULTS, _index.ntotal)
    scores, indices = _index.search(query_vec, k)

    results = []
    for rank, (score, idx) in enumerate(zip(scores[0], indices[0])):
        if idx < 0 or idx >= len(_articles):
            continue
        art = _articles[idx].copy()
        art["similarity_score"] = round(float(score), 4)
        results.append(art)

    return results
