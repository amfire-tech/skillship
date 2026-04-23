"""
File:    ai-service/app/deps.py
Purpose: FastAPI dependency-injection helpers (auth header verify, LLM client, embedder).
Owner:   Navanish
"""

from typing import Annotated
from fastapi import Header, HTTPException, status
from functools import lru_cache
import anthropic

from app.config import settings


@lru_cache(maxsize=1)
def get_anthropic_client() -> anthropic.Anthropic:
    """
    Returns a cached Anthropic client instance.
    Dependency injection for LLM operations.
    """
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def verify_internal_key(x_internal_key: str = Header(...)) -> str:
    """
    Validates the X-Internal-Key header against AI_SERVICE_INTERNAL_KEY.
    Used to restrict access to this service from Django backend only.
    
    Args:
        x_internal_key: The API key from the request header
        
    Returns:
        The verified API key
        
    Raises:
        HTTPException: 403 if key is invalid
    """
    if x_internal_key != settings.AI_SERVICE_INTERNAL_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal API key"
        )
    return x_internal_key


# Type alias for verified requests
VerifiedKey = Annotated[str, Header(verify_internal_key)]
