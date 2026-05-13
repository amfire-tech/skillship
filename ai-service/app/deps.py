"""
File:    ai-service/app/deps.py
Purpose: FastAPI dependency-injection helpers — auth, Gemini client, DB connection.
"""

from typing import Annotated

import psycopg
from fastapi import Depends, HTTPException, Request, Security, status
from fastapi.security import APIKeyHeader
from google import genai

from app.config import settings

_api_key_header = APIKeyHeader(name="X-Internal-Key", auto_error=False)


def verify_internal_key(api_key: str = Security(_api_key_header)) -> str:
    if not api_key or api_key != settings.AI_SERVICE_INTERNAL_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing X-Internal-Key header",
        )
    return api_key


VerifiedKey = Annotated[str, Depends(verify_internal_key)]


async def get_gemini(request: Request) -> genai.Client:
    return request.app.state.gemini


async def get_db(request: Request) -> psycopg.AsyncConnection:
    db = request.app.state.db
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not connected. Check PGVECTOR_URL.",
        )
    return db


GeminiClient = Annotated[genai.Client, Depends(get_gemini)]
DB = Annotated[psycopg.AsyncConnection, Depends(get_db)]
