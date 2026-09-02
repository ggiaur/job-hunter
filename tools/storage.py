"""Persistent job state with freshness-aware identity and duplicate handling.

Replaces job-searcher/tools/storage.py:87-109, where a URL was a duplicate
forever.  The public legacy methods remain available for the bot and callers.
"""
import hashlib
import json
import logging
import os
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

logger = logging.getLogger(__name__)
STALE_AFTER_DAYS = 14

def _utc_now_iso() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")

def canonical_url(url: str) -> str:
    """Drop trackers/fragments; retain meaningful query parameters."""
    parts = urlsplit(url.strip())
    query = urlencode(sorted((k, v) for k, v in parse_qsl(parts.query) if not k.lower().startswith(("utm_", "fbclid", "gclid"))))
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip("/"), query, ""))

def content_fingerprint(job: dict[str, Any]) -> str:
    text = " ".join(str(job.get(k, "")).strip().lower() for k in ("title", "company", "location", "description"))
    return hashlib.sha256(" ".join(text.split()).encode()).hexdigest()

class JobStorage:
    def __init__(self, project_id: str | None = None, mock_mode: bool | None = None):
        self.mock_mode = mock_mode if mock_mode is not None else os.getenv("MOCK_MODE", "false").lower() == "true"
        self.project_id = (project_id or os.getenv("GCP_PROJECT_ID", "mock-project")).strip()
        self.db = None
        self.mock_records: dict[str, dict[str, Any]] = {}
        self.mock_data: list[str] = []
        if self.mock_mode:
            fixture = os.path.join(os.path.dirname(__file__), "..", "tests", "fixtures", "mock_firestore.json")
            if os.path.exists(fixture):
                data = json.load(open(fixture, encoding="utf-8"))
                for url in data.get("saved_jobs", []):
                    self.mock_records[canonical_url(url)] = {"url": canonical_url(url), "first_seen": _utc_now_iso(), "last_seen": _utc_now_iso(), "state": "open"}
                self.mock_data = list(data.get("saved_jobs", []))
        else:
            try:
                from google.cloud import firestore
                self.db = firestore.Client(project=self.project_id)
            except Exception as exc:
                raise RuntimeError(f"Firestore connection failed: {exc}") from exc

    def identity(self, job: dict[str, Any]) -> str:
        source = str(job.get("source", "unknown")).lower()
        source_id = str(job.get("source_job_id") or canonical_url(str(job.get("url", ""))))
        return hashlib.sha256(f"{source}|{source_id}".encode()).hexdigest()

    def observe(self, job: dict[str, Any], now: datetime | None = None) -> dict[str, Any]:
        """Upsert observation; returns current/change/reopen/notified decisions."""
        now = now or datetime.now(UTC); stamp = now.strftime("%Y-%m-%dT%H:%M:%SZ")
        url = canonical_url(str(job.get("url", ""))); key = self.identity({**job, "url": url})
        fp = content_fingerprint(job); old = self.mock_records.get(key)
        if old is None:
            record = {**job, "url": url, "identity": key, "fingerprint": fp, "first_seen": stamp, "last_seen": stamp, "posted_at": job.get("posted_at"), "closing_at": job.get("closing_at"), "state": "open", "notified": False}
            self.mock_records[key] = record; self.mock_data.append(url)
            return {"record": record, "active": True, "changed": True, "reopened": False, "already_notified": False}
        previous_state, previous_fp = old.get("state", "unknown"), old.get("fingerprint")
        old.update({**job, "url": url, "fingerprint": fp, "last_seen": stamp, "posted_at": job.get("posted_at") or old.get("posted_at"), "closing_at": job.get("closing_at") or old.get("closing_at"), "state": "open"})
        changed, reopened = previous_fp != fp, previous_state != "open"
        return {"record": old, "active": True, "changed": changed, "reopened": reopened, "already_notified": bool(old.get("notified")) and not (changed or reopened)}

    def expire_stale(self, now: datetime | None = None) -> int:
        now = now or datetime.now(UTC); count = 0
        for rec in self.mock_records.values():
            if rec.get("state") == "closed": continue
            last = datetime.strptime(rec["last_seen"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=UTC)
            closing = rec.get("closing_at")
            closed_at = datetime.fromisoformat(closing.replace("Z", "+00:00")) if closing else None
            if now - last >= timedelta(days=STALE_AFTER_DAYS) or (closed_at and closed_at <= now):
                rec["state"] = "closed" if closed_at and closed_at <= now else "stale"; count += 1
        return count

    def mark_notified(self, job: dict[str, Any]) -> None:
        rec = self.mock_records.get(self.identity(job))
        if rec: rec["notified"] = True

    # Backwards-compatible methods.
    def is_duplicate(self, url: str) -> bool:
        normalized = canonical_url(url)
        return any(rec.get("url") == normalized and rec.get("state") == "open" for rec in self.mock_records.values())
    def save_job(self, job: dict[str, Any]) -> bool:
        result = self.observe(job)
        if result["already_notified"]: return False
        self.mark_notified(job); return True
    def create_run_log(self, run_id: str) -> bool:
        if not run_id: return False
        if not hasattr(self, "mock_run_logs"): self.mock_run_logs = {}
        self.mock_run_logs[run_id] = {"run_id": run_id, "start_time": _utc_now_iso(), "status": "running"}; return True
    def update_run_log(self, run_id: str, status: str, metrics: dict[str, Any]) -> bool:
        if not run_id: return False
        self.mock_run_logs.setdefault(run_id, {}).update({"status": status, "end_time": _utc_now_iso(), **{k: metrics.get(k, 0) for k in ("found", "relevant", "duplicate", "sent", "errors")}}); return True
    def get_recent_jobs(self, days: int = 30) -> list[dict[str, Any]]: return list(self.mock_records.values())
    def save_feedback(self, url: str, rating: str) -> bool:
        if not url: return False
        if not hasattr(self, "mock_feedback"): self.mock_feedback = []
        self.mock_feedback.append({"url": url, "rating": rating, "timestamp": _utc_now_iso()}); return True
    def _sanitize_doc_id(self, url: str) -> str: return hashlib.sha256(url.encode()).hexdigest()
