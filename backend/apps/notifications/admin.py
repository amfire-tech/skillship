"""
File:    backend/apps/notifications/admin.py
Purpose: Django admin registrations for Notification + NotificationTemplate.
Owner:   Vishal
"""

from django.contrib import admin

from .models import Notification, NotificationTemplate


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ["code", "channel", "subject", "is_active", "school", "created_at"]
    list_filter = ["channel", "is_active", "school"]
    search_fields = ["code", "subject", "body_template"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["recipient", "channel", "title", "status", "sent_at", "read_at", "school"]
    list_filter = ["channel", "status", "school"]
    search_fields = ["title", "body"]
    readonly_fields = ["sent_at", "read_at", "created_at", "updated_at"]
