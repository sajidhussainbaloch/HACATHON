"""
Simple background job runner.
Designed as an internal stepping stone toward Redis-backed workers on VPS.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Callable
from uuid import uuid4

_executor = ThreadPoolExecutor(max_workers=4)
_jobs: dict[str, dict[str, Any]] = {}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_job(job_type: str, workspace_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    job_id = str(uuid4())
    job = {
        "id": job_id,
        "type": job_type,
        "workspace_id": workspace_id,
        "status": "queued",
        "payload": payload or {},
        "result": None,
        "error": None,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    _jobs[job_id] = job
    return job


def get_job(job_id: str) -> dict[str, Any] | None:
    return _jobs.get(job_id)


def enqueue_job(
    job_type: str,
    workspace_id: str,
    func: Callable[..., Any],
    *args: Any,
    payload: dict[str, Any] | None = None,
    **kwargs: Any,
) -> dict[str, Any]:
    job = create_job(job_type, workspace_id, payload=payload)

    def runner() -> None:
        _jobs[job["id"]]["status"] = "running"
        _jobs[job["id"]]["updated_at"] = now_iso()
        try:
            result = func(*args, **kwargs)
            _jobs[job["id"]]["result"] = result
            _jobs[job["id"]]["status"] = "completed"
        except Exception as exc:
            _jobs[job["id"]]["error"] = str(exc)
            _jobs[job["id"]]["status"] = "failed"
        finally:
            _jobs[job["id"]]["updated_at"] = now_iso()

    _executor.submit(runner)
    return job
