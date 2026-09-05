"""
SaaS foundation routes: workspaces, documents, jobs, research, code, billing, usage.
These are isolated from the existing analyzer flow.
"""

from __future__ import annotations

import re
from io import BytesIO
from typing import Any

from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from pydantic import BaseModel
from pypdf import PdfReader

from services.ai_gateway import choose_model_tier, embed_text, generate_text
from services.job_runner import enqueue_job, get_job
from services.ocr import extract_text_from_image
from services.workspace_store import (
    add_document,
    add_message,
    add_usage_event,
    get_or_create_workspace,
    list_documents,
    list_messages,
    plans_catalog,
    subscription_summary,
    usage_summary,
)

router = APIRouter(prefix="", tags=["saas"])


class ResearchRequest(BaseModel):
    query: str


class CodeRequest(BaseModel):
    prompt: str
    code_context: str | None = None
    language: str | None = None


class ChatRequest(BaseModel):
    message: str
    module: str = "workspace"


def _workspace_id(header_value: str | None) -> str:
    return header_value.strip() if header_value and header_value.strip() else "default"


def _clean_text(text: str) -> str:
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _chunk_text(text: str, target_words: int = 280) -> list[dict[str, Any]]:
    words = text.split()
    chunks: list[dict[str, Any]] = []
    for start in range(0, len(words), target_words):
        body = " ".join(words[start:start + target_words]).strip()
        if body:
            chunks.append({"chunk_id": len(chunks) + 1, "text": body, "source": "document"})
    return chunks


async def _read_upload_text(file: UploadFile) -> str:
    filename = (file.filename or "").lower()
    content_type = file.content_type or ""

    if content_type == "application/pdf" or filename.endswith(".pdf"):
        contents = await file.read()
        reader = PdfReader(BytesIO(contents))
        return "\n".join((page.extract_text() or "") for page in reader.pages)

    if content_type.startswith("image/"):
        return await extract_text_from_image(file) or ""

    contents = await file.read()
    try:
        return contents.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="Unsupported document encoding.") from exc


async def _score_chunks(query: str, chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not chunks:
        return []

    query_vec = await embed_text(query)
    scored: list[dict[str, Any]] = []
    for chunk in chunks:
        chunk_vec = await embed_text(chunk["text"])
        score = float(query_vec.dot(chunk_vec))
        scored.append({**chunk, "score": round(score, 4)})

    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[:5]


def _sync_prepare_document(name: str, content_type: str, text: str) -> dict[str, Any]:
    cleaned = _clean_text(text)
    if not cleaned:
        raise ValueError("No readable content found in uploaded file.")
    chunks = _chunk_text(cleaned)
    return {
        "name": name,
        "content_type": content_type,
        "text": cleaned,
        "chunks": chunks,
        "chunk_count": len(chunks),
    }


@router.get("/workspaces/current")
async def get_current_workspace(x_workspace_id: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    workspace_id = _workspace_id(x_workspace_id)
    workspace = get_or_create_workspace(workspace_id, owner_id=x_user_id or "anonymous")
    return {
        "workspace": workspace,
        "subscription": subscription_summary(workspace_id),
        "documents": len(list_documents(workspace_id)),
        "messages": len(list_messages(workspace_id)),
    }


@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    x_workspace_id: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
):
    workspace_id = _workspace_id(x_workspace_id)
    get_or_create_workspace(workspace_id, owner_id=x_user_id or "anonymous")

    text = await _read_upload_text(file)
    job = enqueue_job(
        "document_ingestion",
        workspace_id,
        _sync_prepare_document,
        file.filename or "upload",
        file.content_type or "application/octet-stream",
        text,
        payload={"filename": file.filename},
    )
    return {"status": "accepted", "job_id": job["id"]}


@router.get("/documents")
async def documents_list(x_workspace_id: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    workspace_id = _workspace_id(x_workspace_id)
    get_or_create_workspace(workspace_id, owner_id=x_user_id or "anonymous")
    return {"documents": list_documents(workspace_id)}


@router.get("/jobs/{job_id}")
async def job_status(job_id: str, x_workspace_id: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    workspace_id = _workspace_id(x_workspace_id)
    get_or_create_workspace(workspace_id, owner_id=x_user_id or "anonymous")

    job = get_job(job_id)
    if not job or job["workspace_id"] != workspace_id:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job["status"] == "completed" and job["type"] == "document_ingestion" and job["result"] and not job["result"].get("persisted"):
        result = job["result"]
        add_document(workspace_id, result["name"], result["content_type"], result["text"], result["chunks"])
        add_usage_event(workspace_id, "document_upload", units=1, metadata={"chunks": result["chunk_count"]})
        result["persisted"] = True

    return job


@router.post("/research/answer")
async def research_answer(payload: ResearchRequest, x_workspace_id: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    workspace_id = _workspace_id(x_workspace_id)
    get_or_create_workspace(workspace_id, owner_id=x_user_id or "anonymous")

    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    all_chunks = [chunk for doc in list_documents(workspace_id) for chunk in doc["chunks"]]
    sources = await _score_chunks(query, all_chunks)
    context = "\n\n".join([f"[Chunk {item['chunk_id']}] {item['text']}" for item in sources])[:6000]
    if not context:
        return {
            "answer": "Insufficient information in workspace documents.",
            "sources": [],
            "mode": "local-grounded",
            "model_route": choose_model_tier("research"),
        }

    prompt = f"""
You are a grounded research assistant.
Answer using only the provided context.
If the context is insufficient, say exactly: Insufficient information in workspace documents.
Keep the answer concise and cite chunk IDs.

Context:
{context}

Question:
{query}
""".strip()

    answer = await generate_text(prompt, task_type="research", complexity="high", max_new_tokens=360)
    add_message(workspace_id, "research", "user", query)
    add_message(workspace_id, "research", "assistant", answer)
    add_usage_event(workspace_id, "research_query", units=1)

    return {
        "answer": answer,
        "sources": [{"chunk_id": item["chunk_id"], "preview": item["text"][:220], "score": item["score"]} for item in sources],
        "mode": "local-grounded",
        "model_route": choose_model_tier("research", "high"),
    }


@router.post("/code/ask")
async def code_ask(payload: CodeRequest, x_workspace_id: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    workspace_id = _workspace_id(x_workspace_id)
    get_or_create_workspace(workspace_id, owner_id=x_user_id or "anonymous")

    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    code_context = (payload.code_context or "").strip()
    language = (payload.language or "unknown").strip()
    full_prompt = f"""
You are a coding copilot.
Return practical, implementation-ready help.
Prefer patch-style guidance, explicit file suggestions, and risk notes.

Language: {language}
Task:
{prompt}

Code Context:
{code_context[:7000]}
""".strip()

    answer = await generate_text(full_prompt, task_type="code", complexity="high", max_new_tokens=520)
    add_message(workspace_id, "code", "user", prompt)
    add_message(workspace_id, "code", "assistant", answer)
    add_usage_event(workspace_id, "code_query", units=1, metadata={"language": language})

    return {
        "answer": answer,
        "model_route": choose_model_tier("code", "high"),
        "patch_mode": True,
    }


@router.post("/ai/chat")
async def ai_chat(payload: ChatRequest, x_workspace_id: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    workspace_id = _workspace_id(x_workspace_id)
    get_or_create_workspace(workspace_id, owner_id=x_user_id or "anonymous")

    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    module = payload.module.strip() or "workspace"
    prompt = f"""
You are the workspace copilot for an AI SaaS platform.
Route style: concise, actionable, premium-product tone.
Current module: {module}
User message: {message}
""".strip()

    answer = await generate_text(prompt, task_type="general", complexity="default", max_new_tokens=260)
    add_message(workspace_id, module, "user", message)
    add_message(workspace_id, module, "assistant", answer)
    add_usage_event(workspace_id, "chat_message", units=1, metadata={"module": module})
    return {"answer": answer, "module": module}


@router.get("/usage/summary")
async def usage_stats(x_workspace_id: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    workspace_id = _workspace_id(x_workspace_id)
    get_or_create_workspace(workspace_id, owner_id=x_user_id or "anonymous")
    return usage_summary(workspace_id)


@router.get("/billing/plans")
async def billing_plans():
    return {"plans": plans_catalog()}
