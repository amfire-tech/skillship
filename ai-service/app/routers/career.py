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
    CollegeFinderRequest,
    CollegeFinderResponse,
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
