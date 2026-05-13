"""
File:    backend/apps/content/admin.py
Purpose: Django admin registrations for ContentItem and MarketplaceListing.
Owner:   Vishal
"""

from django.contrib import admin

from .models import ContentItem, MarketplaceListing


@admin.register(ContentItem)
class ContentItemAdmin(admin.ModelAdmin):
    list_display = ["title", "kind", "course", "klass", "school", "uploaded_by", "created_at"]
    list_filter = ["kind", "school"]
    search_fields = ["title", "description"]
    readonly_fields = ["ai_tags", "created_at", "updated_at"]


@admin.register(MarketplaceListing)
class MarketplaceListingAdmin(admin.ModelAdmin):
    list_display = ["title", "kind", "price_inr", "author_school", "is_active", "featured", "created_at"]
    list_filter = ["kind", "is_active", "featured"]
    search_fields = ["title", "description"]
