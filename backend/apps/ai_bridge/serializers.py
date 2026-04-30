"""
File:    backend/apps/ai_bridge/serializers.py
Purpose: Request validation for the four Plan 01 AI endpoints.
Owner:   Navanish

Each serializer covers only the fields the client sends.
Fields that Django stamps server-side (school_id, student_context, etc.)
are assembled inside the view — never accepted from request data.
"""

from rest_framework import serializers

_DIFFICULTY_CHOICES = ["easy", "medium", "hard"]
_QUESTION_TYPE_CHOICES = ["mcq", "tf", "short"]


def _default_types() -> list[str]:
    return ["mcq"]


class CareerAskSerializer(serializers.Serializer):
    """Student asks the Career Pilot a question."""

    question = serializers.CharField(max_length=1000)
    # Conversation turns from a previous session; empty on first ask.
    history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        max_length=20,
    )


class GenerateQuestionsSerializer(serializers.Serializer):
    """Teacher requests AI-generated questions for a given topic."""

    topic      = serializers.CharField(max_length=500)
    grade      = serializers.CharField(max_length=10)
    count      = serializers.IntegerField(min_value=1, max_value=20, default=5)
    difficulty = serializers.ChoiceField(choices=_DIFFICULTY_CHOICES, default="medium")
    types      = serializers.ListField(
        child=serializers.ChoiceField(choices=_QUESTION_TYPE_CHOICES),
        required=False,
        default=_default_types,
        min_length=1,
        max_length=3,
    )
    course_context = serializers.CharField(
        max_length=2000, required=False, allow_blank=True, default="",
    )


class AdaptiveNextSerializer(serializers.Serializer):
    """Student requests the next question calibrated to their performance so far."""

    topic           = serializers.CharField(max_length=500)
    grade           = serializers.CharField(max_length=10)
    last_difficulty = serializers.ChoiceField(choices=_DIFFICULTY_CHOICES, default="medium")
    last_correct    = serializers.BooleanField(default=True)
    attempt_history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        max_length=100,
    )
    types = serializers.ListField(
        child=serializers.ChoiceField(choices=_QUESTION_TYPE_CHOICES),
        required=False,
        default=_default_types,
        min_length=1,
        max_length=3,
    )
    course_context = serializers.CharField(
        max_length=2000, required=False, allow_blank=True, default="",
    )


class ContentSearchSerializer(serializers.Serializer):
    """Any school-scoped user searches uploaded content by natural language."""

    query     = serializers.CharField(max_length=500)
    # Narrow search to a specific course; null searches the whole school.
    course_id = serializers.UUIDField(required=False, allow_null=True, default=None)
    k         = serializers.IntegerField(min_value=1, max_value=20, default=5)
