"""
File:    backend/apps/ai_bridge/models.py
Purpose: AiJob — one row per AI call, regardless of outcome.
Owner:   Navanish

Three uses:
  - Audit: who called what, when, at what cost.
  - Retry: request_json contains everything needed to replay a FAILED job.
  - Budget: tokens_in/out + cost_inr feed the per-school monthly AI budget check.
"""

from django.db import models

from apps.common.models import TenantModel


class AiJob(TenantModel):
    """Persistent record of every call made through the AI bridge."""

    class Kind(models.TextChoices):
        # Plan 01 only. Do NOT add Plan 02 kinds (TUTOR, RISK, REPORT, TAG).
        CAREER         = "CAREER",         "Career Pilot"
        QUESTION_GEN   = "QUESTION_GEN",   "Question Generator"
        ADAPTIVE_NEXT  = "ADAPTIVE_NEXT",  "Adaptive Next Question"
        CONTENT_SEARCH = "CONTENT_SEARCH", "Content Search"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        RUNNING = "RUNNING", "Running"
        DONE    = "DONE",    "Done"
        FAILED  = "FAILED",  "Failed"

    kind   = models.CharField(max_length=30, choices=Kind.choices, db_index=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING, db_index=True,
    )
    request_json  = models.JSONField()
    response_json = models.JSONField(null=True, blank=True)
    error         = models.TextField(blank=True)

    # Which model the AI service used (e.g. "gemini-1.5-flash"). Empty until DONE.
    model_used = models.CharField(max_length=100, blank=True)

    # Token counts and cost are null until the job completes successfully.
    tokens_in  = models.PositiveIntegerField(null=True)
    tokens_out = models.PositiveIntegerField(null=True)
    # DecimalField avoids float drift on currency values.
    cost_inr   = models.DecimalField(max_digits=10, decimal_places=4, null=True)

    duration_ms = models.PositiveIntegerField(null=True)

    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="ai_jobs",
    )

    class Meta(TenantModel.Meta):
        ordering = ["-created_at"]
        # Extend parent indexes — do not drop the (school, created_at) composite.
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=["school", "kind", "status"]),
            models.Index(fields=["created_by", "kind"]),
        ]

    def __str__(self) -> str:
        return f"AiJob({self.kind}/{self.status}) school={self.school_id}"
