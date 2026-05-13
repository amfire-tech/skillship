"""
File:    backend/apps/ai_bridge/client.py
Purpose: Synchronous httpx client — the only place in Django that calls the AI service.
Owner:   Navanish

Design rules:
  - Every request carries X-Internal-Key so the AI service rejects direct browser calls.
  - 5xx responses and transport errors are retried up to three times with exponential
    back-off (1 s, 2 s, 4 s). 4xx errors are not retried — they indicate a bad payload.
  - Only AiClient, AiServiceUnavailable, AiServiceError, and the module-level
    ai_client singleton are public. httpx never leaks to callers.
  - Thread-safety: httpx.Client is thread-safe. The module-level singleton is safe to
    share across gunicorn threads — each pre-fork worker process gets its own copy.
"""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(connect=5.0, read=30.0, write=10.0, pool=5.0)
_RETRYABLE_STATUS = frozenset({500, 502, 503, 504})
_MAX_RETRIES = 3
_BACKOFF_SECONDS = (1.0, 2.0, 4.0)  # delay before attempt 2, 3, 4


class AiServiceUnavailable(Exception):
    """AI service is unreachable or consistently returning 5xx."""


class AiServiceError(Exception):
    """AI service returned a non-retryable error (4xx or malformed JSON)."""


class AiClient:
    """Thin, synchronous wrapper around the FastAPI ai-service."""

    def __init__(self) -> None:
        self._http = httpx.Client(
            base_url=settings.AI_SERVICE_URL,
            headers={
                "X-Internal-Key": settings.AI_SERVICE_INTERNAL_KEY,
                "Content-Type": "application/json",
            },
            timeout=_TIMEOUT,
        )

    # ── Plan 01 endpoints only ────────────────────────────────────────────────

    def career_ask(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._post("/api/career/ask", payload)

    def generate_questions(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._post("/api/quiz/generate", payload)

    def adaptive_next(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._post("/api/quiz/adaptive-next", payload)

    def content_search(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._post("/api/content/search", payload)

    # ── Internal ──────────────────────────────────────────────────────────────

    def _post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        last_exc: Exception | None = None

        for attempt, backoff in enumerate(_BACKOFF_SECONDS, start=1):
            try:
                r = self._http.post(path, json=body)

                if r.status_code in _RETRYABLE_STATUS:
                    if attempt < _MAX_RETRIES:
                        logger.warning(
                            "ai_bridge: %s → %s, retry %d/%d",
                            path, r.status_code, attempt, _MAX_RETRIES,
                        )
                        time.sleep(backoff)
                        continue
                    raise AiServiceUnavailable(
                        f"ai-service returned {r.status_code} after {_MAX_RETRIES} attempts"
                    )

                if r.status_code >= 400:
                    raise AiServiceError(
                        f"ai-service {path} → {r.status_code}: {r.text[:300]}"
                    )

                return r.json()

            except (httpx.TimeoutException, httpx.ConnectError) as exc:
                last_exc = exc
                if attempt < _MAX_RETRIES:
                    logger.warning(
                        "ai_bridge: %s transport error, retry %d/%d — %s",
                        path, attempt, _MAX_RETRIES, exc,
                    )
                    time.sleep(backoff)

        raise AiServiceUnavailable(
            f"ai-service unreachable after {_MAX_RETRIES} attempts: {last_exc}"
        )

    def close(self) -> None:
        self._http.close()


# One connection pool per Django worker process.
ai_client = AiClient()
