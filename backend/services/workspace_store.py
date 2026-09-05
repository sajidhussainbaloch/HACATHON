"""
In-memory SaaS workspace store.
This provides workspace-scoped state until persistent tables are added.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


_workspaces: dict[str, dict[str, Any]] = {}
_documents: dict[str, list[dict[str, Any]]] = {}
_conversations: dict[str, list[dict[str, Any]]] = {}
_usage_events: dict[str, list[dict[str, Any]]] = {}
_subscriptions: dict[str, dict[str, Any]] = {}


def get_or_create_workspace(workspace_id: str, owner_id: str | None = None) -> dict[str, Any]:
    if workspace_id not in _workspaces:
        _workspaces[workspace_id] = {
            "id": workspace_id,
            "name": "Default Workspace" if workspace_id == "default" else f"Workspace {workspace_id[:8]}",
            "owner_id": owner_id or "anonymous",
            "plan": "starter",
            "created_at": now_iso(),
            "members": [owner_id or "anonymous"],
        }
        _subscriptions[workspace_id] = {
            "workspace_id": workspace_id,
            "plan": "starter",
            "status": "active",
            "storage_limit_mb": 250,
            "monthly_ai_credits": 250,
        }
        _documents.setdefault(workspace_id, [])
        _conversations.setdefault(workspace_id, [])
        _usage_events.setdefault(workspace_id, [])
    return _workspaces[workspace_id]


def add_document(workspace_id: str, name: str, content_type: str, text: str, chunks: list[dict[str, Any]]) -> dict[str, Any]:
    document = {
        "id": str(uuid4()),
        "workspace_id": workspace_id,
        "name": name,
        "content_type": content_type,
        "text_preview": text[:280],
        "text_length": len(text),
        "chunks": chunks,
        "created_at": now_iso(),
    }
    _documents.setdefault(workspace_id, []).append(document)
    return document


def list_documents(workspace_id: str) -> list[dict[str, Any]]:
    return _documents.get(workspace_id, [])


def add_message(workspace_id: str, module: str, role: str, content: str) -> None:
    _conversations.setdefault(workspace_id, []).append(
        {
            "id": str(uuid4()),
            "module": module,
            "role": role,
            "content": content,
            "created_at": now_iso(),
        }
    )


def list_messages(workspace_id: str) -> list[dict[str, Any]]:
    return _conversations.get(workspace_id, [])


def add_usage_event(workspace_id: str, event_type: str, units: int = 1, metadata: dict[str, Any] | None = None) -> None:
    _usage_events.setdefault(workspace_id, []).append(
        {
            "id": str(uuid4()),
            "type": event_type,
            "units": units,
            "metadata": metadata or {},
            "created_at": now_iso(),
        }
    )


def usage_summary(workspace_id: str) -> dict[str, Any]:
    events = _usage_events.get(workspace_id, [])
    documents = _documents.get(workspace_id, [])
    return {
        "workspace_id": workspace_id,
        "documents_total": len(documents),
        "document_chars_total": sum(doc["text_length"] for doc in documents),
        "events_total": len(events),
        "event_breakdown": {
            "uploads": sum(1 for e in events if e["type"] == "document_upload"),
            "research_queries": sum(1 for e in events if e["type"] == "research_query"),
            "code_queries": sum(1 for e in events if e["type"] == "code_query"),
            "chat_messages": sum(1 for e in events if e["type"] == "chat_message"),
        },
    }


def subscription_summary(workspace_id: str) -> dict[str, Any]:
    get_or_create_workspace(workspace_id)
    return _subscriptions[workspace_id]


def plans_catalog() -> list[dict[str, Any]]:
    return [
        {"id": "starter", "name": "Starter", "price_monthly": 0, "ai_credits": 250, "storage_mb": 250},
        {"id": "pro", "name": "Pro", "price_monthly": 29, "ai_credits": 5000, "storage_mb": 5000},
        {"id": "team", "name": "Team", "price_monthly": 99, "ai_credits": 25000, "storage_mb": 25000},
    ]
