"""
File:    backend/jobs/celery_app.py
Purpose: Celery application — broker config, task auto-discovery, beat scheduler.
Owner:   Navanish

How it wires up:
  1. config/__init__.py imports `celery_app` from here so Django's startup sequence
     bootstraps Celery automatically — no extra CLI flags needed for `manage.py`.
  2. app.autodiscover_tasks() scans INSTALLED_APPS for tasks.py modules.
     Tasks in this jobs/ package register via @shared_task which binds to the
     default app at import time — no explicit include list needed.
  3. The beat scheduler is django-celery-beat (DatabaseScheduler) — schedules are
     managed via the Django admin, not hardcoded here.
"""

import os

from celery import Celery

# Fallback for direct Celery invocation (e.g. `celery -A jobs.celery_app worker`).
# When started via manage.py this env var is already set; setdefault is a no-op.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("skillship")

# Pull every CELERY_* key from Django settings — single source of truth.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Discover @shared_task decorators in every app listed in INSTALLED_APPS.
app.autodiscover_tasks()
