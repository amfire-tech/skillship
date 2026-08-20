"""
File:    backend/apps/gallery/serializers.py
Purpose: DRF serializer for GalleryImage.
Owner:   Navanish
"""

from __future__ import annotations

from rest_framework import serializers

from .models import GalleryImage


class GalleryImageSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.UUIDField()
    )

    class Meta:
        model = GalleryImage
        fields = [
            "id", "image", "caption", "uploaded_by",
            "display_order", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "uploaded_by", "created_at", "updated_at"]
