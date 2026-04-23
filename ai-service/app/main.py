"""
File:    ai-service/app/main.py
Purpose: FastAPI app entrypoint — mounts routers, adds middleware, health check.
Why:     This is the separate Python service that owns all LLM / agent work.
         Django calls THIS service over HTTP — not the other way around.
Owner:   Navanish
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import career, tutor, quiz, content, reports, risk

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown event handler."""
    logger.info(f"🚀 Skillship AI Service starting (Model: {settings.MODEL_NAME})")
    yield
    logger.info("🛑 Skillship AI Service shutting down")


app = FastAPI(
    title="Skillship AI Service",
    description="Separate Python service that owns all LLM + agent calls",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Internal-Key"],
)


# Middleware: Verify X-Internal-Key on protected routes
@app.middleware("http")
async def verify_internal_key_middleware(request, call_next):
    """
    Verify X-Internal-Key header on all routes except /healthz and /docs.
    This ensures only Django backend can call this service.
    """
    # Allow health check and docs without authentication
    if request.url.path in ["/healthz", "/docs", "/openapi.json", "/redoc", "/"]:
        return await call_next(request)
    
    x_internal_key = request.headers.get("X-Internal-Key")
    if not x_internal_key or x_internal_key != settings.AI_SERVICE_INTERNAL_KEY:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "Invalid or missing X-Internal-Key header"}
        )
    
    return await call_next(request)


# Health check endpoint
@app.get("/healthz", tags=["health"])
async def health_check():
    """
    Health check endpoint. Used by load balancers and monitoring.
    Does not require authentication.
    """
    return {
        "status": "ok",
        "model": settings.MODEL_NAME,
        "service": "Skillship AI"
    }


# Include routers
app.include_router(career.router, prefix="/api", tags=["career"])
app.include_router(tutor.router, prefix="/api", tags=["tutor"])
app.include_router(quiz.router, prefix="/api", tags=["quiz"])
app.include_router(content.router, prefix="/api", tags=["content"])
app.include_router(reports.router, prefix="/api", tags=["reports"])
app.include_router(risk.router, prefix="/api", tags=["risk"])


@app.get("/", tags=["root"])
async def root():
    """Root endpoint with service info."""
    return {
        "service": "Skillship AI",
        "version": "1.0.0",
        "docs": "/docs",
        "model": settings.MODEL_NAME
    }

