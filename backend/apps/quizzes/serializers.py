"""
File:    backend/apps/quizzes/serializers.py
Purpose: DRF serializers for QuestionBank, Question, Quiz, QuizAttempt, Answer.
Owner:   Navanish

Two design rules:

  1. The student-facing question shape is *different* from the staff-facing
     one — `correct_option_ids`, `accepted_answers`, and `explanation` are
     stripped. We never let a serializer choose a shape based on a flag at
     read time; instead we expose two distinct classes (`QuestionSerializer`
     for staff, `QuestionStudentSerializer` for students). Easy to audit.

  2. Cross-FK same-school validation is mandatory. A PRINCIPAL of school A
     could otherwise smuggle a course UUID from school B into a payload —
     `_validate_same_school` is the helper that catches it. (Same approach
     as apps/academics/serializers.py.)
"""

from __future__ import annotations

from rest_framework import serializers

from apps.academics.models import Course
from apps.common.permissions import Role

from .models import Answer, Question, QuestionBank, Quiz, QuizAttempt


# ── Shared helpers (mirrors academics/serializers.py) ──────────────────────


def _resolve_target_school_id(serializer):
    """The school_id this row will live under — same rule as TenantScopedViewSet."""
    if serializer.instance is not None:
        return serializer.instance.school_id

    request = serializer.context["request"]
    actor = request.user
    if actor.role == Role.MAIN_ADMIN:
        target = request.data.get("school")
        if not target:
            raise serializers.ValidationError(
                {"school": "MAIN_ADMIN must specify `school` when creating tenant-scoped rows."}
            )
        return target
    return actor.school_id


def _validate_same_school(target_school_id, fk_obj, field_name: str):
    if fk_obj is None:
        return
    if str(fk_obj.school_id) != str(target_school_id):
        raise serializers.ValidationError(
            {field_name: f"{field_name} belongs to a different school."}
        )


# ── QuestionBank ────────────────────────────────────────────────────────────


class QuestionBankSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    created_by = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = QuestionBank
        fields = [
            "id", "school", "course", "name", "description",
            "created_by", "question_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "question_count", "created_at", "updated_at"]

    def get_question_count(self, obj) -> int:
        return obj.questions.count()

    def validate(self, attrs):
        target_school = _resolve_target_school_id(self)
        _validate_same_school(target_school, attrs.get("course"), "course")
        return attrs


# ── Question (staff view: full data) ────────────────────────────────────────


class _OptionSerializer(serializers.Serializer):
    """Shape of one option inside Question.options."""
    id = serializers.CharField(max_length=10)
    text = serializers.CharField(max_length=500)


class QuestionSerializer(serializers.ModelSerializer):
    """Staff view — includes `correct_option_ids`, `accepted_answers`, `explanation`."""

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
        target_school = _resolve_target_school_id(self)
        _validate_same_school(target_school, attrs.get("bank"), "bank")

        q_type = attrs.get("type") or (self.instance and self.instance.type)
        options = attrs.get("options")
        if options is None and self.instance is not None:
            options = self.instance.options
        correct = attrs.get("correct_option_ids")
        if correct is None and self.instance is not None:
            correct = self.instance.correct_option_ids
        accepted = attrs.get("accepted_answers")
        if accepted is None and self.instance is not None:
            accepted = self.instance.accepted_answers

        self._validate_shape(q_type, options or [], correct or [], accepted or [])
        return attrs

    @staticmethod
    def _validate_shape(q_type: str, options, correct, accepted):
        if q_type == Question.Type.SHORT_ANSWER:
            if options:
                raise serializers.ValidationError(
                    {"options": "SHORT_ANSWER questions must not carry options."}
                )
            if correct:
                raise serializers.ValidationError(
                    {"correct_option_ids": "SHORT_ANSWER must use accepted_answers, not correct_option_ids."}
                )
            if not accepted:
                raise serializers.ValidationError(
                    {"accepted_answers": "SHORT_ANSWER requires at least one accepted answer."}
                )
            return

        # MCQ + TRUE_FALSE share the same option-list shape.
        if not isinstance(options, list) or not options:
            raise serializers.ValidationError({"options": "options must be a non-empty list."})

        seen_ids: set[str] = set()
        for opt in options:
            if not isinstance(opt, dict) or "id" not in opt or "text" not in opt:
                raise serializers.ValidationError(
                    {"options": "each option must be {id, text}."}
                )
            if opt["id"] in seen_ids:
                raise serializers.ValidationError({"options": f"duplicate option id {opt['id']!r}."})
            seen_ids.add(opt["id"])

        if not correct or not all(c in seen_ids for c in correct):
            raise serializers.ValidationError(
                {"correct_option_ids": "every correct id must be present in options."}
            )
        if q_type == Question.Type.TRUE_FALSE and len(correct) != 1:
            raise serializers.ValidationError(
                {"correct_option_ids": "TRUE_FALSE expects exactly one correct id."}
            )


# ── Question (student view: no answers, no explanation) ─────────────────────


class QuestionStudentSerializer(serializers.ModelSerializer):
    """Student-safe shape: never reveals correct answers or accepted_answers.

    Used at attempt time — students never call /questions/ directly.
    """

    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    bank = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Question
        fields = ["id", "school", "bank", "text", "type", "difficulty", "options", "points"]
        read_only_fields = fields


# ── Quiz ────────────────────────────────────────────────────────────────────


class QuizSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    bank = serializers.PrimaryKeyRelatedField(
        queryset=QuestionBank.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    created_by = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Quiz
        fields = [
            "id", "school", "course", "bank",
            "title", "description", "status",
            "is_adaptive", "randomize_questions", "randomize_options",
            "duration_minutes", "total_questions", "pass_percentage", "attempts_allowed",
            "published_at", "archived_at",
            "created_by", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "school", "status", "published_at", "archived_at",
            "created_by", "created_at", "updated_at",
        ]

    def validate(self, attrs):
        target_school = _resolve_target_school_id(self)
        _validate_same_school(target_school, attrs.get("course"), "course")
        _validate_same_school(target_school, attrs.get("bank"), "bank")

        # bank must serve the same course as the quiz.
        bank = attrs.get("bank") or (self.instance and self.instance.bank)
        course = attrs.get("course") or (self.instance and self.instance.course)
        if bank and course and bank.course_id != course.id:
            raise serializers.ValidationError(
                {"bank": "bank must belong to the same course as the quiz."}
            )
        return attrs


class QuizStudentSerializer(serializers.ModelSerializer):
    """Lightweight, read-only quiz shape for STUDENT listings."""

    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    course = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Quiz
        fields = [
            "id", "school", "course", "title", "description",
            "is_adaptive", "duration_minutes", "total_questions",
            "pass_percentage", "attempts_allowed", "published_at",
        ]
        read_only_fields = fields


# ── QuizAttempt + Answer ────────────────────────────────────────────────────


class AnswerReadSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Answer
        fields = [
            "id", "school", "attempt", "question",
            "selected_option_ids", "text_response",
            "is_correct", "points_awarded", "time_spent_seconds",
            "answered_at",
        ]
        read_only_fields = fields


class AnswerSubmitSerializer(serializers.Serializer):
    """Wire shape for POST /attempts/<id>/answer/."""

    question = serializers.UUIDField()
    selected_option_ids = serializers.ListField(
        child=serializers.CharField(max_length=20),
        required=False,
        default=list,
    )
    text_response = serializers.CharField(
        required=False, allow_blank=True, default="", max_length=2000,
    )
    time_spent_seconds = serializers.IntegerField(required=False, min_value=0, default=0)


class QuizAttemptReadSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    quiz = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    student = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = QuizAttempt
        fields = [
            "id", "school", "quiz", "student",
            "status", "attempt_number",
            "started_at", "expires_at", "submitted_at",
            "score_percent", "points_earned", "points_total", "correct_count",
            "question_order", "last_difficulty",
            "created_at", "updated_at",
        ]
        read_only_fields = fields
