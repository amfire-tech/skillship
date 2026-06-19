"""
File:    backend/apps/career/apps.py
Purpose: AppConfig for the career-roadmap engine.
Owner:   Navanish
"""

from django.apps import AppConfig


class CareerConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.career"
    verbose_name = "Career Roadmaps"
