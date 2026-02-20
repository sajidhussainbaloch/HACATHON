"""
Student Research Copilot routes (isolated module).
Implements upload -> RAG retrieval -> grounded answer/generation.
"""

from __future__ import annotations

import json
import os
import re
from io import BytesIO
from typing import Literal

import faiss
import httpx
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from pypdf import PdfReader

from services.ocr import extract_text_from_image

router = APIRouter(prefix="/student", tags=["student-assistant"])

EMBEDDING_DIM = 384
STUDENT_INDEX_NAME = "student_index"
EMBEDDING_URL = (
    "https://router.huggingface.co/hf-inference/models/"
    "sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
)
FREE_MODELS = [
    "mistralai/Mistral-7B-Instruct-v0.2",
    "google/flan-t5-large",
    "microsoft/phi-2",
]

MAX_CONTEXT_CHARS = 7000
MAX_OUTPUT_TOKENS_ASK = 280
MAX_OUTPUT_TOKENS_GENERATE = 520
MAX_FILE_CHARS = 70000
CHUNK_TARGET_TOKENS = 500
CHUNK_OVERLAP_TOKENS = 60

_student_index: faiss.IndexFlatIP | None = None
_student_chunks: list[dict] = []


class AskRequest(BaseModel):
    question: str


class GenerateRequest(BaseModel):
    mode: Literal["summary", "keypoints", "flashcards", "mcq", "viva", "concept_map"]


def _hf_headers() -> dict:
    token = os.getenv("HF_API_KEY", "").strip() or os.getenv("HUGGINGFACE_API_TOKEN", "").strip()
    if token:
        return {"Authorization": f"Bearer {token}"}
    return {}


def _clean_text(text: str) -> str:
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+|\n+", text)
    return [p.strip() for p in parts if p and p.strip()]


def _chunk_text(text: str, target_tokens: int = CHUNK_TARGET_TOKENS) -> list[str]:
    sentences = _split_sentences(text)
    if not sentences:
        return []

    chunks: list[str] = []
    current: list[str] = []
    current_tokens = 0

    for sentence in sentences:
        sent_tokens = max(1, len(sentence.split()))
        if current and current_tokens + sent_tokens > target_tokens:
            chunks.append(" ".join(current).strip())
            overlap_words = " ".join(current).split()[-CHUNK_OVERLAP_TOKENS:]
            current = [" ".join(overlap_words)] if overlap_words else []
            current_tokens = len(overlap_words)

        current.append(sentence)
        current_tokens += sent_tokens

    if current:
        chunks.append(" ".join(current).strip())

    return [c for c in chunks if c]


def _extract_json_blob(text: str) -> dict | None:
    if not text:
        return None

    fenced = re.findall(r"```json\s*(\{.*?\})\s*```", text, flags=re.DOTALL | re.IGNORECASE)
    candidates = fenced if fenced else re.findall(r"(\{.*\})", text, flags=re.DOTALL)

    for candidate in candidates:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    return None


def _coerce_ids(ids: list, max_id: int) -> list[int]:
    normalized: list[int] = []
    for i in ids or []:
        try:
            v = int(i)
        except (TypeError, ValueError):
            continue
        if 1 <= v <= max_id and v not in normalized:
            normalized.append(v)
    return normalized


def _validate_mode_output(mode: str, payload: dict, max_id: int) -> dict:
    if not isinstance(payload, dict):
        raise HTTPException(status_code=502, detail="Invalid model response format.")

    if mode == "summary":
        summary = str(payload.get("summary", "")).strip()
        if not summary:
            raise HTTPException(status_code=502, detail="Summary generation failed.")
        payload["summary"] = summary[:2500]
        payload["evidence_chunk_ids"] = _coerce_ids(payload.get("evidence_chunk_ids", []), max_id)
        return payload

    if mode == "keypoints":
        concepts = payload.get("key_concepts")
        if not isinstance(concepts, list):
            raise HTTPException(status_code=502, detail="Invalid keypoints format.")
        for item in concepts:
            if isinstance(item, dict):
                item["evidence_chunk_ids"] = _coerce_ids(item.get("evidence_chunk_ids", []), max_id)
        return payload

    if mode == "flashcards":
        cards = payload.get("flashcards")
        if not isinstance(cards, list):
            raise HTTPException(status_code=502, detail="Invalid flashcards format.")
        for item in cards:
            if isinstance(item, dict):
                item["evidence_chunk_ids"] = _coerce_ids(item.get("evidence_chunk_ids", []), max_id)
        return payload

    if mode == "mcq":
        mcqs = payload.get("mcqs")
        if not isinstance(mcqs, list):
            raise HTTPException(status_code=502, detail="Invalid MCQ format.")
        for item in mcqs:
            if isinstance(item, dict):
                correct = str(item.get("correct", "")).upper()
                item["correct"] = correct if correct in {"A", "B", "C", "D"} else "A"
                item["evidence_chunk_ids"] = _coerce_ids(item.get("evidence_chunk_ids", []), max_id)
        return payload

    if mode == "viva":
        viva = payload.get("viva_questions")
        if not isinstance(viva, list):
            raise HTTPException(status_code=502, detail="Invalid viva format.")
        for item in viva:
            if isinstance(item, dict):
                item["evidence_chunk_ids"] = _coerce_ids(item.get("evidence_chunk_ids", []), max_id)
        return payload

    if mode == "concept_map":
        rel = payload.get("concept_relationships")
        if not isinstance(rel, list):
            raise HTTPException(status_code=502, detail="Invalid concept map format.")
        for item in rel:
            if isinstance(item, dict):
                item["evidence_chunk_ids"] = _coerce_ids(item.get("evidence_chunk_ids", []), max_id)
        return payload

    raise HTTPException(status_code=400, detail="Unsupported generation mode.")


async def _embed_text(text: str) -> np.ndarray:
    payload = {"inputs": text[:2500], "options": {"wait_for_model": True}}
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(EMBEDDING_URL, headers=_hf_headers(), json=payload)

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Embedding API failure ({response.status_code}).",
        )

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


async def _generate_text(prompt: str, max_new_tokens: int) -> str:
    headers = _hf_headers()
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
        for model in FREE_MODELS:
            url = f"https://router.huggingface.co/hf-inference/models/{model}"
            try:
                response = await client.post(url, headers=headers, json=payload)
            except httpx.HTTPError as exc:
                errors.append(f"{model}: {exc}")
                continue

            if response.status_code != 200:
                errors.append(f"{model}: status {response.status_code}")
                continue

            data = response.json()
            if isinstance(data, list) and data and isinstance(data[0], dict):
                if "generated_text" in data[0]:
                    return str(data[0]["generated_text"]).strip()
            if isinstance(data, dict) and "generated_text" in data:
                return str(data["generated_text"]).strip()
            if isinstance(data, str):
                return data.strip()
            errors.append(f"{model}: unexpected response shape")

    raise HTTPException(
        status_code=502,
        detail=f"All free LLM backends failed. {', '.join(errors[:3])}",
    )


async def _retrieve_chunks(query: str, top_k: int = 5) -> list[dict]:
    if _student_index is None or _student_index.ntotal == 0:
        return []

    query_vec = await _embed_text(query)
    scores, indices = _student_index.search(query_vec.reshape(1, -1), min(top_k, _student_index.ntotal))
    results: list[dict] = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(_student_chunks):
            continue
        chunk = _student_chunks[idx]
        results.append(
            {
                "chunk_id": chunk["chunk_id"],
                "text": chunk["text"],
                "preview": chunk["text"][:220],
                "score": float(score),
            }
        )
    return results


async def _confidence_score(answer: str, sources: list[dict]) -> int:
    if not answer.strip() or not sources:
        return 0

    answer_vec = await _embed_text(answer[:1800])
    source_vecs = []
    retrieval_scores = []
    for source in sources:
        source_vecs.append(await _embed_text(source["text"][:1800]))
        retrieval_scores.append(max(0.0, min(1.0, source.get("score", 0.0))))

    similarity = 0.0
    if source_vecs:
        similarity = max(float(np.dot(answer_vec, vec)) for vec in source_vecs)
        similarity = max(0.0, min(1.0, similarity))

    retrieval_component = int((sum(retrieval_scores) / max(1, len(retrieval_scores))) * 100)
    semantic_component = int(similarity * 100)
    confidence = int(0.45 * retrieval_component + 0.55 * semantic_component)

    if similarity < 0.25:
        confidence = max(10, confidence - 35)
    elif similarity < 0.4:
        confidence = max(15, confidence - 20)

    return max(0, min(100, confidence))


@router.post("/upload")
async def student_upload(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="File is required.")

    content_type = file.content_type or ""
    extracted_text = ""

    filename = (file.filename or "").lower()
    if content_type == "application/pdf" or filename.endswith(".pdf"):
        try:
            contents = await file.read()
            reader = PdfReader(BytesIO(contents))
            extracted_text = "\n".join([(page.extract_text() or "") for page in reader.pages])
        except Exception:
            raise HTTPException(status_code=400, detail="Could not parse PDF.")
    elif content_type.startswith("image/"):
        extracted = await extract_text_from_image(file)
        extracted_text = extracted or ""
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Upload PDF or image notes.",
        )

    extracted_text = _clean_text(extracted_text)[:MAX_FILE_CHARS]
    if not extracted_text:
        raise HTTPException(status_code=400, detail="No readable text found in uploaded file.")

    chunks = _chunk_text(extracted_text)
    if not chunks:
        raise HTTPException(status_code=400, detail="Unable to create chunks from uploaded text.")

    vectors: list[np.ndarray] = []
    for chunk in chunks:
        vectors.append(await _embed_text(chunk))

    if not vectors:
        raise HTTPException(status_code=500, detail="No embeddings could be generated.")

    global _student_index, _student_chunks
    _student_index = faiss.IndexFlatIP(EMBEDDING_DIM)
    matrix = np.stack(vectors).astype(np.float32)
    _student_index.add(matrix)

    _student_chunks = []
    for i, chunk in enumerate(chunks, start=1):
        _student_chunks.append(
            {
                "chunk_id": i,
                "namespace": STUDENT_INDEX_NAME,
                "text": chunk,
            }
        )

    return {"status": "success", "chunks_created": len(_student_chunks)}


@router.post("/ask")
async def student_ask(payload: AskRequest):
    question = (payload.question or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    if _student_index is None or _student_index.ntotal == 0:
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "message": "No uploaded notes found. Upload notes first.",
            },
        )

    sources = await _retrieve_chunks(question, top_k=5)
    if not sources:
        return {
            "answer": "Insufficient information in uploaded material.",
            "explanation_simple": "The notes do not contain enough information to answer this question.",
            "sources": [],
            "confidence": 0,
        }

    context = "\n\n".join([f"[Chunk {s['chunk_id']}] {s['text']}" for s in sources])[:MAX_CONTEXT_CHARS]
    prompt = f"""
You are an academic RAG assistant.
Grounded Mode rules:
1) Answer ONLY using the provided context.
2) If context is insufficient, respond exactly: "Insufficient information in uploaded material."
3) Always cite chunk IDs used.
4) Output strict JSON only.

Context:
{context}

Question:
{question}

Return JSON:
{{
  "answer": "string",
  "explanation_simple": "string (easy English)",
  "used_chunk_ids": [1,2],
  "insufficient": false
}}
""".strip()

    raw = await _generate_text(prompt, max_new_tokens=MAX_OUTPUT_TOKENS_ASK)
    parsed = _extract_json_blob(raw) or {}

    answer = str(parsed.get("answer", "")).strip()
    simple = str(parsed.get("explanation_simple", "")).strip()
    insufficient = bool(parsed.get("insufficient", False))
    used_ids = _coerce_ids(parsed.get("used_chunk_ids", []), max_id=len(_student_chunks))

    if insufficient or not answer:
        return {
            "answer": "Insufficient information in uploaded material.",
            "explanation_simple": "The uploaded notes do not provide enough detail to answer this question safely.",
            "sources": [],
            "confidence": 0,
        }

    filtered_sources = [s for s in sources if s["chunk_id"] in used_ids] if used_ids else sources[:3]
    confidence = await _confidence_score(answer, filtered_sources)

    return {
        "answer": answer[:2200],
        "explanation_simple": simple[:1800] or "This answer is based on the cited chunks.",
        "sources": [
            {
                "chunk_id": s["chunk_id"],
                "preview": s["preview"],
            }
            for s in filtered_sources
        ],
        "confidence": confidence,
    }


@router.post("/generate")
async def student_generate(payload: GenerateRequest):
    if _student_index is None or _student_index.ntotal == 0:
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "message": "No uploaded notes found. Upload notes first.",
            },
        )

    mode = payload.mode
    full_context = "\n\n".join([f"[Chunk {c['chunk_id']}] {c['text']}" for c in _student_chunks])[:MAX_CONTEXT_CHARS]

    schema_map = {
        "summary": """
{
  "summary": "executive summary",
  "evidence_chunk_ids": [1,2,3]
}
""".strip(),
        "keypoints": """
{
  "key_concepts": [
    {"concept":"...", "explanation":"...", "evidence_chunk_ids":[1]}
  ]
}
""".strip(),
        "flashcards": """
{
  "flashcards": [
    {"question":"...", "answer":"...", "evidence_chunk_ids":[1]}
  ]
}
""".strip(),
        "mcq": """
{
  "mcqs": [
    {
      "question":"...",
      "options":{"A":"...","B":"...","C":"...","D":"..."},
      "correct":"A",
      "explanation":"...",
      "evidence_chunk_ids":[1]
    }
  ]
}
""".strip(),
        "viva": """
{
  "viva_questions": [
    {"question":"...", "model_answer":"...", "difficulty":"medium", "evidence_chunk_ids":[1]}
  ]
}
""".strip(),
        "concept_map": """
{
  "concept_relationships": [
    {
      "concept_a":"...",
      "relation":"...",
      "concept_b":"...",
      "explanation":"...",
      "evidence_chunk_ids":[1,2]
    }
  ]
}
""".strip(),
    }

    prompt = f"""
You are an educational assistant in grounded mode.
Use ONLY the context below. If context is insufficient, return an empty valid JSON for the schema.
Return strict JSON only. No markdown.

Mode: {mode}
Context:
{full_context}

Output schema:
{schema_map[mode]}
""".strip()

    raw = await _generate_text(prompt, max_new_tokens=MAX_OUTPUT_TOKENS_GENERATE)
    parsed = _extract_json_blob(raw)
    if not parsed:
        raise HTTPException(status_code=502, detail="Model did not return valid JSON.")

    validated = _validate_mode_output(mode, parsed, max_id=len(_student_chunks))
    return {"mode": mode, "data": validated}
