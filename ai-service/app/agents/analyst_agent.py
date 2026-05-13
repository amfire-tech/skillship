"""
File:    ai-service/app/agents/analyst_agent.py
Purpose: Analyst agent — turns raw school metrics into a weekly narrative report.
"""

# PLAN 02 ONLY — not in scope for Plan 01. Code commented out.

# from __future__ import annotations
# import json
# import logging
# from pathlib import Path
#
# from google import genai
# from google.genai import types
#
# from app.config import settings
#
# logger = logging.getLogger(__name__)
#
# SYSTEM_PROMPT = (
#     Path(__file__).parent.parent / "prompts" / "analyst.md"
# ).read_text(encoding="utf-8")
#
#
# async def weekly(client: genai.Client, school_snapshot: dict) -> dict:
#     prompt = f"Here is this week's school data snapshot:\n\n{json.dumps(school_snapshot, indent=2)}"
#
#     response = await client.aio.models.generate_content(
#         model=settings.MODEL_NAME,
#         contents=prompt,
#         config=types.GenerateContentConfig(
#             system_instruction=SYSTEM_PROMPT,
#             response_mime_type="application/json",
#         ),
#     )
#
#     result = json.loads(response.text)
#     logger.info("Analyst report: %d highlights, %d concerns",
#                 len(result.get("highlights", [])), len(result.get("concerns", [])))
#     return result
