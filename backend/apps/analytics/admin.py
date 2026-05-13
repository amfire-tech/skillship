"""
File:    backend/apps/analytics/admin.py
Purpose: Django admin registrations for analytics models.
Owner:   Vishal
"""

from django.contrib import admin

from .models import ClassWeeklyStats, RiskSignal, StudentDailyStats


@admin.register(StudentDailyStats)
class StudentDailyStatsAdmin(admin.ModelAdmin):
    list_display = ["student", "date", "quizzes_taken", "avg_score", "time_spent_seconds", "school"]
    list_filter = ["school", "date"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(ClassWeeklyStats)
class ClassWeeklyStatsAdmin(admin.ModelAdmin):
    list_display = ["klass", "week_start_date", "avg_score", "at_risk_count", "school"]
    list_filter = ["school", "week_start_date"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(RiskSignal)
class RiskSignalAdmin(admin.ModelAdmin):
    list_display = ["student", "level", "kind", "acknowledged_by", "acknowledged_at", "school", "created_at"]
    list_filter = ["level", "kind", "school"]
    readonly_fields = ["acknowledged_at", "created_at", "updated_at"]
    search_fields = ["reason"]
