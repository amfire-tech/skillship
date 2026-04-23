"""
File:    ai-service/app/routers/tutor.py
Purpose: /tutor/ask endpoint — student-facing tutor that answers homework/concept questions.
Owner:   Navanish
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/tutor")


class TutorAskRequest(BaseModel):
    """Request schema for tutor assistance."""
    student_context: dict
    question: str
    course: str
    chat_history: list = []


class Reference(BaseModel):
    """Citation reference."""
    content_id: str
    excerpt: str


class TutorAskResponse(BaseModel):
    """Response schema for tutor assistance."""
    answer: str
    references: list[Reference]


@router.post("/ask", response_model=TutorAskResponse)
async def ask_tutor(request: TutorAskRequest):
    """
    Answer homework and concept questions using Tutor agent with RAG.
    
    Args:
        request: Tutor question with student context and course info
        
    Returns:
        Tutor response with answer and content references
    """
    # TODO: Implement Tutor agent call with RAG
    # -> agents.tutor_agent.run(...) with RAG over course content
    return {
        "answer": "Tutor assistance not yet implemented",
        "references": []
    }

