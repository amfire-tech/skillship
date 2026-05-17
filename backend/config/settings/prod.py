"""
File:    backend/config/settings/prod.py
Purpose: Production overrides — DEBUG=False, HSTS, SSL trust, JSON-line logging.
Owner:   Navanish (Phase 5)

Loaded by setting `DJANGO_SETTINGS_MODULE=config.settings.prod` (the prod
Dockerfile does this automatically). Everything not overridden here falls
back to `base.py`.

Reads from environment:
  DJANGO_SECRET_KEY          — required (no fallback)
  DJANGO_ALLOWED_HOSTS       — comma-separated, e.g. "skillship.com,www.skillship.com"
  DJANGO_CSRF_TRUSTED_ORIGINS — comma-separated, e.g. "https://skillship.com,https://www.skillship.com"
  DATABASE_URL               — Postgres URL (Supabase pooler in our setup)
  REDIS_URL                  — Celery broker + cache
  AI_SERVICE_URL             — internal compose URL (http://ai-service:8001)
  AI_SERVICE_INTERNAL_KEY    — shared with the AI service
  SENTRY_DSN_BACKEND         — optional; not wired yet (Phase 6)
"""

from __future__ import annotations

import os

from .base import *  # noqa: F401,F403


# ── Hard rules ───────────────────────────────────────────────────────────────


DEBUG = False

if os.environ.get("DJANGO_SECRET_KEY", "") in ("", "insecure-dev-key-change-me"):
    raise RuntimeError(
        "DJANGO_SECRET_KEY is unset or still the dev fallback. "
        "Set a real value in .env.prod before starting in production."
    )

ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()
]
if not ALLOWED_HOSTS:
    raise RuntimeError(
        "DJANGO_ALLOWED_HOSTS is required in production "
        "(comma-separated list, e.g. 'skillship.example.com,www.skillship.example.com')."
    )

CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()
]
# Default to https://<host> for every ALLOWED_HOST if the caller didn't spell them out.
if not CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = [f"https://{h}" for h in ALLOWED_HOSTS]

CORS_ALLOWED_ORIGINS = CSRF_TRUSTED_ORIGINS

# ── TLS / proxy trust ────────────────────────────────────────────────────────

# nginx terminates TLS and forwards `X-Forwarded-Proto: https`. Tell Django
# to trust that header so request.is_secure() returns True behind the proxy.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = False  # nginx already redirects :80 → :443

# Set HSTS conservatively at first (1 day). Bump to 31536000 once the cert
# rollover plan is proven — preloading is irreversible-ish.
SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "86400"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = False

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # CSRF token must be readable by JS for DRF POSTs

# ── Logging ──────────────────────────────────────────────────────────────────

# One-line-per-event format that journald / Loki / CloudWatch can ingest.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "plain": {
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        },
    },
    "handlers": {
        "stdout": {
            "class": "logging.StreamHandler",
            "formatter": "plain",
        },
    },
    "root": {
        "handlers": ["stdout"],
        "level": os.environ.get("LOG_LEVEL", "INFO"),
    },
    "loggers": {
        "django": {"handlers": ["stdout"], "level": "INFO", "propagate": False},
        "django.request": {"handlers": ["stdout"], "level": "WARNING", "propagate": False},
        "django.security": {"handlers": ["stdout"], "level": "INFO", "propagate": False},
        "celery": {"handlers": ["stdout"], "level": "INFO", "propagate": False},
        "apps": {"handlers": ["stdout"], "level": "INFO", "propagate": False},
    },
}

# ── Sentry (deferred — wired in Phase 6 / post-launch) ───────────────────────
# import sentry_sdk
# from sentry_sdk.integrations.django import DjangoIntegration
# from sentry_sdk.integrations.celery import CeleryIntegration
# if dsn := os.environ.get("SENTRY_DSN_BACKEND"):
#     sentry_sdk.init(
#         dsn=dsn,
#         integrations=[DjangoIntegration(), CeleryIntegration()],
#         traces_sample_rate=0.05,
#         send_default_pii=False,
#         environment=os.environ.get("SENTRY_ENVIRONMENT", "production"),
#     )
