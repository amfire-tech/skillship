"""
File:    ai-service/tests/test_plan01_units.py
Purpose: Unit coverage for Plan 01 AI service helpers.
Owner:   Prashant
"""

from __future__ import annotations

import pytest
from app.engines.adaptive_quiz import next_difficulty
from app.engines.question_gen import _parse
from app.rag.chunker import chunk
from app.schemas.common import Difficulty
from app.utils.json import parse_llm_json


def test_parse_llm_json_tolerates_markdown_fence():
    result = parse_llm_json('```json\n{"score": 0.8}\n```', expected="object")
    assert result == {"score": 0.8}


def test_adaptive_quiz_moves_up_after_two_correct():
    result = next_difficulty(
        attempt_history=[{"correct": True, "difficulty": "medium"}],
        last_difficulty=Difficulty.MEDIUM,
        last_correct=True,
    )
    assert result == Difficulty.HARD


def test_adaptive_quiz_moves_down_after_two_wrong():
    result = next_difficulty(
        attempt_history=[{"correct": False, "difficulty": "medium"}],
        last_difficulty=Difficulty.MEDIUM,
        last_correct=False,
    )
    assert result == Difficulty.EASY


def test_chunker_uses_overlap():
    chunks = chunk("alpha beta gamma delta epsilon zeta", size=18, overlap=5)
    assert len(chunks) > 1
    assert all(piece for piece in chunks)


def test_question_parser_validates_count_and_schema():
    raw = """
    [
      {
        "text": "Which option best describes photosynthesis?",
        "type": "mcq",
        "options": [
          {"id": "A", "text": "Plants make food using light"},
          {"id": "B", "text": "Animals digest food"},
          {"id": "C", "text": "Rocks absorb sunlight"},
          {"id": "D", "text": "Water evaporates only at night"}
        ],
        "correct_option_ids": ["A"],
        "difficulty": "medium",
        "tags": ["biology", "plants"],
        "rubric": ""
      }
    ]
    """
    questions = _parse(raw, requested_count=1)
    assert len(questions) == 1
    assert questions[0].type == "mcq"


def test_question_parser_rejects_bad_mcq():
    raw = """
    [
      {
        "text": "Bad MCQ",
        "type": "mcq",
        "options": [{"id": "A", "text": "Only one"}],
        "correct_option_ids": ["A"],
        "difficulty": "medium",
        "tags": [],
        "rubric": ""
      }
    ]
    """
    with pytest.raises(ValueError):
        _parse(raw, requested_count=1)
