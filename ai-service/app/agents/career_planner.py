"""
File:    ai-service/app/agents/career_planner.py
Purpose: CareerPilot roadmap + recommendations agents. Both take the student's
         real profile (grade, subject performance, strengths) and return a
         structured plan. `id` and `tone` are assigned here (not trusted from the
         LLM) so the frontend always renders cleanly.
Owner:   Navanish
"""

from __future__ import annotations

import logging
from pathlib import Path

from google import genai
from google.genai import types

from app.config import settings
from app.utils.json import parse_llm_json

logger = logging.getLogger(__name__)

_PROMPTS = Path(__file__).parent.parent / "prompts"
ROADMAP_PROMPT = (_PROMPTS / "career_roadmap.md").read_text(encoding="utf-8")
RECS_PROMPT = (_PROMPTS / "career_recommendations.md").read_text(encoding="utf-8")

# Cycled across roadmap stages so the timeline alternates colour.
_TONES = ["primary", "violet", "emerald", "amber", "rose"]


def _context_message(student_context: dict) -> str:
    lines = []
    for k, v in student_context.items():
        lines.append(f"  {k}: {v}")
    return "Student profile:\n" + "\n".join(lines)


async def _generate(client: genai.Client, system_prompt: str, student_context: dict) -> dict:
    response = await client.aio.models.generate_content(
        model=settings.MODEL_NAME,
        contents=[{"role": "user", "parts": [{"text": _context_message(student_context)}]}],
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
        ),
    )
    return parse_llm_json(response.text, expected="object")


# ── Roadmap ──────────────────────────────────────────────────────────────────


async def run_roadmap(client: genai.Client, student_context: dict) -> dict:
    if settings.USE_MOCK_AI:
        logger.info("Mock mode enabled; returned roadmap without Gemini")
        raw = {
            "headline": "A STEM-leaning path building on your strengths.",
            "stages": [
                {"stage": "Strengthen fundamentals", "badge": "Now", "description": "Keep scoring well in your strongest subjects and close gaps in the weaker ones."},
                {"stage": "Choose your stream", "badge": "Class 11", "description": "Pick Science/Commerce based on your aptitude and target careers."},
                {"stage": "Prepare for entrance exams", "badge": "Class 12", "description": "Begin focused prep for JEE/NEET/CUET aligned to your goal."},
                {"stage": "Degree & internships", "badge": "2–4 yrs", "description": "Enrol in a fitting degree and build projects + internships."},
            ],
        }
        return _shape_roadmap(raw)

    raw = await _generate(client, ROADMAP_PROMPT, student_context)
    return _shape_roadmap(raw)


def _shape_roadmap(raw: dict) -> dict:
    stages_in = raw.get("stages") or []
    stages = []
    for i, s in enumerate(stages_in):
        if not isinstance(s, dict):
            continue
        stages.append({
            "id": f"stage-{i + 1}",
            "stage": str(s.get("stage") or f"Step {i + 1}"),
            "badge": (str(s["badge"]) if s.get("badge") else None),
            "description": str(s.get("description") or ""),
            "tone": _TONES[i % len(_TONES)],
        })
    return {"headline": str(raw.get("headline") or ""), "stages": stages}


# ── Recommendations ────────────────────────────────────────────────────────────


async def run_recommendations(client: genai.Client, student_context: dict) -> dict:
    if settings.USE_MOCK_AI:
        logger.info("Mock mode enabled; returned recommendations without Gemini")
        raw = {
            "recommendations": [
                {
                    "title": "Software Engineering",
                    "match_pct": 82,
                    "reason": "Your strong logical-subject scores fit programming well.",
                    "workshops": [
                        {"title": "Python for Beginners", "difficulty": "Beginner", "duration": "4 weeks"},
                        {"title": "Build Your First Web App", "difficulty": "Intermediate", "duration": "2 hours"},
                    ],
                },
                {
                    "title": "Data Science",
                    "match_pct": 74,
                    "reason": "Good with numbers and analysis.",
                    "workshops": [
                        {"title": "Intro to Data & Charts", "difficulty": "Beginner", "duration": "3 hours"},
                    ],
                },
            ]
        }
        return _shape_recommendations(raw)

    raw = await _generate(client, RECS_PROMPT, student_context)
    return _shape_recommendations(raw)


def _shape_recommendations(raw: dict) -> dict:
    recs_in = raw.get("recommendations") or []
    recs = []
    for i, r in enumerate(recs_in):
        if not isinstance(r, dict):
            continue
        workshops = []
        for j, w in enumerate(r.get("workshops") or []):
            if not isinstance(w, dict):
                continue
            workshops.append({
                "id": f"rec-{i + 1}-w-{j + 1}",
                "title": str(w.get("title") or "Workshop"),
                "difficulty": (str(w["difficulty"]) if w.get("difficulty") else None),
                "duration": (str(w["duration"]) if w.get("duration") else None),
            })
        match = r.get("match_pct")
        try:
            match = int(match) if match is not None else None
        except (TypeError, ValueError):
            match = None
        recs.append({
            "id": f"rec-{i + 1}",
            "title": str(r.get("title") or f"Career {i + 1}"),
            "match_pct": match,
            "reason": (str(r["reason"]) if r.get("reason") else None),
            "workshops": workshops,
        })
    return {"recommendations": recs}
