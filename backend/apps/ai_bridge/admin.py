"""
File:    backend/apps/ai_bridge/admin.py
Purpose: Django admin registration for AiJob — cost visibility and debug.
Owner:   Navanish
"""

from django.contrib import admin

from .models import AiJob


@admin.register(AiJob)
class AiJobAdmin(admin.ModelAdmin):
    list_display = (
        "id", "kind", "status", "school", "created_by",
        "duration_ms", "cost_inr", "created_at",
    )
    list_filter   = ("kind", "status")
    search_fields = ("school__name", "created_by__email")
    readonly_fields = (
        "id", "kind", "school", "created_by", "status",
        "request_json", "response_json", "error",
        "model_used", "tokens_in", "tokens_out", "cost_inr", "duration_ms",
        "created_at", "updated_at",
    )
    ordering = ("-created_at",)
