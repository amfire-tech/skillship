"""
File:    backend/apps/schools/views.py
Purpose: SchoolViewSet (MAIN_ADMIN-only platform CRUD) + SchoolSettingsView
         (each principal reads / edits their own school's settings row).
Owner:   Prashant

Permission shape:

  /api/v1/schools/                  → MAIN_ADMIN only (full CRUD)
  /api/v1/schools/settings/         → GET  : MAIN_ADMIN (?school=<id>) | PRINCIPAL (own)
                                       PATCH: MAIN_ADMIN (?school=<id>) | PRINCIPAL (own)

Why /schools/ uses a regular ModelViewSet (not TenantScopedViewSet):
    `School` is the tenant — it isn't *scoped by* a tenant. The IsMainAdmin
    permission is the gate; there is no `request.school_id` filter to apply.
"""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsMainAdmin, Role

from .models import School, SchoolSettings
from .serializers import SchoolSerializer, SchoolSettingsSerializer


class SchoolViewSet(ModelViewSet):
    """Platform-level CRUD for schools — MAIN_ADMIN only.

    SUB_ADMIN is intentionally NOT included: customer-account operations stay
    with the platform owner until we explicitly delegate them.
    """

    queryset = School.objects.all().order_by("-created_at")
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated, IsMainAdmin]
    lookup_field = "id"


class SchoolSettingsView(APIView):
    """Singleton settings row for one school.

    There is exactly one SchoolSettings per school, so we expose it on a fixed
    URL — no `<id>` in the path. The row is *derived* from the caller:
      - PRINCIPAL  → their own school (request.user.school_id)
      - MAIN_ADMIN → must pass ?school=<id>
      - everyone else → 403

    First read auto-creates the row so a freshly provisioned school never 404s.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings_obj = self._resolve(request)
        return Response(SchoolSettingsSerializer(settings_obj).data)

    def patch(self, request):
        if request.user.role not in {Role.MAIN_ADMIN, Role.PRINCIPAL}:
            raise PermissionDenied("Only PRINCIPAL or MAIN_ADMIN may modify school settings.")

        settings_obj = self._resolve(request)
        serializer = SchoolSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ── Internals ───────────────────────────────────────────────────────────

    def _resolve(self, request) -> SchoolSettings:
        user = request.user
        if user.role == Role.MAIN_ADMIN:
            target = request.query_params.get("school")
            if not target:
                raise PermissionDenied(
                    "MAIN_ADMIN must pass ?school=<id> when reading school settings."
                )
            return self._get_or_create(target)

        if not user.school_id:
            raise PermissionDenied("This user is not attached to a school.")
        return self._get_or_create(user.school_id)

    def _get_or_create(self, school_id) -> SchoolSettings:
        school = get_object_or_404(School, pk=school_id)
        settings_obj, _ = SchoolSettings.objects.get_or_create(school=school)
        return settings_obj
