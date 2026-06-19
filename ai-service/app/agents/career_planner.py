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
ROADMAP_DETAIL_PROMPT = (_PROMPTS / "career_roadmap_detail.md").read_text(encoding="utf-8")
CHECKLIST_PROMPT = (_PROMPTS / "career_checklist.md").read_text(encoding="utf-8")

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


# ── Detailed roadmap (cached per career × grade × board upstream) ───────────────


def _detail_message(*, career_title: str, grade: int, board: str, strengths: list[str]) -> str:
    parts = [
        f"Target career: {career_title}",
        f"Current class/grade: {grade}",
        f"Board: {board}",
    ]
    if strengths:
        parts.append("Student's strong subjects: " + ", ".join(strengths))
    return "\n".join(parts)


async def run_roadmap_detail(
    client: genai.Client, *, career_title: str, grade: int, board: str, strengths: list[str],
) -> dict:
    if settings.USE_MOCK_AI:
        logger.info("Mock mode: detailed roadmap for %s (G%s/%s)", career_title, grade, board)
        return _shape_detail(_mock_detail(career_title, grade, board), career_title)

    response = await client.aio.models.generate_content(
        model=settings.MODEL_NAME,
        contents=[{"role": "user", "parts": [{"text": _detail_message(
            career_title=career_title, grade=grade, board=board, strengths=strengths,
        )}]}],
        config=types.GenerateContentConfig(
            system_instruction=ROADMAP_DETAIL_PROMPT,
            response_mime_type="application/json",
        ),
    )
    raw = parse_llm_json(response.text, expected="object")
    return _shape_detail(raw, career_title)


def _named_list(raw_list, fields: tuple[str, ...]) -> list[dict]:
    """Coerce a list of dicts to {field: str} entries, keeping only those with a
    non-empty first field (the name/title)."""
    out = []
    for item in raw_list or []:
        if not isinstance(item, dict):
            continue
        primary = str(item.get(fields[0]) or "").strip()
        if not primary:
            continue
        out.append({f: str(item.get(f) or "") for f in fields})
    return out


def _shape_detail(raw: dict, career_title: str) -> dict:
    sections = []
    for i, s in enumerate(raw.get("sections") or []):
        if not isinstance(s, dict):
            continue
        items = []
        for it in s.get("items") or []:
            if isinstance(it, dict) and it.get("text"):
                items.append({"text": str(it["text"]), "type": str(it.get("type") or "action")})
            elif isinstance(it, str) and it.strip():
                items.append({"text": it.strip(), "type": "action"})
        sections.append({
            "id": f"sec-{i + 1}",
            "title": str(s.get("title") or f"Phase {i + 1}"),
            "timeframe": str(s.get("timeframe") or ""),
            "focus": str(s.get("focus") or ""),
            "items": items,
        })

    stream_raw = raw.get("recommended_stream") or {}
    stream = {
        "name": str(stream_raw.get("name") or "") if isinstance(stream_raw, dict) else "",
        "why": str(stream_raw.get("why") or "") if isinstance(stream_raw, dict) else "",
    }

    return {
        "headline": str(raw.get("headline") or f"Your roadmap to becoming a {career_title}"),
        "summary": str(raw.get("summary") or ""),
        "recommended_stream": stream,
        "sections": sections,
        "key_exams": [str(x) for x in (raw.get("key_exams") or []) if x],
        "key_skills": [str(x) for x in (raw.get("key_skills") or []) if x],
        "top_colleges": _named_list(raw.get("top_colleges"), ("name", "location", "note")),
        "top_companies": _named_list(raw.get("top_companies"), ("name", "note")),
        "projects": _named_list(raw.get("projects"), ("title", "detail")),
        "internships": _named_list(raw.get("internships"), ("title", "detail")),
    }


def _mock_detail(career_title: str, grade: int, board: str) -> dict:
    return {
        "headline": f"Your roadmap to becoming a {career_title}",
        "summary": f"A step-by-step path from Class {grade} ({board}) to a career as a {career_title}.",
        "recommended_stream": {"name": "Science (PCM)", "why": "Mock: pick the stream that matches this career."},
        "sections": [
            {"title": "Now → end of this year", "timeframe": f"Class {grade}", "focus": "Foundations",
             "items": [
                 {"text": "Master core subjects with consistent daily study.", "type": "action"},
                 {"text": "Build strong fundamentals in maths and science.", "type": "skill"},
             ]},
            {"title": "Choose your stream", "timeframe": "Class 11", "focus": "Specialisation",
             "items": [
                 {"text": "Pick the right stream aligned to this career.", "type": "milestone"},
                 {"text": "Start light exposure to the field via projects.", "type": "action"},
             ]},
            {"title": "Entrance preparation", "timeframe": "Class 12", "focus": "Exams",
             "items": [{"text": "Prepare for the relevant entrance exam.", "type": "exam"}]},
            {"title": "Degree & beyond", "timeframe": "3–5 yrs", "focus": "Career launch",
             "items": [{"text": "Enrol in a fitting degree, build internships and a portfolio.", "type": "action"}]},
        ],
        "key_exams": ["JEE / NEET / CUET (as applicable)"],
        "key_skills": ["Discipline", "Problem solving", "Communication"],
        "top_colleges": [{"name": f"Mock College {i} for {career_title}", "location": "India", "note": "Strong programme."} for i in range(1, 6)],
        "top_companies": [{"name": f"Mock Company {i}", "note": "A leading employer."} for i in range(1, 6)],
        "projects": [{"title": f"Sample {career_title} project {i}", "detail": "Build something portfolio-worthy."} for i in range(1, 4)],
        "internships": [{"title": f"Internship avenue {i}", "detail": "A realistic place to intern."} for i in range(1, 4)],
    }


# ── 30-day checklist (fresh per student) ───────────────────────────────────────


def _checklist_message(
    *, career_title: str, grade: int, board: str, strengths: list[str], needs_work: list[str], days: int,
) -> str:
    parts = [
        f"Target career: {career_title}",
        f"Current class/grade: {grade}",
        f"Board: {board}",
        f"Plan length: {days} days, one task per day.",
    ]
    if strengths:
        parts.append("Strong subjects (keep sharp): " + ", ".join(strengths))
    if needs_work:
        parts.append("Weaker subjects (prioritise): " + ", ".join(needs_work))
    return "\n".join(parts)


async def run_checklist(
    client: genai.Client,
    *,
    career_title: str,
    grade: int,
    board: str,
    strengths: list[str],
    needs_work: list[str],
    days: int = 30,
) -> dict:
    if settings.USE_MOCK_AI:
        logger.info("Mock mode: %s-day checklist for %s", days, career_title)
        return _shape_checklist(_mock_checklist(career_title, days), days)

    response = await client.aio.models.generate_content(
        model=settings.MODEL_NAME,
        contents=[{"role": "user", "parts": [{"text": _checklist_message(
            career_title=career_title, grade=grade, board=board,
            strengths=strengths, needs_work=needs_work, days=days,
        )}]}],
        config=types.GenerateContentConfig(
            system_instruction=CHECKLIST_PROMPT,
            response_mime_type="application/json",
        ),
    )
    raw = parse_llm_json(response.text, expected="object")
    return _shape_checklist(raw, days)


_CHECKLIST_CATEGORIES = {"study", "practice", "revise", "explore", "rest"}


def _shape_checklist(raw: dict, days: int) -> dict:
    tasks_in = raw.get("tasks") or []
    tasks = []
    seen_days = set()
    for t in tasks_in:
        if not isinstance(t, dict):
            continue
        try:
            day = int(t.get("day_index"))
        except (TypeError, ValueError):
            continue
        if day < 1 or day > days or day in seen_days:
            continue
        seen_days.add(day)
        cat = str(t.get("category") or "study").lower()
        if cat not in _CHECKLIST_CATEGORIES:
            cat = "study"
        tasks.append({
            "day_index": day,
            "title": str(t.get("title") or f"Day {day}"),
            "detail": str(t.get("detail") or ""),
            "category": cat,
        })
    tasks.sort(key=lambda t: t["day_index"])
    return {"headline": str(raw.get("headline") or ""), "tasks": tasks}


def _mock_checklist(career_title: str, days: int) -> dict:
    cats = ["study", "practice", "revise", "explore", "rest"]
    tasks = []
    for d in range(1, days + 1):
        cat = "rest" if d % 7 == 0 else cats[d % 4]
        if cat == "rest":
            tasks.append({"day_index": d, "title": "Rest & reflect", "detail": "Light review and recharge.", "category": "rest"})
        else:
            tasks.append({
                "day_index": d,
                "title": f"Day {d}: focused {cat} block",
                "detail": f"Spend 45–60 min on a {career_title}-aligned {cat} task.",
                "category": cat,
            })
    return {"headline": f"Your 30-day kickstart toward {career_title}", "tasks": tasks}
