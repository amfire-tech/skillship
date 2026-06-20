"""
File:    backend/apps/billing/urls.py
Purpose: Routes for the billing ledger + revenue analytics.
Owner:   Navanish
"""

from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BillingEntryViewSet, RevenueAnalyticsView

app_name = "billing"

router = DefaultRouter()
router.register(r"entries", BillingEntryViewSet, basename="billing-entry")

urlpatterns = [
    path("revenue/", RevenueAnalyticsView.as_view(), name="billing-revenue"),
    path("", include(router.urls)),
]
