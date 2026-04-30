"""
File:    backend/apps/analytics/models.py
Purpose: Pre-aggregated tables + risk signals — powers dashboards fast.
Owner:   Vishal
"""

from __future__ import annotations

from django.db import models

from apps.common.models import TenantModel


class StudentDailyStats(TenantModel):
    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="daily_stats",
    )
    date = models.DateField()
    quizzes_taken = models.PositiveSmallIntegerField(default=0)
    avg_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    time_spent_seconds = models.PositiveIntegerField(default=0)

    class Meta(TenantModel.Meta):
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["school", "created_at"], name="analytics_stu_school_cat_idx"),
            models.Index(fields=["school", "student", "date"], name="anlyt_stu_stud_date_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "date"],
                name="student_daily_stats_unique_per_day",
            ),
        ]

    def __str__(self):
        return f"{self.student} stats on {self.date}"


class ClassWeeklyStats(TenantModel):
    klass = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="weekly_stats",
    )
    week_start_date = models.DateField()
    avg_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    at_risk_count = models.PositiveSmallIntegerField(default=0)

    class Meta(TenantModel.Meta):
        ordering = ["-week_start_date"]
        indexes = [
            models.Index(fields=["school", "created_at"], name="analytics_cls_school_cat_idx"),
            models.Index(fields=["school", "klass", "week_start_date"], name="anlyt_cls_klass_week_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["klass", "week_start_date"],
                name="class_weekly_stats_unique_per_week",
            ),
        ]

    def __str__(self):
        return f"{self.klass} week of {self.week_start_date}"


class RiskSignal(TenantModel):
    class Level(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"

    class Kind(models.TextChoices):
        ATTENDANCE = "ATTENDANCE", "Attendance"
        ACADEMIC = "ACADEMIC", "Academic"
        BEHAVIOR = "BEHAVIOR", "Behavior"

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="risk_signals",
    )
    level = models.CharField(max_length=10, choices=Level.choices)
    kind = models.CharField(max_length=15, choices=Kind.choices)
    reason = models.TextField()
    evidence_json = models.JSONField(default=dict)
    acknowledged_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acknowledged_risks",
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["school", "created_at"], name="analytics_risk_school_cat_idx"),
            models.Index(fields=["school", "student", "level"], name="analytics_risk_stud_level_idx"),
        ]

    def __str__(self):
        return f"{self.level} {self.kind} risk — {self.student}"
