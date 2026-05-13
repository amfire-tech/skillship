"""
File:    ai-service/app/schemas/career.py
Purpose: Pydantic models for /career/ask endpoint.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class CareerAskRequest(BaseModel):
    student_context: dict   # grade, subjects, scores, interests, etc.
    question: str
    # [{"role": "user"|"assistant", "content": "..."}]
    history: list[dict] = Field(default_factory=list)


class Citation(BaseModel):
    label: str
    detail: str


class CareerAskResponse(BaseModel):
    answer: str
    suggested_paths: list[str]
    confidence: float = Field(ge=0.0, le=1.0)
    citations: list[Citation]
