"""
File:    backend/apps/exam_alerts/models.py
Purpose: ExamAlert — an upcoming exam a teacher schedules for one of their
         classes (class test / semester / entrance / other). Students enrolled
         in the class see it on their Exam Alerts page; the teacher sees the
         alerts they created on their own dashboard.
Owner:   Navanish
"""

from __future__ import annotations

from django.db import models

from apps.common.models import TenantModel


class ExamAlert(TenantModel):
    """A scheduled exam, assigned to one class by a staff member.

    Tenant-scoped (TenantModel): every alert belongs to a school, and the
    viewset never returns one across the school boundary. The assigned `klass`
    decides which students see it.
    """

    class Category(models.TextChoices):
        CLASS_TEST = "CLASS_TEST", "Class Test"
        SEMESTER = "SEMESTER", "Semester Exam"
        ENTRANCE = "ENTRANCE", "Entrance Exam"
        OTHER = "OTHER", "Other"

    class Mode(models.TextChoices):
        PHYSICAL = "PHYSICAL", "Physical"
        VIRTUAL = "VIRTUAL", "Virtual"

    title = models.CharField(max_length=200)
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.CLASS_TEST
    )
    mode = models.CharField(
        max_length=10, choices=Mode.choices, default=Mode.PHYSICAL
    )
    exam_date = models.DateField()
    klass = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="exam_alerts",
    )
    description = models.TextField(blank=True)
    # Physical venue ("Room 204, Block B") or a virtual joining link.
    venue = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_exam_alerts",
    )

    class Meta:
        ordering = ["exam_date", "-created_at"]
        indexes = [
            models.Index(fields=["school", "exam_date"]),
            models.Index(fields=["klass", "exam_date"]),
        ]

    def __str__(self) -> str:  # pragma: no cover - admin/debug convenience
        return f"{self.title} ({self.exam_date})"
