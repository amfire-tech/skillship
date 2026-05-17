# syntax=docker/dockerfile:1.7
#
# File:    ai-service/Dockerfile
# Purpose: Production image for the FastAPI AI service.
# Owner:   Navanish
#
# Public traffic never reaches this container — nginx in prod-compose refuses
# to proxy here and the Django backend is the only allowed caller (auth is
# X-Internal-Key, enforced by app.main:verify_internal_key_middleware).

FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Pull latest security patches from the Debian base. Scanners flag a small
# constant set of CVEs in upstream system libs (glibc / openssl) we can't
# eliminate — `upgrade` keeps us current; further mitigation is at the
# host kernel / nginx layer.
RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user -r requirements.txt


FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/home/app/.local/bin:$PATH \
    PORT=8001

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app --gid 1001 \
    && useradd --system --uid 1001 --gid app --create-home --shell /bin/bash app

WORKDIR /app

COPY --from=builder --chown=app:app /root/.local /home/app/.local
COPY --chown=app:app app /app/app

USER app

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://localhost:${PORT}/healthz || exit 1

# Single uvicorn process is intentional — each Gemini call is async-IO bound,
# so one process scales fine within a node. Run 2-3 replicas in compose for HA.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --log-level info --access-log --no-server-header"]
