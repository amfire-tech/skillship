"""
File:    ai-service/app/agents/career_pilot.py
Purpose: CareerPilot agent — personalised career path suggestions.
"""

from __future__ import annotations

import logging
from pathlib import Path

from google import genai
from google.genai import types

from app.config import settings
from app.utils.json import parse_llm_json

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    Path(__file__).parent.parent / "prompts" / "career_pilot.md"
).read_text(encoding="utf-8")

# Human-readable names so the model never has to guess what a code means.
_LANG_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "gu": "Gujarati",
    "mr": "Marathi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "or": "Odia",
    "ur": "Urdu",
}


def _language_directive(language: str) -> str:
    """Per-request reply-language rule appended to the user turn.

    Detection of the student's message is ALWAYS primary; the `language` hint is
    only a fallback for messages too short/ambiguous to detect.
    """
    code = (language or "auto").strip().lower()
    if code and code != "auto":
        name = _LANG_NAMES.get(code, code)
        fallback = (
            f"If the message is too short or ambiguous to tell, reply in {name}."
        )
    else:
        fallback = "If the message is too short or ambiguous to tell, reply in English."
    return (
        "LANGUAGE: Detect the language of the student's latest message by meaning "
        "— including Indian languages typed in Latin/Roman letters (e.g. romanized "
        "Gujarati, Hindi, Marathi ('mala ... banaycha aahe'), Tamil, Telugu, Bengali). "
        "Write EVERY field of your JSON reply (`answer`, `suggested_paths`, and "
        "citation text) ENTIRELY in THAT language using its NATIVE script — romanized "
        "Gujarati → ગુજરાતી, romanized Marathi/Hindi → देवनागरी, romanized Tamil → தமிழ். "
        "Every single sentence must be in that language: do NOT start in it and then "
        "switch to English. Keep only widely-used proper nouns and exam names "
        "(JEE, NEET, IAS, UPSC, IIT) as-is. " + fallback
    )


async def run(
    client: genai.Client,
    student_context: dict,
    question: str,
    history: list[dict],
    language: str = "auto",
) -> dict:
    if settings.USE_MOCK_AI:
        logger.info("Mock mode enabled; returned CareerPilot response without Gemini")
        return {
            "answer": (
                "Based on your profile, start with one practical path and validate it "
                "through projects and mentor feedback."
            ),
            "suggested_paths": ["AI Foundations", "Coding", "STEM Research"],
            "confidence": 0.7,
            "citations": [
                {"label": "Mock profile", "detail": "Generated from local dev mock mode."}
            ],
        }

    context_lines = "\n".join(f"  {k}: {v}" for k, v in student_context.items())
    user_message = (
        f"Student profile:\n{context_lines}\n\n"
        f"Question: {question}\n\n"
        f"{_language_directive(language)}"
    )

    contents = [
        {
            "role": "model" if m["role"] == "assistant" else "user",
            "parts": [{"text": m["content"]}],
        }
        for m in history[-6:]
    ]
    contents.append({"role": "user", "parts": [{"text": user_message}]})

    response = await client.aio.models.generate_content(
        model=settings.MODEL_NAME,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
        ),
    )

    return parse_llm_json(response.text, expected="object")
