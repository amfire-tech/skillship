"""
File:    ai-service/app/routers/quiz.py
Purpose: /quiz/generate + /quiz/adaptive-next endpoints.
Owner:   Navanish
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/quiz")


class GenerateQuizRequest(BaseModel):
    """Request schema for quiz generation."""
    topic: str
    grade: str
    count: int = 5
    difficulty: str = "medium"
    types: list[str] = ["multiple_choice"]


class Question(BaseModel):
    """Quiz question model."""
    id: str
    text: str
    options: list[str]
    correct_answer: str
    difficulty: str
    topic: str


class AdaptiveNextRequest(BaseModel):
    """Request schema for adaptive quiz next question."""
    attempt_history: list[dict]
    last_difficulty: str
    last_correct: bool


class AdaptiveNextResponse(BaseModel):
    """Response schema for adaptive quiz next question."""
    question: Question
    difficulty: str


@router.post("/generate", response_model=list[Question])
async def generate_quiz(request: GenerateQuizRequest):
    """
    Generate quiz questions based on topic, grade, and parameters.
    
    Args:
        request: Quiz generation parameters
        
    Returns:
        List of generated quiz questions
    """
    # TODO: Implement question generation
    # -> engines.question_gen.generate(...)
    return []


@router.post("/adaptive-next", response_model=AdaptiveNextResponse)
async def get_adaptive_next(request: AdaptiveNextRequest):
    """
    Get the next adaptive quiz question based on attempt history.
    
    Args:
        request: Attempt history and last question difficulty/result
        
    Returns:
        Next question with adjusted difficulty
    """
    # TODO: Implement adaptive quiz engine
    # -> engines.adaptive_quiz.next(...)
    return {
        "question": None,
        "difficulty": "medium"
    }

