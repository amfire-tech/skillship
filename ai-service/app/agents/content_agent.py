"""
File:    ai-service/app/agents/content_agent.py
Purpose: Content agent — auto-tags uploaded content with topic, grade, difficulty, prerequisites.
"""

# PLAN 02 ONLY — not in scope for Plan 01. Code commented out.

# from __future__ import annotations
# import json
# import logging
#
# from google import genai
# from google.genai import types
#
# from app.config import settings
#
# logger = logging.getLogger(__name__)
#
# _SYSTEM = """You are a curriculum metadata expert for Skillship, an Indian online learning platform.
# Given a learning resource, extract structured metadata.
# Return ONLY a JSON object:
# {"tags": ["tag1","tag2"], "summary": "One sentence max 20 words",
#  "grade_level": "Grade X", "difficulty": "beginner"|"intermediate"|"advanced",
#  "prerequisites": ["concept1"]}
# Rules: 4–8 tags, Indian grade numbering, max 3 prerequisites."""
#
#
# async def tag(
#     client: genai.Client,
#     title: str,
#     description: str,
#     kind: str,
#     file_url: str = "",
# ) -> dict:
#     prompt = (
#         f"Content type: {kind}\nTitle: {title}\nDescription: {description}\n"
#         + (f"URL: {file_url}" if file_url else "")
#     )
#
#     response = await client.aio.models.generate_content(
#         model=settings.MODEL_NAME,
#         contents=prompt,
#         config=types.GenerateContentConfig(
#             system_instruction=_SYSTEM,
#             response_mime_type="application/json",
#         ),
#     )
#
#     result = json.loads(response.text)
#     logger.info("Content tagged: '%s' → %s", title, result.get("tags", []))
#     return result
