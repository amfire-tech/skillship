from django.contrib import admin

from .models import BillingEntry


@admin.register(BillingEntry)
class BillingEntryAdmin(admin.ModelAdmin):
    list_display = ("school", "kind", "amount", "occurred_on", "method", "created_by")
    list_filter = ("kind", "method", "occurred_on")
    search_fields = ("school__name", "note")
    raw_id_fields = ("school", "created_by")
    date_hierarchy = "occurred_on"
