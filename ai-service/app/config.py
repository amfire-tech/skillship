"""
File:    ai-service/app/config.py
Purpose: Typed settings loaded from env vars (pydantic-settings).
Owner:   Navanish
"""

from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_SERVICE_DIR = Path(__file__).resolve().parent.parent  # ai-service/
_REPO_ROOT = _SERVICE_DIR.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Gemini — the root .env names it GOOGLE_API_KEY; GEMINI_API_KEY still works.
    GEMINI_API_KEY: str = Field(validation_alias=AliasChoices("GOOGLE_API_KEY", "GEMINI_API_KEY"))

    # Model Configuration
    MODEL_NAME: str = "gemini-2.5-flash"
    # Used when MODEL_NAME hits its rate/quota limit (429). Empty disables fallback.
    FALLBACK_MODEL_NAME: str = "gemini-3.5-flash-lite"
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

    # Root .env first, ai-service/.env second (later file wins on duplicate keys).
    # Missing files are skipped, so containers relying on real env vars are unaffected.
    model_config = SettingsConfigDict(
        env_file=(_REPO_ROOT / ".env", _SERVICE_DIR / ".env"),
        case_sensitive=True,
        extra="ignore",
    )


# Global settings instance
settings = Settings()
