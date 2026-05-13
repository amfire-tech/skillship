"""
File:    backend/apps/analytics/serializers.py
Purpose: DRF serializers for analytics models + dashboard payload DTOs.
Owner:   Vishal
"""

from __future__ import annotations

from rest_framework import serializers

from .models import ClassWeeklyStats, RiskSignal, StudentDailyStats


class StudentDailyStatsSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    student = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = StudentDailyStats
        fields = [
            "id", "school", "student", "date",
            "quizzes_taken", "avg_score", "time_spent_seconds",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


class ClassWeeklyStatsSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    klass = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = ClassWeeklyStats
        fields = [
            "id", "school", "klass", "week_start_date",
            "avg_score", "at_risk_count",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


class RiskSignalSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    student = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    acknowledged_by = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = RiskSignal
        fields = [
            "id", "school", "student", "level", "kind",
            "reason", "evidence_json",
            "acknowledged_by", "acknowledged_at",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


# ── Dashboard DTOs ────────────────────────────────────────────────────────────


class StudentDashboardSerializer(serializers.Serializer):
    """Computed dashboard payload for a single student."""

    recent_stats = StudentDailyStatsSerializer(many=True)
    total_quizzes_taken = serializers.IntegerField()
    avg_score_last_30d = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    total_time_spent_hours = serializers.FloatField()
    active_risk_signals = RiskSignalSerializer(many=True)


class TeacherDashboardSerializer(serializers.Serializer):
    """Computed dashboard payload for a teacher viewing their class."""

    class_weekly_stats = ClassWeeklyStatsSerializer(many=True)
    at_risk_students_count = serializers.IntegerField()
    class_avg_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    recent_risk_signals = RiskSignalSerializer(many=True)


class PrincipalDashboardSerializer(serializers.Serializer):
    """Computed school-wide dashboard payload for principals."""

    school_avg_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    total_at_risk = serializers.IntegerField()
    class_stats = ClassWeeklyStatsSerializer(many=True)
    top_risk_signals = RiskSignalSerializer(many=True)
