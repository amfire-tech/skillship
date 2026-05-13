"""
File:    backend/apps/notifications/models.py
Purpose: Notification + NotificationTemplate — in-app + email + SMS deliveries.
Owner:   Vishal
"""

from __future__ import annotations

from django.db import models

from apps.common.models import TenantModel


class NotificationTemplate(TenantModel):
    class Channel(models.TextChoices):
        IN_APP = "IN_APP", "In-App"
        EMAIL = "EMAIL", "Email"
        SMS = "SMS", "SMS"
        PUSH = "PUSH", "Push"

    code = models.CharField(max_length=60)
    channel = models.CharField(max_length=10, choices=Channel.choices)
    subject = models.CharField(max_length=200, blank=True)
    body_template = models.TextField()
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        ordering = ["code"]
        indexes = [
            models.Index(fields=["school", "created_at"], name="notif_tmpl_school_cat_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "code", "channel"],
                name="notif_tmpl_unique_code_channel",
            ),
        ]

    def __str__(self):
        return f"{self.code} ({self.channel})"


class Notification(TenantModel):
    class Channel(models.TextChoices):
        IN_APP = "IN_APP", "In-App"
        EMAIL = "EMAIL", "Email"
        SMS = "SMS", "SMS"
        PUSH = "PUSH", "Push"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"
        READ = "READ", "Read"

    recipient = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    channel = models.CharField(max_length=10, choices=Channel.choices)
    title = models.CharField(max_length=200)
    body = models.TextField()
    data_json = models.JSONField(default=dict)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["school", "created_at"], name="notif_school_cat_idx"),
            models.Index(fields=["school", "recipient", "status"], name="notif_school_recip_status_idx"),
        ]

    def __str__(self):
        return f"{self.channel} → {self.recipient}: {self.title}"
