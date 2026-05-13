"""
File:    ai-service/app/config.py
Purpose: Typed settings loaded from env vars (pydantic-settings).
Owner:   Navanish
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Gemini
    GEMINI_API_KEY: str

    # Model Configuration
    MODEL_NAME: str = "gemini-2.5-flash"
    EMBEDDING_MODEL: str = "models/text-embedding-004"

    # Service Configuration
    AI_SERVICE_INTERNAL_KEY: str
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Database
    PGVECTOR_URL: str

    # Logging
    LOG_LEVEL: str = "INFO"

    # Dev mock mode — set true when Gemini API is unavailable
    USE_MOCK_AI: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
