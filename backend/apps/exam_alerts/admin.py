"""
File:    backend/apps/exam_alerts/admin.py
Purpose: Django admin registration for ExamAlert.
Owner:   Navanish
"""

from django.contrib import admin

from .models import ExamAlert


@admin.register(ExamAlert)
class ExamAlertAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "mode", "exam_date", "klass", "school", "created_by")
    list_filter = ("category", "mode", "exam_date")
    search_fields = ("title", "description", "venue")
