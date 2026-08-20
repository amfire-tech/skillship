"""
File:    backend/apps/gallery/models.py
Purpose: GalleryImage — public marketing-site photo gallery.
Owner:   Navanish

Not a TenantModel. The gallery is a platform-level marketing surface shown to
anonymous visitors on the public site (like MarketplaceListing in
apps.content), not scoped to any one school.
"""

from __future__ import annotations

import uuid

from django.db import models

from apps.common.models import TimeStampedModel


class GalleryImage(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    image = models.ImageField(upload_to="gallery/")
    caption = models.CharField(max_length=200, blank=True)
    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_gallery_images",
    )
    # Lower sorts first. Ties break by newest-first (see Meta.ordering).
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["display_order", "-created_at"]
        indexes = [
            models.Index(fields=["is_active", "display_order"], name="gallery_active_order_idx"),
        ]

    def __str__(self) -> str:
        return self.caption or f"Gallery image {self.id}"
