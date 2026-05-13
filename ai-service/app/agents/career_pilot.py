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


async def run(
    client: genai.Client,
    student_context: dict,
    question: str,
    history: list[dict],
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
    user_message = f"Student profile:\n{context_lines}\n\nQuestion: {question}"

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
