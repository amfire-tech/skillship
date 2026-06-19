"""
File:    ai-service/app/routers/career.py
Purpose: /career/ask + /career/college-finder — CareerPilot agents.
"""

from fastapi import APIRouter, Depends, HTTPException
from google.genai import errors as genai_errors

from app.agents import career_pilot, career_planner, college_finder
from app.deps import GeminiClient, verify_internal_key
from app.schemas.career import (
    CareerAskRequest,
    CareerAskResponse,
    CareerPlanRequest,
    CareerRecommendationsResponse,
    CareerRoadmapResponse,
    ChecklistRequest,
    ChecklistResponse,
    CollegeFinderRequest,
    CollegeFinderResponse,
    DetailedRoadmapRequest,
    DetailedRoadmapResponse,
)

router = APIRouter(prefix="/career", dependencies=[Depends(verify_internal_key)])


@router.post("/ask", response_model=CareerAskResponse)
async def ask_career_question(request: CareerAskRequest, client: GeminiClient):
    try:
        result = await career_pilot.run(
            client=client,
            student_context=request.student_context,
            question=request.question,
            history=request.history,
        )
    except genai_errors.APIError as exc:
        raise HTTPException(
            status_code=exc.code or 502,
            detail=f"Gemini API error: {exc.message}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid Gemini response: {exc}") from exc
    return CareerAskResponse(**result)


@router.post("/college-finder", response_model=CollegeFinderResponse)
async def find_colleges(request: CollegeFinderRequest, client: GeminiClient):
    try:
        result = await college_finder.run(
            client=client,
            state=request.state,
            city=request.city,
            specialization=request.specialization,
            grade=request.grade,
            board=request.board,
        )
    except genai_errors.APIError as exc:
        raise HTTPException(
            status_code=exc.code or 502,
            detail=f"Gemini API error: {exc.message}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid Gemini response: {exc}") from exc
    return CollegeFinderResponse(**result)


@router.post("/roadmap", response_model=CareerRoadmapResponse)
async def career_roadmap(request: CareerPlanRequest, client: GeminiClient):
    try:
        result = await career_planner.run_roadmap(
            client=client, student_context=request.student_context,
        )
    except genai_errors.APIError as exc:
        raise HTTPException(
            status_code=exc.code or 502,
            detail=f"Gemini API error: {exc.message}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid Gemini response: {exc}") from exc
    return CareerRoadmapResponse(**result)


@router.post("/recommendations", response_model=CareerRecommendationsResponse)
async def career_recommendations(request: CareerPlanRequest, client: GeminiClient):
    try:
        result = await career_planner.run_recommendations(
            client=client, student_context=request.student_context,
        )
    except genai_errors.APIError as exc:
        raise HTTPException(
            status_code=exc.code or 502,
            detail=f"Gemini API error: {exc.message}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid Gemini response: {exc}") from exc
    return CareerRecommendationsResponse(**result)


@router.post("/roadmap-detail", response_model=DetailedRoadmapResponse)
async def career_roadmap_detail(request: DetailedRoadmapRequest, client: GeminiClient):
    """Full, detailed roadmap for one (career, grade, board). Django caches the
    result so this generation runs at most once per combo across all students."""
    try:
        result = await career_planner.run_roadmap_detail(
            client=client,
            career_title=request.career_title,
            grade=request.grade,
            board=request.board,
            strengths=request.strengths,
        )
    except genai_errors.APIError as exc:
        raise HTTPException(
            status_code=exc.code or 502,
            detail=f"Gemini API error: {exc.message}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid Gemini response: {exc}") from exc
    return DetailedRoadmapResponse(**result)


@router.post("/checklist", response_model=ChecklistResponse)
async def career_checklist(request: ChecklistRequest, client: GeminiClient):
    """A fresh, personalised day-by-day checklist. Capped 1/student/month upstream."""
    try:
        result = await career_planner.run_checklist(
            client=client,
            career_title=request.career_title,
            grade=request.grade,
            board=request.board,
            strengths=request.strengths,
            needs_work=request.needs_work,
            days=request.days,
        )
    except genai_errors.APIError as exc:
        raise HTTPException(
            status_code=exc.code or 502,
            detail=f"Gemini API error: {exc.message}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid Gemini response: {exc}") from exc
    return ChecklistResponse(**result)
