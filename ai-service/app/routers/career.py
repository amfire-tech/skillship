"""
File:    ai-service/app/routers/career.py
Purpose: /career/ask — CareerPilot agent.
"""

from fastapi import APIRouter, Depends, HTTPException
from google.genai import errors as genai_errors

from app.agents import career_pilot
from app.deps import GeminiClient, verify_internal_key
from app.schemas.career import CareerAskRequest, CareerAskResponse

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
