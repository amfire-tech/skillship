"""
File:    ai-service/app/utils/llm.py
Purpose: Single entry point for Gemini generate_content with model fallback —
         tries MODEL_NAME first and switches to FALLBACK_MODEL_NAME when the
         primary hits its rate/quota limit (429 RESOURCE_EXHAUSTED).
Owner:   Navanish
"""

from __future__ import annotations

import logging
import time

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

# After a model returns 429 we skip it for this long, so we don't spend a
# doomed request on it before every fallback call.
_COOLDOWN_SECONDS = 60.0
_cooldown_until: dict[str, float] = {}


def _models() -> list[str]:
    models = [settings.MODEL_NAME]
    if settings.FALLBACK_MODEL_NAME and settings.FALLBACK_MODEL_NAME != settings.MODEL_NAME:
        models.append(settings.FALLBACK_MODEL_NAME)
    return models


async def generate_content(
    client: genai.Client,
    *,
    contents,
    config: types.GenerateContentConfig | None = None,
) -> types.GenerateContentResponse:
    models = _models()
    now = time.monotonic()
    # Models still cooling down go last rather than being dropped — if every
    # model is rate-limited we still try them all before giving up.
    ordered = sorted(models, key=lambda m: _cooldown_until.get(m, 0.0) > now)

    last_error: genai_errors.APIError | None = None
    for model in ordered:
        try:
            response = await client.aio.models.generate_content(
                model=model, contents=contents, config=config,
            )
        except genai_errors.APIError as exc:
            if exc.code != 429:
                raise
            _cooldown_until[model] = time.monotonic() + _COOLDOWN_SECONDS
            logger.warning("Gemini %s rate-limited (429) — trying next model", model)
            last_error = exc
            continue
        if model != settings.MODEL_NAME:
            logger.info("Served by fallback model %s", model)
        return response

    assert last_error is not None
    raise last_error
