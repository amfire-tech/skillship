# File: backend/config/__init__.py
# Purpose: Marks the config folder as a Python package.
# Why:     Django needs this so it can import config.settings, config.urls, etc.
# Owner:   Navanish

# Bootstrap Celery alongside Django so the app is available in every process
# that imports the config package (manage.py, gunicorn, celery worker).
from jobs.celery_app import app as celery_app  # noqa: F401

__all__ = ("celery_app",)
