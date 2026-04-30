"""
File:    backend/apps/quizzes/serializers.py
Purpose: DRF serializers for quiz entities — with variants that hide correct answers from students.
Owner:   Vishal
"""

from __future__ import annotations

from rest_framework import serializers

from .models import Answer, Question, QuestionBank, Quiz, QuizAttempt


# ── Helpers ──────────────────────────────────────────────────────────────────


def _validate_same_school(target_school_id, fk_obj, field_name: str):
    if fk_obj is None:
        return
    if str(fk_obj.school_id) != str(target_school_id):
        raise serializers.ValidationError(
            {field_name: f"{field_name} belongs to a different school."}
        )


def _resolve_school_id(serializer):
    if serializer.instance is not None:
        return serializer.instance.school_id
    request = serializer.context["request"]
    actor = request.user
    from apps.common.permissions import Role

    if actor.role == Role.MAIN_ADMIN:
        target = request.data.get("school")
        if not target:
            raise serializers.ValidationError(
                {"school": "MAIN_ADMIN must specify `school` when creating tenant-scoped rows."}
            )
        return target
    return actor.school_id


# ── QuestionBank ─────────────────────────────────────────────────────────────


class QuestionBankSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    course = serializers.PrimaryKeyRelatedField(
        queryset=__import__("apps.academics.models", fromlist=["Course"]).Course.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    created_by = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = QuestionBank
        fields = ["id", "school", "course", "name", "description", "created_by", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        school_id = _resolve_school_id(self)
        _validate_same_school(school_id, attrs.get("course"), "course")
        return attrs


# ── Question ─────────────────────────────────────────────────────────────────


class QuestionSerializer(serializers.ModelSerializer):
    """Full serializer — includes correct answers. Teachers and admins only."""

    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    bank = serializers.PrimaryKeyRelatedField(
        queryset=QuestionBank.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    created_by = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Question
        fields = [
            "id", "school", "bank", "text", "type", "difficulty",
            "options", "correct_option_ids", "accepted_answers",
            "explanation", "tags", "points", "ai_generated",
            "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        school_id = _resolve_school_id(self)
        _validate_same_school(school_id, attrs.get("bank"), "bank")
        return attrs


class QuestionStudentSerializer(serializers.ModelSerializer):
    """Student-safe serializer — correct_option_ids and accepted_answers are excluded."""

    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    bank = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Question
        fields = [
            "id", "school", "bank", "text", "type", "difficulty",
            "options", "explanation", "tags", "points",
            "created_at",
        ]
        read_only_fields = fields


# ── Quiz ─────────────────────────────────────────────────────────────────────


class QuizSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    bank = serializers.PrimaryKeyRelatedField(
        queryset=QuestionBank.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    course = serializers.PrimaryKeyRelatedField(
        queryset=__import__("apps.academics.models", fromlist=["Course"]).Course.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    created_by = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Quiz
        fields = [
            "id", "school", "bank", "course", "created_by",
            "title", "description", "status",
            "is_adaptive", "randomize_questions", "randomize_options",
            "duration_minutes", "total_questions", "pass_percentage",
            "attempts_allowed", "published_at", "archived_at",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "status", "published_at", "archived_at", "created_at", "updated_at"]

    def validate(self, attrs):
        school_id = _resolve_school_id(self)
        _validate_same_school(school_id, attrs.get("bank"), "bank")
        _validate_same_school(school_id, attrs.get("course"), "course")
        return attrs


# ── QuizAttempt ───────────────────────────────────────────────────────────────


class QuizAttemptSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    quiz = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    student = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = QuizAttempt
        fields = [
            "id", "school", "quiz", "student", "status", "attempt_number",
            "started_at", "expires_at", "submitted_at",
            "score_percent", "points_earned", "points_total", "correct_count",
            "question_order", "last_difficulty",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


# ── Answer ────────────────────────────────────────────────────────────────────


class AnswerSubmitSerializer(serializers.Serializer):
    """Input-only: what a student sends when answering a question."""

    question_id = serializers.UUIDField()
    selected_option_ids = serializers.ListField(child=serializers.UUIDField(), default=list)
    text_response = serializers.CharField(allow_blank=True, default="")
    time_spent_seconds = serializers.IntegerField(min_value=0, default=0)


class AnswerSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    attempt = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    question = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Answer
        fields = [
            "id", "school", "attempt", "question",
            "selected_option_ids", "text_response",
            "is_correct", "points_awarded", "time_spent_seconds", "answered_at",
            "created_at", "updated_at",
        ]
        read_only_fields = fields
