"""
File:    backend/apps/ai_bridge/services.py
Purpose: AiJob lifecycle for the four Plan 01 AI features.
Owner:   Navanish

Contract with views.py:
  - Each function creates an AiJob, drives it through PENDING → RUNNING → DONE/FAILED,
    and returns the response dict on success.
  - On failure it re-raises AiServiceUnavailable so the view returns a clean 503
    without ever importing httpx or AiClient.
  - Views are responsible for building the full AI-service payload. Services do not
    reach into Vishal's models (quizzes, content) — that enrichment happens in views
    once those models exist.

DB transaction note:
  The three saves (create, running, done/failed) are each auto-committed because
  AI views are decorated with @transaction.non_atomic_requests in urls.py.
  ATOMIC_REQUESTS does not hold a connection open for the duration of the AI call.
"""

from __future__ import annotations

import logging
import time
from collections.abc import Callable
from typing import Any

from apps.accounts.models import User
from apps.schools.models import School

from .client import AiServiceError, AiServiceUnavailable, ai_client
from .models import AiJob

logger = logging.getLogger(__name__)

_Kind = AiJob.Kind
_Status = AiJob.Status


def _execute(
    *,
    kind: str,
    school: School,
    created_by: User,
    payload: dict[str, Any],
    call: Callable[[dict[str, Any]], dict[str, Any]],
) -> dict[str, Any]:
    job = AiJob.objects.create(
        kind=kind,
        school=school,
        created_by=created_by,
        status=_Status.PENDING,
        request_json=payload,
    )

    job.status = _Status.RUNNING
    job.save(update_fields=["status", "updated_at"])

    t0 = time.perf_counter()
    try:
        response = call(payload)
        duration_ms = int((time.perf_counter() - t0) * 1000)

        usage = response.get("usage") or {}
        job.status        = _Status.DONE
        job.response_json = response
        job.duration_ms   = duration_ms
        job.model_used    = response.get("model_used", "")
        job.tokens_in     = usage.get("tokens_in")
        job.tokens_out    = usage.get("tokens_out")
        job.cost_inr      = usage.get("cost_inr")
        job.save(update_fields=[
            "status", "response_json", "duration_ms",
            "model_used", "tokens_in", "tokens_out", "cost_inr", "updated_at",
        ])
        return response

    except (AiServiceUnavailable, AiServiceError) as exc:
        duration_ms = int((time.perf_counter() - t0) * 1000)
        job.status      = _Status.FAILED
        job.error       = str(exc)
        job.duration_ms = duration_ms
        job.save(update_fields=["status", "error", "duration_ms", "updated_at"])
        logger.error("ai_bridge: job %s FAILED — %s", job.id, exc)
        raise


def career_ask(*, school: School, user: User, payload: dict[str, Any]) -> dict[str, Any]:
    return _execute(
        kind=_Kind.CAREER, school=school, created_by=user,
        payload=payload, call=ai_client.career_ask,
    )


def generate_questions(*, school: School, user: User, payload: dict[str, Any]) -> dict[str, Any]:
    return _execute(
        kind=_Kind.QUESTION_GEN, school=school, created_by=user,
        payload=payload, call=ai_client.generate_questions,
    )


def adaptive_next(*, school: School, user: User, payload: dict[str, Any]) -> dict[str, Any]:
    return _execute(
        kind=_Kind.ADAPTIVE_NEXT, school=school, created_by=user,
        payload=payload, call=ai_client.adaptive_next,
    )


def content_search(*, school: School, user: User, payload: dict[str, Any]) -> dict[str, Any]:
    return _execute(
        kind=_Kind.CONTENT_SEARCH, school=school, created_by=user,
        payload=payload, call=ai_client.content_search,
    )
