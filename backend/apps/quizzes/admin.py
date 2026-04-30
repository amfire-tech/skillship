"""
File:    backend/apps/quizzes/admin.py
Purpose: Django admin registrations for the assessment models.
Owner:   Navanish

Read-mostly: nothing here is the primary editing surface (teachers use the
API). Admin exists for support engineers to inspect a school's data when a
ticket comes in.
"""

from django.contrib import admin

from .models import Answer, Question, QuestionBank, Quiz, QuizAttempt


@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display  = ("name", "course", "school", "created_by", "created_at")
    list_filter   = ("school",)
    search_fields = ("name", "course__code", "course__name")
    raw_id_fields = ("course", "school", "created_by")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display  = ("id", "type", "difficulty", "bank", "school", "ai_generated", "created_at")
    list_filter   = ("type", "difficulty", "ai_generated", "school")
    search_fields = ("text", "bank__name")
    raw_id_fields = ("bank", "school", "created_by")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display  = ("title", "course", "status", "is_adaptive", "school", "published_at", "created_at")
    list_filter   = ("status", "is_adaptive", "school")
    search_fields = ("title", "course__code")
    raw_id_fields = ("course", "bank", "school", "created_by")
    readonly_fields = ("id", "published_at", "archived_at", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display  = (
        "id", "quiz", "student", "status", "score_percent",
        "correct_count", "started_at", "submitted_at",
    )
    list_filter   = ("status", "school")
    search_fields = ("student__email", "quiz__title")
    raw_id_fields = ("quiz", "student", "school")
    readonly_fields = (
        "id", "started_at", "submitted_at", "expires_at",
        "score_percent", "points_earned", "points_total",
        "correct_count", "question_order", "last_difficulty",
        "created_at", "updated_at",
    )
    ordering = ("-started_at",)


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display  = ("id", "attempt", "question", "is_correct", "points_awarded", "answered_at")
    list_filter   = ("is_correct", "school")
    search_fields = ("attempt__id", "question__id")
    raw_id_fields = ("attempt", "question", "school")
    readonly_fields = (
        "id", "is_correct", "points_awarded",
        "answered_at", "created_at", "updated_at",
    )
    ordering = ("-answered_at",)
