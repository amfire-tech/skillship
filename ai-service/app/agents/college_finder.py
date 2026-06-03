"""
File:    ai-service/app/agents/college_finder.py
Purpose: Recommend Indian colleges for a given (state, city, specialization)
         tuple, ranked by NIRF where possible.
Owner:   Navanish

Caveat: NIRF rankings change yearly and Gemini's knowledge has a cutoff. The
agent is instructed to mark `nirf_rank=null` rather than invent a number when
uncertain — never fabricate rankings that mislead a student / parent.
"""

from __future__ import annotations

import logging

from google import genai
from google.genai import types

from app.config import settings
from app.utils.json import parse_llm_json

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are a college recommendation expert for Indian students. Given a state, city, and specialization, return up to 8 colleges ranked by NIRF (National Institutional Ranking Framework) where rankings are available, otherwise by widely accepted academic reputation.

RULES:
- Prioritise colleges in or near the requested city, but you MAY include the top 2-3 colleges from elsewhere in the state if local options are weak in this specialization.
- For each college, set `nirf_rank` to the most recent NIRF discipline rank you are confident about. If you don't know, set it to null. NEVER guess a number.
- `type` must be one of: "Government", "Private", "Deemed", "Autonomous".
- `why_recommended` should be 1-2 sentences specific to the student's specialization — not generic marketing copy.
- `typical_cutoff` is optional; only include if you have a credible figure (e.g. "JEE Main: 95+ percentile", "MHT-CET: 99+").
- Return ONLY valid JSON matching this exact shape:

{
  "state": "<state>",
  "city": "<city>",
  "specialization": "<specialization>",
  "results": [
    {
      "name": "...",
      "city": "...",
      "state": "...",
      "type": "Government|Private|Deemed|Autonomous",
      "nirf_rank": 1 | null,
      "nirf_score": 90.5 | null,
      "why_recommended": "...",
      "typical_cutoff": "..." | null,
      "website": "..." | null
    }
  ],
  "note": "Brief caveat about data freshness or sub-discipline overlap."
}

Order `results` so the most recommended college comes first.
"""


def _mock_response(state: str, city: str, specialization: str) -> dict:
    return {
        "state": state,
        "city": city,
        "specialization": specialization,
        "results": [
            {
                "name": f"Mock Institute of {specialization}",
                "city": city,
                "state": state,
                "type": "Government",
                "nirf_rank": 1,
                "nirf_score": 95.0,
                "why_recommended": "Mock placeholder result — used when USE_MOCK_AI=true.",
                "typical_cutoff": None,
                "website": None,
            }
        ],
        "note": "Mock data (USE_MOCK_AI=true).",
    }


async def run(
    client: genai.Client,
    state: str,
    city: str,
    specialization: str,
    grade: str | None = None,
    board: str | None = None,
) -> dict:
    if settings.USE_MOCK_AI:
        logger.info("Mock mode enabled; returned CollegeFinder response without Gemini")
        return _mock_response(state, city, specialization)

    extras = []
    if grade:
        extras.append(f"Student is currently in grade {grade}.")
    if board:
        extras.append(f"Board: {board}.")
    extras_line = " ".join(extras)

    user_prompt = (
        f"State: {state}\n"
        f"City: {city}\n"
        f"Specialization: {specialization}\n"
        f"{extras_line}\n\n"
        "Return up to 8 colleges as JSON per the schema."
    )

    response = await client.aio.models.generate_content(
        model=settings.MODEL_NAME,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )
    data = parse_llm_json(response.text, "object")
    # Defensive normalisation — Gemini occasionally drops the wrapper fields.
    data.setdefault("state", state)
    data.setdefault("city", city)
    data.setdefault("specialization", specialization)
    data.setdefault("results", [])
    data.setdefault("note", "")
    return data
