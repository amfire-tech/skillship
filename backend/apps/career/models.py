"""
File:    backend/apps/career/models.py
Purpose: The career-roadmap engine — the product moat.
Owner:   Navanish

Cost design (read before touching):
  The expensive Gemini generation is the *detailed roadmap* for a given
  (career, grade, board). That output is ~identical for every student with the
  same three inputs, so we generate it ONCE and reuse it across all schools:

    - RoadmapTemplate  → platform-level cache. NOT a TenantModel. Holds zero
                         student/school PII (it is generic guidance), so sharing
                         it across tenants is safe and is the whole point —
                         marginal AI cost per extra student trends to ~0.
    - StudentRoadmap   → per-student record that points at a template. One row
                         per "generate a roadmap" action; capped 3 / month.
    - StudentCareerProfile → the chosen career objective saved on the student.
    - CareerChecklist / ChecklistTask → the 30-day day-by-day plan with
                         completion tracking. The checklist IS a per-student
                         Gemini call (personalised), so it is capped 1 / month.

Quota note: the 3-roadmaps and 1-checklist monthly limits are enforced in views
by counting rows created in the current calendar month — no counter columns to
drift out of sync.
"""

from __future__ import annotations

import uuid

from django.db import models

from apps.common.models import TenantModel, TimeStampedModel


# ── Platform-level cache (NOT tenant-scoped — generic, no PII) ─────────────────


class RoadmapTemplate(TimeStampedModel):
    """One cached detailed roadmap per (career, grade, board), reused by every
    student who matches. This table is the cost moat: a cache hit here means a
    new student gets a full roadmap with ZERO Gemini cost."""

    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)

    career_slug = models.SlugField(max_length=80, db_index=True)
    career_title = models.CharField(max_length=120)
    grade = models.PositiveSmallIntegerField()
    board = models.CharField(max_length=10)  # CBSE / ICSE / STATE — mirrors School.Board

    # The full structured roadmap the AI service returned (sections + items).
    detail_json = models.JSONField()

    version = models.PositiveIntegerField(default=1)
    # Audit link back to the AiJob that generated this (nullable: mock/seed rows).
    source_job = models.ForeignKey(
        "ai_bridge.AiJob",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="roadmap_templates",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["career_slug", "grade", "board"],
                name="roadmap_template_unique_career_grade_board",
            ),
        ]
        indexes = [models.Index(fields=["career_slug", "grade", "board"])]

    def __str__(self) -> str:
        return f"{self.career_title} / G{self.grade} / {self.board}"


# ── Per-student records (tenant-scoped) ────────────────────────────────────────


class StudentCareerProfile(TenantModel):
    """The student's chosen career objective — 'what I want to become'."""

    student = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="career_profile",
    )
    career_slug = models.SlugField(max_length=80, blank=True)
    career_title = models.CharField(max_length=120, blank=True)
    objective_set_at = models.DateTimeField(null=True, blank=True)

    # Points at the roadmap the student committed to (the objective's roadmap).
    active_roadmap = models.ForeignKey(
        "career.StudentRoadmap",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    class Meta(TenantModel.Meta):
        pass

    def __str__(self) -> str:
        return f"CareerProfile({self.student_id} → {self.career_title or 'unset'})"


class StudentRoadmap(TenantModel):
    """A roadmap a student generated/viewed. Counts toward the 3/month quota.
    The actual roadmap content lives on the shared RoadmapTemplate it points to."""

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="career_roadmaps",
    )
    template = models.ForeignKey(
        RoadmapTemplate,
        on_delete=models.SET_NULL,
        null=True,
        related_name="student_roadmaps",
    )
    career_slug = models.SlugField(max_length=80)
    career_title = models.CharField(max_length=120)
    grade = models.PositiveSmallIntegerField()
    board = models.CharField(max_length=10)

    # Generated roadmaps are kept for history/quota, but only surface in the
    # student's "Saved Roadmaps" once they explicitly save (or commit) them.
    is_saved = models.BooleanField(default=False)
    # True once the student commits this roadmap as their objective.
    is_objective = models.BooleanField(default=False)

    class Meta(TenantModel.Meta):
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=["student", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"StudentRoadmap({self.student_id} → {self.career_title})"


class CareerChecklist(TenantModel):
    """A 30-day day-by-day plan for a committed objective. One per student per
    calendar month (the per-student Gemini call is the cost line we cap)."""

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="career_checklists",
    )
    roadmap = models.ForeignKey(
        StudentRoadmap,
        on_delete=models.SET_NULL,
        null=True,
        related_name="checklists",
    )
    career_title = models.CharField(max_length=120)
    headline = models.CharField(max_length=240, blank=True)
    period_start = models.DateField()
    period_end = models.DateField()
    source_job = models.ForeignKey(
        "ai_bridge.AiJob",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="career_checklists",
    )

    class Meta(TenantModel.Meta):
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=["student", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"CareerChecklist({self.student_id} / {self.period_start})"


class ChecklistTask(TenantModel):
    """One day's task in a 30-day checklist, with completion tracking."""

    checklist = models.ForeignKey(
        CareerChecklist,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    day_index = models.PositiveSmallIntegerField()  # 1..30
    due_date = models.DateField()
    title = models.CharField(max_length=200)
    detail = models.TextField(blank=True)
    category = models.CharField(max_length=40, blank=True)

    is_done = models.BooleanField(default=False)
    done_at = models.DateTimeField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        ordering = ["day_index"]
        constraints = [
            models.UniqueConstraint(
                fields=["checklist", "day_index"],
                name="checklist_task_unique_day",
            ),
        ]

    def __str__(self) -> str:
        return f"Day {self.day_index}: {self.title[:40]}"
