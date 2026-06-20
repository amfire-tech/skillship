"""
File:    backend/apps/billing/models.py
Purpose: BillingEntry — one dated line item in a school's billing ledger. A
         CHARGE is money Skillship billed the school; a PAYMENT is money the
         school paid back. A school's outstanding due is simply
         sum(CHARGE) - sum(PAYMENT). The platform owner (MAIN_ADMIN) writes
         these; the school's PRINCIPAL reads its own ledger.
Owner:   Navanish

Why TenantModel: every entry belongs to exactly one school (UUID pk + school
FK + composite (school, created_at) index come for free). We never return an
entry across the school boundary — the viewset filters by the caller's school.
"""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import TenantModel


class BillingEntry(TenantModel):
    """A single charge or payment on a school's account."""

    class Kind(models.TextChoices):
        CHARGE = "CHARGE", "Charge (billed to school)"
        PAYMENT = "PAYMENT", "Payment (received from school)"

    class Method(models.TextChoices):
        UPI = "UPI", "UPI"
        BANK = "BANK", "Bank Transfer"
        CASH = "CASH", "Cash"
        CHEQUE = "CHEQUE", "Cheque"
        CARD = "CARD", "Card"
        OTHER = "OTHER", "Other"

    kind = models.CharField(max_length=10, choices=Kind.choices)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    # The date the charge was raised / the payment landed — this (not created_at)
    # is what the revenue-over-time chart buckets by, so back-dated entries land
    # in the right month.
    occurred_on = models.DateField()
    # Only meaningful for PAYMENT rows; left blank for charges.
    method = models.CharField(max_length=10, choices=Method.choices, blank=True)
    note = models.CharField(max_length=255, blank=True)
    # Audit trail: which platform admin recorded this line.
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="billing_entries_created",
    )

    class Meta(TenantModel.Meta):
        verbose_name_plural = "Billing entries"
        ordering = ["-occurred_on", "-created_at"]
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=["school", "kind"]),
            models.Index(fields=["occurred_on"]),
        ]

    def __str__(self):
        return f"{self.get_kind_display()} ₹{self.amount} — {self.school_id}"
