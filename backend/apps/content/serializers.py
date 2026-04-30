"""
File:    backend/apps/content/serializers.py
Purpose: DRF serializers for ContentItem and MarketplaceListing.
Owner:   Vishal
"""

from __future__ import annotations

from rest_framework import serializers

from .models import ContentItem, MarketplaceListing


class ContentItemSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    course = serializers.PrimaryKeyRelatedField(
        queryset=__import__("apps.academics.models", fromlist=["Course"]).Course.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    klass = serializers.PrimaryKeyRelatedField(
        queryset=__import__("apps.academics.models", fromlist=["Class"]).Class.objects.all(),
        required=False,
        allow_null=True,
        pk_field=serializers.UUIDField(),
    )
    uploaded_by = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = ContentItem
        fields = [
            "id", "school", "course", "klass", "uploaded_by",
            "title", "description", "kind", "file_url",
            "duration_seconds", "ai_tags",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "school", "uploaded_by", "ai_tags", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context["request"]
        school_id = self.instance.school_id if self.instance else request.user.school_id
        course = attrs.get("course")
        klass = attrs.get("klass")
        if course and str(course.school_id) != str(school_id):
            raise serializers.ValidationError({"course": "course belongs to a different school."})
        if klass and str(klass.school_id) != str(school_id):
            raise serializers.ValidationError({"klass": "klass belongs to a different school."})
        return attrs


class MarketplaceListingSerializer(serializers.ModelSerializer):
    author_school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = MarketplaceListing
        fields = [
            "id", "title", "description", "author_school",
            "kind", "price_inr", "file_url", "cover_image_url",
            "is_active", "featured",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "author_school", "created_at", "updated_at"]
