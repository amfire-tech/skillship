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

# ── Database — managed Postgres via the Supabase pooler ──────────────────────
#
# Production-only tweaks, kept out of base.py so local dev / CI (plain Postgres,
# no TLS) are unaffected:
#   - sslmode=require            Supabase only accepts TLS connections.
#   - DISABLE_SERVER_SIDE_CURSORS server-side cursors don't survive a pooled
#     connection; turning them off avoids "cursor does not exist" crashes.
DATABASES["default"]["OPTIONS"] = {  # noqa: F405
    **DATABASES["default"].get("OPTIONS", {}),  # noqa: F405
    "sslmode": "require",
}
DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True  # noqa: F405

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

# ── Email — owner notifications on new demo requests ─────────────────────────
#
# We use Django's stock SMTP backend so the cheapest option (a free Gmail
# account with an app password) works without extra packages. Set these env
# vars in Railway / Render:
#
#   EMAIL_HOST              smtp.gmail.com           (or your provider)
#   EMAIL_PORT              587
#   EMAIL_USE_TLS           true
#   EMAIL_HOST_USER         alerts@skillship.in      (the sender mailbox)
#   EMAIL_HOST_PASSWORD     <gmail app-password>     (NOT the account password)
#   DEFAULT_FROM_EMAIL      "Skillship <alerts@skillship.in>"
#   LEADS_NOTIFY_EMAIL      owner@skillship.in       (where the alert lands)
#
# If EMAIL_HOST is unset, we fall back to the console backend so nothing
# crashes — useful for first-boot before the SMTP credentials are wired.

EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
if EMAIL_HOST:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
    EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "true").lower() == "true"
    EMAIL_USE_SSL = os.environ.get("EMAIL_USE_SSL", "false").lower() == "true"
    EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
    EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
    EMAIL_TIMEOUT = int(os.environ.get("EMAIL_TIMEOUT", "15"))
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

DEFAULT_FROM_EMAIL = os.environ.get(
    "DEFAULT_FROM_EMAIL", "Skillship <noreply@skillship.in>"
)
# Where the "new demo request" notification lands. Read by apps/leads/views.py.
LEADS_NOTIFY_EMAIL = os.environ.get("LEADS_NOTIFY_EMAIL", "")

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

# ── Sentry ───────────────────────────────────────────────────────────────────
#
# Activated only when SENTRY_DSN_BACKEND is set in the env. Silent otherwise,
# so dev and CI never accidentally page Sentry. Sample rates kept low —
# error events still get 100%, but performance traces only 5% to stay inside
# the free-tier quota for a single small school deployment.

if _sentry_dsn := os.environ.get("SENTRY_DSN_BACKEND", "").strip():
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration

    sentry_sdk.init(
        dsn=_sentry_dsn,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
        ],
        traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0.05")),
        profiles_sample_rate=0.0,
        send_default_pii=False,  # no email / IP / username in events
        environment=os.environ.get("SENTRY_ENVIRONMENT", "production"),
        release=os.environ.get("SENTRY_RELEASE") or None,
    )
