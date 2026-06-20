"""
File:    backend/apps/billing/views.py
Purpose: Billing ledger API.

  /api/v1/billing/entries/                 list/create  charges & payments
  /api/v1/billing/entries/<id>/            retrieve/update/delete one entry
  /api/v1/billing/entries/summary/         charged / paid / remaining for a school
  /api/v1/billing/revenue/                 platform-wide revenue analytics

Permission shape (mirrors apps.schools.SchoolSettingsView):
  - MAIN_ADMIN : full read/write; must scope to one school with ?school=<id>
  - PRINCIPAL  : read-only, always their own school (request.user.school_id)
  - everyone else : 403

`School` is the tenant root, not a tenant-scoped resource, so — exactly like
SchoolViewSet — we use a plain ModelViewSet and gate with an explicit school
filter rather than the TenantMiddleware scoping.
Owner:   Navanish
"""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsMainAdmin, Role
from apps.schools.models import School

from .models import BillingEntry
from .serializers import BillingEntrySerializer, SchoolSummarySerializer
from .services import revenue_overview, school_summary


class BillingEntryViewSet(ModelViewSet):
    """CRUD over a single school's billing ledger.

    Reads are open to the owning PRINCIPAL and to MAIN_ADMIN; writes are
    MAIN_ADMIN-only. The target school is derived once in `_target_school_id`
    so list, detail, create and the summary action can never drift apart.
    """

    serializer_class = BillingEntrySerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        school_id = self._target_school_id()
        return (
            BillingEntry.objects.filter(school_id=school_id)
            .select_related("created_by")
            .order_by("-occurred_on", "-created_at")
        )

    def _target_school_id(self) -> str:
        user = self.request.user
        if user.role == Role.MAIN_ADMIN:
            target = self.request.query_params.get("school")
            if not target:
                raise PermissionDenied(
                    "MAIN_ADMIN must pass ?school=<id> for billing operations."
                )
            return target
        if user.role == Role.PRINCIPAL:
            if not user.school_id:
                raise PermissionDenied("This user is not attached to a school.")
            return str(user.school_id)
        raise PermissionDenied("You do not have access to billing.")

    def _require_owner(self):
        if self.request.user.role != Role.MAIN_ADMIN:
            raise PermissionDenied("Only the platform owner can modify billing.")

    def perform_create(self, serializer):
        self._require_owner()
        school = get_object_or_404(School, pk=self._target_school_id())
        serializer.save(school=school, created_by=self.request.user)

    def perform_update(self, serializer):
        self._require_owner()
        serializer.save()

    def perform_destroy(self, instance):
        self._require_owner()
        instance.delete()

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Charged / paid / remaining for the resolved school."""
        data = school_summary(self._target_school_id())
        return Response(SchoolSummarySerializer(data).data)


class RevenueAnalyticsView(APIView):
    """Platform-wide revenue overview — MAIN_ADMIN only."""

    permission_classes = [IsAuthenticated, IsMainAdmin]

    def get(self, request):
        return Response(revenue_overview())
