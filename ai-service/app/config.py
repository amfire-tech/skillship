"""
File:    ai-service/app/config.py
Purpose: Typed settings loaded from env vars (pydantic-settings).
Owner:   Navanish
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    ANTHROPIC_API_KEY: str
    OPENAI_API_KEY: str = ""  # Optional for future use
    
    # Model Configuration
    MODEL_NAME: str = "claude-opus-4-6"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    # Service Configuration
    AI_SERVICE_INTERNAL_KEY: str
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Database
    PGVECTOR_URL: str
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
