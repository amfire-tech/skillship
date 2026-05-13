"""
File:    ai-service/app/agents/risk_agent.py
Purpose: Risk agent — hybrid rules + LLM to flag at-risk students.
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
# _ATTENDANCE_LOW = 0.75
# _SCORE_CRITICAL = 0.40
# _SCORE_LOW = 0.55
# _STREAK = 3
#
# _SYSTEM = """You are a student welfare analyst. For each flagged student, assess risk and return a JSON array.
# Each element: {"student_id": "...", "level": "low"|"medium"|"high"|"critical",
# "kind": "dropout"|"failing"|"disengagement"|"attendance",
# "reason": "one sentence", "evidence": ["data point 1", "data point 2"]}
# Return ONLY the JSON array."""
#
#
# def _rule_flags(student: dict) -> list[str]:
#     flags: list[str] = []
#     attendance = student.get("attendance", 1.0)
#     scores = student.get("quiz_scores", [])
#     avg = sum(scores) / len(scores) if scores else 1.0
#
#     if attendance < _ATTENDANCE_LOW:
#         flags.append(f"attendance={attendance:.0%}")
#     if avg < _SCORE_CRITICAL:
#         flags.append(f"avg_score_critical={avg:.0%}")
#     elif avg < _SCORE_LOW:
#         flags.append(f"avg_score_low={avg:.0%}")
#     if len(scores) >= _STREAK * 2:
#         recent = scores[-_STREAK:]
#         older = scores[-_STREAK * 2:-_STREAK]
#         if sum(recent) / len(recent) < sum(older) / len(older) - 0.1:
#             flags.append("score_trending_down")
#     if student.get("recent_stats", {}).get("logins_this_week", 1) == 0:
#         flags.append("zero_logins_this_week")
#     return flags
#
#
# async def scan(client: genai.Client, students: list[dict]) -> list[dict]:
#     flagged = [
#         {
#             "student_id": s["id"],
#             "attendance": s.get("attendance"),
#             "avg_score": round(sum(s.get("quiz_scores", [])) / max(len(s.get("quiz_scores", [])), 1), 2),
#             "flags": _rule_flags(s),
#             "recent_stats": s.get("recent_stats", {}),
#         }
#         for s in students
#         if _rule_flags(s)
#     ]
#
#     if not flagged:
#         logger.info("Risk scan: no at-risk students")
#         return []
#
#     response = await client.aio.models.generate_content(
#         model=settings.MODEL_NAME,
#         contents=f"Assess these {len(flagged)} flagged students:\n\n{json.dumps(flagged, indent=2)}",
#         config=types.GenerateContentConfig(
#             system_instruction=_SYSTEM,
#             response_mime_type="application/json",
#         ),
#     )
#
#     signals = json.loads(response.text)
#     logger.info("Risk scan: %d signals from %d students", len(signals), len(students))
#     return signals
