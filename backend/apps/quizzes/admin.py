"""
File:    backend/apps/quizzes/admin.py
Purpose: Django admin registrations for all quiz models.
Owner:   Vishal
"""

from django.contrib import admin

from .models import Answer, Question, QuestionBank, Quiz, QuizAttempt


@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display = ["name", "course", "school", "created_by", "created_at"]
    list_filter = ["school", "course"]
    search_fields = ["name"]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["text", "type", "difficulty", "points", "ai_generated", "bank", "created_at"]
    list_filter = ["type", "difficulty", "ai_generated", "school"]
    search_fields = ["text"]


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ["title", "status", "course", "is_adaptive", "duration_minutes", "created_at"]
    list_filter = ["status", "school", "is_adaptive"]
    search_fields = ["title"]
    readonly_fields = ["published_at", "archived_at"]


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ["student", "quiz", "attempt_number", "status", "score_percent", "started_at"]
    list_filter = ["status", "school"]
    readonly_fields = ["started_at", "expires_at", "submitted_at", "score_percent"]


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ["attempt", "question", "is_correct", "points_awarded", "answered_at"]
    list_filter = ["is_correct", "school"]
    readonly_fields = ["answered_at"]
