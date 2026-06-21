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
    # "auto" = detect the language of `question` and answer in it (native script).
    # A concrete code ("en", "hi", ...) is only a fallback for ambiguous messages.
    language: str = "auto"


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


# ── Career Roadmap ─────────────────────────────────────────────────────────────


class CareerPlanRequest(BaseModel):
    """Shared body for the roadmap + recommendations agents — the student's
    real profile (grade, subject performance, strengths) stamped server-side."""

    student_context: dict


class RoadmapStage(BaseModel):
    id: str
    stage: str
    badge: str | None = None
    description: str
    tone: str = Field(description="primary | violet | emerald | amber | rose")


class CareerRoadmapResponse(BaseModel):
    headline: str = ""
    stages: list[RoadmapStage]


# ── Recommended Careers ─────────────────────────────────────────────────────────


class RecommendedWorkshop(BaseModel):
    id: str
    title: str
    difficulty: str | None = None
    duration: str | None = None


class CareerRecommendation(BaseModel):
    id: str
    title: str
    match_pct: int | None = None
    reason: str | None = None
    workshops: list[RecommendedWorkshop] = Field(default_factory=list)


class CareerRecommendationsResponse(BaseModel):
    recommendations: list[CareerRecommendation]


# ── Detailed roadmap (cached per career × grade × board) ───────────────────────


class DetailedRoadmapRequest(BaseModel):
    """Inputs that define a cacheable roadmap. `strengths` is advisory context
    only — it does NOT change the cache identity (career/grade/board do)."""

    career_title: str = Field(min_length=2, max_length=120)
    grade: int = Field(ge=1, le=12)
    board: str = Field(min_length=2, max_length=10)
    strengths: list[str] = Field(default_factory=list)


class RoadmapItem(BaseModel):
    text: str
    type: str = Field(default="action", description="action | skill | exam | milestone")


class RoadmapSection(BaseModel):
    id: str
    title: str
    timeframe: str = ""
    focus: str = ""
    items: list[RoadmapItem] = Field(default_factory=list)


class RecommendedStream(BaseModel):
    name: str = ""
    why: str = ""


class CollegePick(BaseModel):
    name: str
    location: str = ""
    note: str = ""


class CompanyPick(BaseModel):
    name: str
    note: str = ""


class ProjectIdea(BaseModel):
    title: str
    detail: str = ""


class InternshipIdea(BaseModel):
    title: str
    detail: str = ""


class DetailedRoadmapResponse(BaseModel):
    headline: str = ""
    summary: str = ""
    recommended_stream: RecommendedStream = Field(default_factory=RecommendedStream)
    sections: list[RoadmapSection] = Field(default_factory=list)
    key_exams: list[str] = Field(default_factory=list)
    key_skills: list[str] = Field(default_factory=list)
    top_colleges: list[CollegePick] = Field(default_factory=list)
    top_companies: list[CompanyPick] = Field(default_factory=list)
    projects: list[ProjectIdea] = Field(default_factory=list)
    internships: list[InternshipIdea] = Field(default_factory=list)


# ── 30-day checklist (fresh per student, capped 1/month upstream) ──────────────


class ChecklistRequest(BaseModel):
    career_title: str = Field(min_length=2, max_length=120)
    grade: int = Field(ge=1, le=12)
    board: str = Field(min_length=2, max_length=10)
    strengths: list[str] = Field(default_factory=list)
    needs_work: list[str] = Field(default_factory=list)
    days: int = Field(default=30, ge=1, le=31)


class ChecklistTaskOut(BaseModel):
    day_index: int = Field(ge=1, le=31)
    title: str
    detail: str = ""
    category: str = Field(default="study", description="study | practice | revise | explore | rest")


class ChecklistResponse(BaseModel):
    headline: str = ""
    tasks: list[ChecklistTaskOut] = Field(default_factory=list)
