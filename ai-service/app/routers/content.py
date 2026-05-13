"""
File:    ai-service/app/routers/content.py
Purpose: /content/ingest (PDF → pgvector) and /content/search (semantic search). Plan 01.
Owner:   Prashant
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from google.genai import errors as genai_errors
from pydantic import BaseModel, Field

from app.deps import DB, GeminiClient, verify_internal_key
from app.rag import retriever
from app.rag.chunker import chunk_pdf
from app.rag.embedder import upsert

router = APIRouter(prefix="/content", dependencies=[Depends(verify_internal_key)])


class ContentSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    school_id: uuid.UUID
    course_id: uuid.UUID | None = None
    k: int = Field(default=5, ge=1, le=20)


class ContentChunk(BaseModel):
    content_id: str
    chunk_index: int
    excerpt: str
    score: float


class ContentSearchResponse(BaseModel):
    chunks: list[ContentChunk]


class IngestResponse(BaseModel):
    content_id: str
    chunks_stored: int


@router.post("/ingest", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_content(
    db: DB,
    client: GeminiClient,
    file: Annotated[UploadFile, File()],
    school_id: Annotated[uuid.UUID, Form()],
    content_id: Annotated[uuid.UUID, Form()],
    course_id: Annotated[uuid.UUID | None, Form()] = None,
):
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files are supported.",
        )
    try:
        file_bytes = await file.read()
        chunks = chunk_pdf(file_bytes)
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

    try:
        count = await upsert(
            db=db,
            client=client,
            school_id=school_id,
            content_id=content_id,
            course_id=course_id,
            chunks=chunks,
        )
    except genai_errors.APIError as exc:
        raise HTTPException(
            status_code=exc.code or status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API error: {exc.message}",
        ) from exc

    return IngestResponse(content_id=str(content_id), chunks_stored=count)


@router.post("/search", response_model=ContentSearchResponse)
async def search_content(request: ContentSearchRequest, db: DB, client: GeminiClient):
    try:
        results = await retriever.retrieve(
            db=db,
            client=client,
            question=request.query,
            school_id=request.school_id,
            course_id=request.course_id,
            k=request.k,
        )
    except genai_errors.APIError as exc:
        raise HTTPException(
            status_code=exc.code or status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API error: {exc.message}",
        ) from exc

    return ContentSearchResponse(
        chunks=[
            ContentChunk(
                content_id=r["content_id"],
                chunk_index=r["chunk_index"],
                excerpt=r["chunk_text"],
                score=r["score"],
            )
            for r in results
        ]
    )
