# syntax=docker/dockerfile:1.7
#
# File:    backend/Dockerfile
# Purpose: Production image for the Django backend.
# Owner:   Navanish
#
# Build:
#   docker build -t skillship-backend -f backend/Dockerfile backend
# Run:
#   docker run --rm -p 8000:8000 --env-file backend/.env skillship-backend
#
# Multi-stage:
#   - `builder` installs deps into a wheel cache.
#   - `runtime` copies only the installed site-packages + code.
# The runtime image runs as a non-root user and uses gunicorn with gthread
# workers (good fit for the synchronous DRF + httpx-to-AI-service pattern).

# ── Stage 1: build wheels ────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Pull latest Debian security patches. Build deps for psycopg, reportlab
# (Pillow), openpyxl. The remaining upstream CVEs flagged by Trivy/Docker
# Desktop are in glibc/openssl and require waiting on Debian releases.
RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libjpeg-dev \
        zlib1g-dev \
        libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user -r requirements.txt


# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/home/app/.local/bin:$PATH \
    DJANGO_SETTINGS_MODULE=config.settings.prod \
    PORT=8000

# Runtime libs only — no compilers in the final image. Apply security
# upgrades on every rebuild so we pick up Debian-published patches.
RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends \
        libpq5 \
        libjpeg62-turbo \
        libfreetype6 \
        curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app --gid 1001 \
    && useradd --system --uid 1001 --gid app --create-home --shell /bin/bash app

WORKDIR /app

COPY --from=builder --chown=app:app /root/.local /home/app/.local
COPY --chown=app:app . /app

# Pre-create the media directory so default_storage doesn't ENOENT on first run.
RUN mkdir -p /app/media /app/staticfiles && chown -R app:app /app/media /app/staticfiles

USER app

EXPOSE 8000

# `collectstatic` runs on startup so a freshly-pulled image always picks up
# the latest static assets. `--noinput` makes it non-interactive.
# `migrate` is deliberately NOT run here — leave it to a one-shot CI step or
# a manual deploy gate so we never race two replicas applying the same migration.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:${PORT}/healthz/ || exit 1

CMD ["sh", "-c", "python manage.py collectstatic --noinput --clear && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT} --workers 3 --threads 2 --worker-class gthread --timeout 60 --access-logfile - --error-logfile -"]
