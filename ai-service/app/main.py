"""
File:    ai-service/app/main.py
Purpose: FastAPI app entrypoint — mounts routers, adds middleware, health check.
Owner:   Navanish
"""

import logging
import os
from contextlib import asynccontextmanager

import psycopg
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google import genai
from pgvector.psycopg import register_vector_async

from app.config import settings
from app.routers import career, quiz, content

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


# ── Sentry (silent unless SENTRY_DSN_AI_SERVICE is set) ──────────────────────
# Init BEFORE the FastAPI app is built so the Sentry middleware catches every
# request, including the startup path. Errors-only by default; toggle traces
# via SENTRY_TRACES_SAMPLE_RATE if you want performance traces (costs Sentry
# quota — leave at 0.05 for a single-school production deployment).
_sentry_dsn = os.environ.get("SENTRY_DSN_AI_SERVICE", "").strip()
if _sentry_dsn:
    import sentry_sdk
    sentry_sdk.init(
        dsn=_sentry_dsn,
        traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0.05")),
        profiles_sample_rate=0.0,
        send_default_pii=False,
        environment=os.environ.get("SENTRY_ENVIRONMENT", "production"),
        release=os.environ.get("SENTRY_RELEASE") or None,
    )
    logger.info("Sentry initialised for ai-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Gemini client (always required)
    app.state.gemini = genai.Client(api_key=settings.GEMINI_API_KEY)
    logger.info(f"Skillship AI Service starting (Model: {settings.MODEL_NAME})")

    # DB connection (optional — routes that need it will 503 if unavailable)
    try:
        conn = await psycopg.AsyncConnection.connect(settings.PGVECTOR_URL)
        await register_vector_async(conn)
        app.state.db = conn
        logger.info("pgvector DB connection established")
    except Exception as e:
        app.state.db = None
        logger.warning(f"DB unavailable — RAG routes will return 503. Reason: {e}")

    yield

    if app.state.db:
        await app.state.db.close()
    logger.info("Skillship AI Service shutting down")


app = FastAPI(
    title="Skillship AI Service",
    description="Separate Python service that owns all LLM + agent calls",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Internal-Key"],
)


@app.middleware("http")
async def verify_internal_key_middleware(request, call_next):
    if request.url.path in ["/healthz", "/docs", "/openapi.json", "/redoc", "/"]:
        return await call_next(request)
    x_internal_key = request.headers.get("X-Internal-Key")
    if not x_internal_key or x_internal_key != settings.AI_SERVICE_INTERNAL_KEY:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "Invalid or missing X-Internal-Key header"},
        )
    return await call_next(request)


@app.get("/healthz", tags=["health"])
async def health_check():
    db = getattr(app.state, "db", None)
    return {
        "service": "Skillship AI",
        "status": "ok",
        "model": settings.MODEL_NAME,
        "db": "connected" if db else "unavailable",
    }


app.include_router(career.router, prefix="/api", tags=["career"])
app.include_router(quiz.router, prefix="/api", tags=["quiz"])
app.include_router(content.router, prefix="/api", tags=["content"])


@app.get("/", tags=["root"])
async def root():
    return {"service": "Skillship AI", "version": "1.0.0", "docs": "/docs"}
