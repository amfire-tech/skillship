"""
File:    backend/apps/exam_alerts/serializers.py
Purpose: DRF serializer for ExamAlert.
Owner:   Navanish
"""

from __future__ import annotations

from rest_framework import serializers

from apps.academics.models import Class

from .models import ExamAlert


class ExamAlertSerializer(serializers.ModelSerializer):
    """Read + write shape for an exam alert.

    `klass` is the assigned class (UUID in, validated against the caller's
    school in the view). The `*_display` and name fields are read-only conveniences
    the teacher and student UIs render directly.
    """

    klass = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(), pk_field=serializers.UUIDField()
    )
    class_name = serializers.SerializerMethodField()
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    mode_display = serializers.CharField(source="get_mode_display", read_only=True)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ExamAlert
        fields = [
            "id",
            "title",
            "category",
            "category_display",
            "mode",
            "mode_display",
            "exam_date",
            "klass",
            "class_name",
            "description",
            "venue",
            "created_by",
            "created_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]

    def get_class_name(self, obj):
        k = obj.klass
        return f"Grade {k.grade}-{k.section}" if k else None

    def get_created_by_name(self, obj):
        u = obj.created_by
        return (u.get_full_name() or u.username) if u else None

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Exam name is required.")
        return value
