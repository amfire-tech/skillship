"""
File:    backend/apps/career/interest_quiz.py
Purpose: The 20-question psychology/aptitude fallback quiz — fully static and
         scored by a deterministic RIASEC matrix. ZERO Gemini cost per student.
Owner:   Navanish

Flow:
  GET  /career/interest-quiz/        → QUESTIONS (no answers, no AI)
  POST /career/interest-quiz/score/  → score(answers) → career recommendations

Each question is a Likert statement ("I enjoy …", agree 1–5) tagged to one of the
six Holland dimensions. score() sums per dimension, normalises to 0..1, and asks
catalog.careers_for_riasec() to rank careers. Nothing here ever calls an LLM.
"""

from __future__ import annotations

from .catalog import RIASEC, careers_for_riasec

# id, statement, dimension. ~3-4 statements per dimension keeps each balanced.
QUESTIONS: list[dict] = [
    {"id": "q1",  "text": "I like building or fixing things with my hands.", "dimension": "R"},
    {"id": "q2",  "text": "I enjoy working with tools, machines or electronics.", "dimension": "R"},
    {"id": "q3",  "text": "I'd rather be outdoors and active than at a desk all day.", "dimension": "R"},
    {"id": "q4",  "text": "I love solving puzzles and figuring out how things work.", "dimension": "I"},
    {"id": "q5",  "text": "I enjoy science experiments and asking 'why?'.", "dimension": "I"},
    {"id": "q6",  "text": "I like analysing data and finding patterns.", "dimension": "I"},
    {"id": "q7",  "text": "I enjoy reading and researching topics deeply.", "dimension": "I"},
    {"id": "q8",  "text": "I like drawing, designing, music or writing.", "dimension": "A"},
    {"id": "q9",  "text": "I prefer creative tasks over following fixed rules.", "dimension": "A"},
    {"id": "q10", "text": "I enjoy imagining new ideas and original work.", "dimension": "A"},
    {"id": "q11", "text": "I like helping and teaching other people.", "dimension": "S"},
    {"id": "q12", "text": "Friends come to me for advice or support.", "dimension": "S"},
    {"id": "q13", "text": "I feel good when I can make someone's day better.", "dimension": "S"},
    {"id": "q14", "text": "I like leading a team and convincing people of ideas.", "dimension": "E"},
    {"id": "q15", "text": "I'd enjoy starting my own business one day.", "dimension": "E"},
    {"id": "q16", "text": "I'm comfortable speaking up and taking charge.", "dimension": "E"},
    {"id": "q17", "text": "I like keeping things organised and following a plan.", "dimension": "C"},
    {"id": "q18", "text": "I'm careful with details, numbers and accuracy.", "dimension": "C"},
    {"id": "q19", "text": "I prefer clear instructions and a tidy system.", "dimension": "C"},
    {"id": "q20", "text": "I enjoy working with spreadsheets, money or records.", "dimension": "C"},
]

_QUESTION_DIM = {q["id"]: q["dimension"] for q in QUESTIONS}
_MIN, _MAX = 1, 5  # Likert range


def questions() -> list[dict]:
    """Public question list for the frontend (no scoring data leaked)."""
    return [{"id": q["id"], "text": q["text"]} for q in QUESTIONS]


def score(answers: dict[str, int]) -> dict:
    """answers: {question_id: 1..5}. Returns {scores, recommendations}.

    Unknown ids are ignored; missing answers count as neutral (0 contribution).
    """
    raw = {d: 0.0 for d in RIASEC}
    counts = {d: 0 for d in RIASEC}
    for qid, dim in _QUESTION_DIM.items():
        val = answers.get(qid)
        if val is None:
            continue
        try:
            val = int(val)
        except (TypeError, ValueError):
            continue
        val = max(_MIN, min(_MAX, val))
        # Map 1..5 → 0..1 so "strongly disagree" contributes nothing.
        raw[dim] += (val - _MIN) / (_MAX - _MIN)
        counts[dim] += 1

    normalised = {
        d: (raw[d] / counts[d]) if counts[d] else 0.0
        for d in RIASEC
    }
    return {
        "scores": {d: round(normalised[d], 3) for d in RIASEC},
        "recommendations": careers_for_riasec(normalised),
    }
