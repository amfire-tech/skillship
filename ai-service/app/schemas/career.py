"""
File:    ai-service/app/schemas/career.py
Purpose: Pydantic models for /career/ask and /career/college-finder.
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


# ── College Finder ───────────────────────────────────────────────────────────


class CollegeFinderRequest(BaseModel):
    state: str = Field(min_length=2, max_length=80)
    city: str = Field(min_length=2, max_length=80)
    specialization: str = Field(min_length=2, max_length=120)
    grade: str | None = Field(default=None, max_length=10)
    board: str | None = Field(default=None, max_length=10)


class College(BaseModel):
    name: str
    city: str
    state: str
    type: str = Field(description="Government / Private / Deemed / Autonomous")
    nirf_rank: int | None = Field(default=None, description="National rank in this discipline if known")
    nirf_score: float | None = None
    why_recommended: str
    typical_cutoff: str | None = None
    website: str | None = None


class CollegeFinderResponse(BaseModel):
    state: str
    city: str
    specialization: str
    results: list[College]
    note: str = Field(
        default="",
        description="Caveats — e.g. data freshness, sub-discipline overlaps.",
    )
