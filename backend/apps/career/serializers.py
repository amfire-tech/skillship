"""
File:    backend/apps/career/serializers.py
Purpose: Serializers for the career-roadmap endpoints.
Owner:   Navanish
"""

from __future__ import annotations

from rest_framework import serializers

from .models import CareerChecklist, ChecklistTask, StudentCareerProfile, StudentRoadmap


class InterestQuizScoreSerializer(serializers.Serializer):
    """Body for POST /career/interest-quiz/score/ — {answers: {q1: 1..5, ...}}."""

    answers = serializers.DictField(
        child=serializers.IntegerField(min_value=1, max_value=5),
        allow_empty=False,
    )


class RoadmapRequestSerializer(serializers.Serializer):
    """Body for POST /career/roadmap/ — the chosen career to expand."""

    career_slug = serializers.SlugField(max_length=80)


class ObjectiveSerializer(serializers.Serializer):
    """Body for POST /career/objective/ — commit a generated roadmap as the goal."""

    roadmap_id = serializers.UUIDField()


class StudentRoadmapSerializer(serializers.ModelSerializer):
    roadmap = serializers.SerializerMethodField()

    class Meta:
        model = StudentRoadmap
        fields = [
            "id", "career_slug", "career_title", "grade", "board",
            "is_saved", "is_objective", "created_at", "roadmap",
        ]

    def get_roadmap(self, obj) -> dict | None:
        return obj.template.detail_json if obj.template_id else None


class CareerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentCareerProfile
        fields = ["career_slug", "career_title", "objective_set_at", "active_roadmap"]


class ChecklistTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistTask
        fields = [
            "id", "day_index", "due_date", "title", "detail",
            "category", "is_done", "done_at",
        ]


class CareerChecklistSerializer(serializers.ModelSerializer):
    tasks = ChecklistTaskSerializer(many=True, read_only=True)
    done_count = serializers.SerializerMethodField()
    total_count = serializers.SerializerMethodField()

    class Meta:
        model = CareerChecklist
        fields = [
            "id", "career_title", "headline", "period_start", "period_end",
            "created_at", "done_count", "total_count", "tasks",
        ]

    def get_done_count(self, obj) -> int:
        return sum(1 for t in obj.tasks.all() if t.is_done)

    def get_total_count(self, obj) -> int:
        return obj.tasks.count()
