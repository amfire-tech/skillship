"""
File:    ai-service/app/routers/content.py
Purpose: /content/search — natural-language semantic search over uploaded content (Plan 01).
Owner:   Navanish
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.deps import DB, GeminiClient, verify_internal_key
from app.rag import retriever

router = APIRouter(prefix="/content", dependencies=[Depends(verify_internal_key)])


class ContentSearchRequest(BaseModel):
    query: str
    school_id: uuid.UUID
    course_id: Optional[uuid.UUID] = None
    k: int = 5


class ContentChunk(BaseModel):
    content_id: str
    excerpt: str
    score: float


class ContentSearchResponse(BaseModel):
    chunks: list[ContentChunk]


@router.post("/search", response_model=ContentSearchResponse)
async def search_content(request: ContentSearchRequest, db: DB, client: GeminiClient):
    results = await retriever.retrieve(
        db=db,
        client=client,
        question=request.query,
        school_id=request.school_id,
        course_id=request.course_id,
        k=request.k,
    )
    return ContentSearchResponse(
        chunks=[
            ContentChunk(content_id=r["content_id"], excerpt=r["chunk_text"], score=r["score"])
            for r in results
        ]
    )
