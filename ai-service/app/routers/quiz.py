"""
File:    ai-service/app/routers/quiz.py
Purpose: /quiz/generate, /quiz/adaptive-next, /quiz/grade-short endpoints.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from google.genai import errors as genai_errors

from app.deps import GeminiClient, verify_internal_key
from app.engines import adaptive_quiz, question_gen, scoring
from app.rag.chunker import chunk_pdf
from app.schemas.common import Difficulty, QuestionType
from app.schemas.quiz import (
    AdaptiveNextRequest,
    AdaptiveNextResponse,
    GenerateRequest,
    GenerateResponse,
    GradeShortRequest,
    GradeShortResponse,
)

router = APIRouter(prefix="/quiz", dependencies=[Depends(verify_internal_key)])

_MAX_PDF_CONTEXT_CHARS = 12000


@router.post("/generate", response_model=GenerateResponse)
async def generate_quiz(request: GenerateRequest, client: GeminiClient):
    try:
        questions = await question_gen.generate(
            client=client, topic=request.topic, grade=request.grade,
            count=request.count, difficulty=request.difficulty,
            types_=request.types, course_context=request.course_context,
        )
    except genai_errors.APIError as exc:
        raise HTTPException(
            status_code=exc.code or 502,
            detail=f"Gemini API error: {exc.message}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid Gemini response: {exc}") from exc
    return GenerateResponse(questions=questions)


@router.post("/generate-from-pdf", response_model=GenerateResponse)
async def generate_quiz_from_pdf(
    client: GeminiClient,
    file: Annotated[UploadFile, File()],
    topic: Annotated[str, Form()],
    grade: Annotated[str, Form()],
    count: Annotated[int, Form()] = 5,
    difficulty: Annotated[Difficulty, Form()] = Difficulty.MEDIUM,
    types: Annotated[list[QuestionType] | None, Form()] = None,
):
    if count < 1 or count > 20:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="count must be 1-20",
        )
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files are supported.",
        )

    try:
        chunks = chunk_pdf(await file.read())
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not parse PDF text.",
        ) from exc

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No text could be extracted from the PDF.",
        )

    course_context = "\n\n".join(chunks)[:_MAX_PDF_CONTEXT_CHARS]
    try:
        questions = await question_gen.generate(
            client=client,
            topic=topic,
            grade=grade,
            count=count,
            difficulty=difficulty,
            types_=types or [QuestionType.MCQ],
            course_context=course_context,
        )
    except genai_errors.APIError as exc:
        raise HTTPException(
            status_code=exc.code or 502,
            detail=f"Gemini API error: {exc.message}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid Gemini response: {exc}") from exc

    return GenerateResponse(questions=questions)


@router.post("/adaptive-next", response_model=AdaptiveNextResponse)
async def get_adaptive_next(request: AdaptiveNextRequest, client: GeminiClient):
    next_diff = adaptive_quiz.next_difficulty(
        attempt_history=request.attempt_history,
        last_difficulty=request.last_difficulty,
        last_correct=request.last_correct,
    )
    try:
        questions = await question_gen.generate(
            client=client, topic=request.topic, grade=request.grade,
            count=1, difficulty=next_diff,
            types_=request.types, course_context=request.course_context,
        )
    except genai_errors.APIError as exc:
        raise HTTPException(
            status_code=exc.code or 502,
            detail=f"Gemini API error: {exc.message}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid Gemini response: {exc}") from exc
    return AdaptiveNextResponse(question=questions[0], difficulty=next_diff)


@router.post("/grade-short", response_model=GradeShortResponse)
async def grade_short_answer(request: GradeShortRequest, client: GeminiClient):
    try:
        result = await scoring.grade_short(
            client=client,
            question_text=request.question_text,
            rubric=request.rubric,
            student_answer=request.student_answer,
        )
    except genai_errors.APIError as exc:
        raise HTTPException(
            status_code=exc.code or 502,
            detail=f"Gemini API error: {exc.message}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid Gemini response: {exc}") from exc
    return GradeShortResponse(**result)
