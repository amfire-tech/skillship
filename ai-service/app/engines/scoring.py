"""
File:    ai-service/app/engines/scoring.py
Purpose: LLM-assisted grading for SHORT-answer questions.
"""

from __future__ import annotations

import logging

from google import genai
from google.genai import types

from app.config import settings
from app.utils.json import parse_llm_json

logger = logging.getLogger(__name__)

_SYSTEM = """You are a strict but fair examiner grading a student's short-answer response.
Return ONLY a JSON object: {"score": 0.0-1.0, "feedback": "one encouraging sentence"}"""


async def grade_short(
    client: genai.Client,
    question_text: str,
    rubric: str,
    student_answer: str,
) -> dict:
    if settings.USE_MOCK_AI:
        logger.info("Mock mode enabled; graded short answer without Gemini")
        return {"score": 0.7, "feedback": "Good start; add one specific detail to improve it."}

    prompt = (
        f"Question: {question_text}\n\n"
        f"Rubric: {rubric}\n\n"
        f"Student answer: {student_answer}"
    )

    response = await client.aio.models.generate_content(
        model=settings.MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=_SYSTEM,
            response_mime_type="application/json",
        ),
    )

    result = parse_llm_json(response.text, expected="object")
    score = max(0.0, min(1.0, float(result["score"])))
    logger.info("Graded short answer: score=%.2f", score)
    return {"score": score, "feedback": str(result.get("feedback", ""))}
