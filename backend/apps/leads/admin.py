"""
File:    backend/apps/leads/admin.py
Purpose: Django admin entry for DemoRequest so triage works without the API.
Owner:   Navanish
"""

from __future__ import annotations

from django.contrib import admin

from .models import DemoRequest


@admin.register(DemoRequest)
class DemoRequestAdmin(admin.ModelAdmin):
    list_display = ("school_name", "principal_name", "city", "status", "created_at")
    list_filter = ("status", "student_range", "school_board")
    search_fields = ("school_name", "principal_name", "email_address", "city")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)
