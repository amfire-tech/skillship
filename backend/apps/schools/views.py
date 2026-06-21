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
from rest_framework.permissions import SAFE_METHODS, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import Role

from .models import School, SchoolSettings
from .serializers import SchoolSerializer, SchoolSettingsSerializer


class CanAccessSchools(BasePermission):
    """MAIN_ADMIN: full CRUD. SUB_ADMIN: read their granted-school territory and
    edit only schools where they hold can_manage_school; never create/delete a
    school (customer-account creation stays with the platform owner). Everyone
    else: denied."""

    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        if u.role == Role.MAIN_ADMIN:
            return True
        if u.role == Role.SUB_ADMIN:
            # No school creation or deletion for a sub-admin.
            return getattr(view, "action", None) not in ("create", "destroy")
        return False

    def has_object_permission(self, request, view, obj):
        u = request.user
        if u.role == Role.MAIN_ADMIN:
            return True
        if u.role == Role.SUB_ADMIN:
            from apps.assignments.access import has_active_grant, subadmin_can

            if request.method in SAFE_METHODS:
                return has_active_grant(u, obj.id)
            return subadmin_can(u, obj.id, "can_manage_school")
        return False


class SchoolViewSet(ModelViewSet):
    """Platform-level CRUD for schools.

    MAIN_ADMIN gets full CRUD. A granted SUB_ADMIN gets a read view of their
    territory (every school they hold an active grant for) and may EDIT a school
    only where can_manage_school is set — but can never create or delete one.
    """

    queryset = School.objects.select_related("settings").order_by("-created_at")
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated, CanAccessSchools]
    lookup_field = "id"

    def get_queryset(self):
        qs = super().get_queryset()
        u = self.request.user
        if u.role == Role.SUB_ADMIN:
            from apps.assignments.access import active_school_ids

            return qs.filter(id__in=active_school_ids(u))
        return qs


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
        if request.user.role not in {Role.MAIN_ADMIN, Role.PRINCIPAL, Role.SUB_ADMIN}:
            raise PermissionDenied(
                "Only PRINCIPAL, SUB_ADMIN, or MAIN_ADMIN may modify school settings."
            )

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

        if user.role == Role.SUB_ADMIN:
            # The school the sub-admin is acting in (X-School-Context), and only
            # if can_manage_school is granted there.
            from apps.assignments.access import subadmin_can
            from apps.common.tenancy import resolve_school_id

            school_id = resolve_school_id(request)
            if not school_id or not subadmin_can(user, school_id, "can_manage_school"):
                raise PermissionDenied(
                    "You don't have school-management access to this school."
                )
            return self._get_or_create(school_id)

        if not user.school_id:
            raise PermissionDenied("This user is not attached to a school.")
        return self._get_or_create(user.school_id)

    def _get_or_create(self, school_id) -> SchoolSettings:
        school = get_object_or_404(School, pk=school_id)
        settings_obj, _ = SchoolSettings.objects.get_or_create(school=school)
        return settings_obj
