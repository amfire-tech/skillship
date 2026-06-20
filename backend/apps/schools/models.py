"""
School — the tenant root. Every piece of data in the system belongs to one School.
School itself is NOT a TenantModel — it IS the tenant.
"""

import uuid

from django.db import models

from apps.common.models import TimeStampedModel


class School(TimeStampedModel):
    class Board(models.TextChoices):
        CBSE = "CBSE", "CBSE"
        ICSE = "ICSE", "ICSE"
        STATE = "STATE", "State Board"

    class Plan(models.TextChoices):
        CORE = "CORE", "Core (Plan 01)"
        AGENTIC = "AGENTIC", "Agentic (Plan 02)"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    board = models.CharField(max_length=10, choices=Board.choices)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    plan = models.CharField(max_length=10, choices=Plan.choices, default=Plan.CORE)
    subscription_expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    # School logo as a base64 data-URL (e.g. "data:image/png;base64,...").
    # Stored inline rather than as an uploaded file so it needs no media-serving
    # infra (nginx /media/, persistent volume) and returns in one API call — fine
    # for a small logo. Set/cleared by MAIN_ADMIN; read by every role's /auth/me/.
    logo = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class SchoolSettings(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.OneToOneField(School, on_delete=models.CASCADE, related_name="settings")
    ai_enabled = models.BooleanField(default=True)
    custom_agent_config = models.JSONField(default=dict, blank=True)
    branding = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name_plural = "School settings"

    def __str__(self):
        return f"Settings for {self.school.name}"
