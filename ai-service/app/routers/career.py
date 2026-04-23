"""
File:    ai-service/app/routers/career.py
Purpose: /career/ask endpoint — CareerPilot agent answers student career questions.
Why:     Feature from proposal Plan 02: personalised career guidance based on quiz history + interests.
Owner:   Navanish
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/career")


class CareerAskRequest(BaseModel):
    """Request schema for career guidance."""
    student_context: dict
    question: str
    history: list = []


class CareerAskResponse(BaseModel):
    """Response schema for career guidance."""
    answer: str
    suggested_paths: list[str]
    confidence: float
    citations: list[dict]


@router.post("/ask", response_model=CareerAskResponse)
async def ask_career_question(request: CareerAskRequest):
    """
    Answer career-related questions using CareerPilot agent.
    
    Args:
        request: Career guidance question with student context
        
    Returns:
        Career guidance response with suggested paths and confidence score
    """
    # TODO: Implement CareerPilot agent call
    # -> agents.career_pilot.run(...)
    return {
        "answer": "Career guidance not yet implemented",
        "suggested_paths": [],
        "confidence": 0.0,
        "citations": []
    }

