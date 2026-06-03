"""
File:    backend/apps/leads/models.py
Purpose: DemoRequest — pre-school sales lead captured from the public site.
Owner:   Navanish

A DemoRequest is NOT a TenantModel. The school does not exist in the system
yet — these rows are the funnel that *precedes* school onboarding. Once a
lead is converted, a Main Admin creates the actual School + Principal user
manually; the lead row stays as historical context (status moves to
CONVERTED).
"""

from __future__ import annotations

import uuid

from django.db import models

from apps.common.models import TimeStampedModel


class DemoRequest(TimeStampedModel):
    class StudentRange(models.TextChoices):
        UP_TO_250 = "up-to-250", "Up to 250 students"
        R_251_500 = "251-500", "251 to 500 students"
        R_501_1000 = "501-1000", "501 to 1000 students"
        OVER_1000 = "1000-plus", "1000+ students"

    class TimeSlot(models.TextChoices):
        # Fixed offering — Asia/Kolkata business hours. Matches the slots
        # shown in the public booking calendar (RequestDemoHero).
        SLOT_1030 = "10:30", "10:30 AM"
        SLOT_1130 = "11:30", "11:30 AM"
        SLOT_1230 = "12:30", "12:30 PM"
        SLOT_1500 = "15:00", "3:00 PM"
        SLOT_1600 = "16:00", "4:00 PM"

    class Status(models.TextChoices):
        NEW = "NEW", "New"
        CONTACTED = "CONTACTED", "Contacted"
        CONVERTED = "CONVERTED", "Converted"
        LOST = "LOST", "Lost"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    school_name = models.CharField(max_length=200)
    principal_name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    student_range = models.CharField(max_length=20, choices=StudentRange.choices)
    phone_number = models.CharField(max_length=30)
    email_address = models.EmailField()
    # Free-text on purpose — the public form offers values outside the CBSE/ICSE/STATE
    # whitelist (IB, Cambridge). At lead-capture time we accept whatever the user typed
    # and let sales triage. A real School row enforces the strict whitelist later.
    school_board = models.CharField(max_length=40, blank=True)

    # Booking calendar — what the prospect picked in the public hero before
    # filling the form. Both are nullable because (a) existing rows pre-date
    # the calendar feature and (b) the form is still submittable without a
    # specific slot (sales will reach out and pick a time manually).
    preferred_date = models.DateField(null=True, blank=True)
    preferred_time_slot = models.CharField(
        max_length=10, choices=TimeSlot.choices, blank=True, default=""
    )

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.NEW)
    # Set by an authenticated Main Admin during triage; never set by the public POST.
    triage_notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"], name="leads_demo_status_cat_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.school_name} ({self.email_address}) — {self.status}"
