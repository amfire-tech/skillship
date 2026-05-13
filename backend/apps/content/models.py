"""
File:    backend/apps/content/models.py
Purpose: ContentItem (school-private learning materials) + MarketplaceListing (public catalog).
Owner:   Vishal
"""

from __future__ import annotations

import uuid

from django.db import models

from apps.common.models import TenantModel, TimeStampedModel


class ContentItem(TenantModel):
    class Kind(models.TextChoices):
        VIDEO = "VIDEO", "Video"
        PDF = "PDF", "PDF"
        ARTICLE = "ARTICLE", "Article"
        INTERACTIVE = "INTERACTIVE", "Interactive"
        COURSE = "COURSE", "Course"

    course = models.ForeignKey(
        "academics.Course",
        on_delete=models.CASCADE,
        related_name="content_items",
    )
    klass = models.ForeignKey(
        "academics.Class",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="content_items",
    )
    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_content",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    kind = models.CharField(max_length=15, choices=Kind.choices)
    file_url = models.URLField(max_length=500)
    duration_seconds = models.PositiveIntegerField(default=0)
    ai_tags = models.JSONField(default=list)

    class Meta(TenantModel.Meta):
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["school", "created_at"], name="content_item_school_cat_idx"),
            models.Index(fields=["school", "course", "kind"], name="cnt_item_course_kind_idx"),
        ]

    def __str__(self):
        return f"{self.kind} — {self.title}"


class MarketplaceListing(TimeStampedModel):
    class Kind(models.TextChoices):
        VIDEO = "VIDEO", "Video"
        PDF = "PDF", "PDF"
        ARTICLE = "ARTICLE", "Article"
        INTERACTIVE = "INTERACTIVE", "Interactive"
        COURSE = "COURSE", "Course"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    author_school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="marketplace_listings",
    )
    kind = models.CharField(max_length=15, choices=Kind.choices)
    price_inr = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    file_url = models.URLField(max_length=500)
    cover_image_url = models.URLField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_active", "featured"], name="mktpl_active_featured_idx"),
            models.Index(fields=["kind", "is_active"], name="marketplace_kind_active_idx"),
        ]

    def __str__(self):
        return self.title
