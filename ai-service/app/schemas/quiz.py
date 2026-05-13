"""
File:    ai-service/app/schemas/quiz.py
Purpose: Pydantic request/response models for quiz endpoints.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.common import Difficulty, Question, QuestionType


class GenerateRequest(BaseModel):
    topic: str
    grade: str
    count: int = Field(default=5, ge=1, le=20)
    difficulty: Difficulty = Difficulty.MEDIUM
    types: list[QuestionType] = Field(default_factory=lambda: [QuestionType.MCQ])
    course_context: str = ""    # optional extra context for the prompt


class GenerateResponse(BaseModel):
    questions: list[Question]


class AdaptiveNextRequest(BaseModel):
    topic: str
    grade: str
    # [{"correct": bool, "difficulty": str}, ...]
    attempt_history: list[dict] = Field(default_factory=list)
    last_difficulty: Difficulty = Difficulty.MEDIUM
    last_correct: bool = True
    types: list[QuestionType] = Field(default_factory=lambda: [QuestionType.MCQ])
    course_context: str = ""


class AdaptiveNextResponse(BaseModel):
    question: Question
    difficulty: Difficulty


class GradeShortRequest(BaseModel):
    question_text: str
    rubric: str
    student_answer: str


class GradeShortResponse(BaseModel):
    score: float = Field(ge=0.0, le=1.0)
    feedback: str
