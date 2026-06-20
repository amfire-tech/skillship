"""
File:    backend/apps/billing/serializers.py
Purpose: DRF serializers for the billing ledger.
Owner:   Navanish
"""

from __future__ import annotations

from rest_framework import serializers

from .models import BillingEntry


class BillingEntrySerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    school = serializers.UUIDField(source="school_id", read_only=True)
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)
    method_display = serializers.CharField(source="get_method_display", read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = BillingEntry
        fields = [
            "id",
            "school",
            "kind",
            "kind_display",
            "amount",
            "occurred_on",
            "method",
            "method_display",
            "note",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]

    def get_created_by_name(self, obj) -> str:
        user = obj.created_by
        if not user:
            return ""
        return user.get_full_name() or getattr(user, "email", "") or ""

    def validate(self, attrs):
        # A `method` only makes sense on a payment; silently drop it on charges
        # so a CHARGE never carries a stray "UPI" label.
        kind = attrs.get("kind", getattr(self.instance, "kind", None))
        if kind == BillingEntry.Kind.CHARGE:
            attrs["method"] = ""
        return attrs


class SchoolSummarySerializer(serializers.Serializer):
    school = serializers.CharField()
    total_charged = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=14, decimal_places=2)
    remaining = serializers.DecimalField(max_digits=14, decimal_places=2)
