"""
File:    backend/apps/schools/serializers.py
Purpose: DRF serializers for the School resource (and its 1-1 SchoolSettings).
Owner:   Prashant

Schools are the *tenant root* — only MAIN_ADMIN ever lists / creates / mutates
them. The serializer therefore validates inputs strictly (slug uniqueness,
plan / board enums) and exposes every field on read; we don't need to hide
anything from a platform admin.

If a MAIN_ADMIN omits `slug` on create we derive one from `name` so the UI
can stay simple. They can still override it explicitly.
"""

from __future__ import annotations

from django.utils.text import slugify
from rest_framework import serializers

from .models import School, SchoolSettings


class SchoolSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    slug = serializers.SlugField(max_length=200, required=False)

    class Meta:
        model = School
        fields = [
            "id",
            "name",
            "slug",
            "board",
            "city",
            "state",
            "address",
            "plan",
            "subscription_expires_at",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        # Auto-derive slug from name on create when not provided.
        if self.instance is None and not attrs.get("slug"):
            base = slugify(attrs.get("name", ""))
            if not base:
                raise serializers.ValidationError(
                    {"slug": "slug is required when name has no slug-able characters"}
                )
            attrs["slug"] = base
        return attrs

    def validate_slug(self, value):
        # Catch the race / duplicate at the serializer layer for a friendlier
        # error message than the bare DB IntegrityError. The unique=True on the
        # model is still the real guarantee.
        qs = School.objects.filter(slug=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A school with this slug already exists.")
        return value


class SchoolSettingsSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = SchoolSettings
        fields = [
            "id",
            "school",
            "ai_enabled",
            "custom_agent_config",
            "branding",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]
