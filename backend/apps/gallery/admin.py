"""
File:    backend/apps/gallery/admin.py
Purpose: Django admin entry for GalleryImage so triage works without the API.
Owner:   Navanish
"""

from __future__ import annotations

from django.contrib import admin

from .models import GalleryImage


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ("caption", "is_active", "display_order", "uploaded_by", "created_at")
    list_filter = ("is_active",)
    search_fields = ("caption",)
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("display_order", "-created_at")
