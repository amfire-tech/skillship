"""
File:    backend/apps/assignments/views.py
Purpose: SkillshipAssignmentViewSet — MAIN_ADMIN CRUD over Skillship-teacher →
         school assignments, plus a revoke/reactivate action. This is the access
         grant: creating an active row lets the teacher work in that school;
         revoking pulls it. Plain ModelViewSet (not tenant-scoped) because the
         actor is MAIN_ADMIN (school=NULL), like the billing endpoints.
Owner:   Navanish
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.accounts.models import User
from apps.common.permissions import IsMainAdmin

from .models import SkillshipAssignment, SubAdminGrant
from .serializers import SkillshipAssignmentSerializer, SubAdminGrantSerializer


class SkillshipAssignmentViewSet(ModelViewSet):
    serializer_class = SkillshipAssignmentSerializer
    permission_classes = [IsAuthenticated, IsMainAdmin]
    lookup_field = "id"

    def get_permissions(self):
        # `mine` is the one action a Skillship teacher calls on themselves
        # (to populate their school switcher) — everything else is admin-only.
        if self.action == "mine":
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        """The requesting Skillship teacher's own ACTIVE assignments."""
        qs = (
            SkillshipAssignment.objects.select_related("school", "klass")
            .filter(teacher_id=request.user.id, is_active=True)
            .order_by("school__name")
        )
        return Response(self.get_serializer(qs, many=True).data)

    def get_queryset(self):
        qs = (
            SkillshipAssignment.objects.select_related("teacher", "school", "klass")
            .order_by("-created_at")
        )
        teacher = self.request.query_params.get("teacher")
        school = self.request.query_params.get("school")
        active = self.request.query_params.get("active")
        if teacher:
            qs = qs.filter(teacher_id=teacher)
        if school:
            qs = qs.filter(school_id=school)
        if active in ("true", "1"):
            qs = qs.filter(is_active=True)
        elif active in ("false", "0"):
            qs = qs.filter(is_active=False)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="revoke")
    def revoke(self, request, id=None):
        obj = self.get_object()
        obj.is_active = False
        obj.save(update_fields=["is_active", "updated_at"])
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=["post"], url_path="reactivate")
    def reactivate(self, request, id=None):
        obj = self.get_object()
        obj.is_active = True
        obj.save(update_fields=["is_active", "updated_at"])
        return Response(self.get_serializer(obj).data)


class SubAdminGrantViewSet(ModelViewSet):
    """MAIN_ADMIN CRUD over per-school sub-admin capability grants, plus a
    `my-access` action the sub-admin calls on themselves to drive their school
    switcher + capability-gated nav. POST upserts on (subadmin, school) so the
    super-admin UI can simply re-POST a school's checkbox state."""

    serializer_class = SubAdminGrantSerializer
    permission_classes = [IsAuthenticated, IsMainAdmin]
    lookup_field = "id"

    def get_permissions(self):
        if self.action == "my_access":
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_queryset(self):
        qs = SubAdminGrant.objects.select_related("subadmin", "school").order_by("school__name")
        subadmin = self.request.query_params.get("subadmin")
        if subadmin:
            qs = qs.filter(subadmin_id=subadmin)
        school = self.request.query_params.get("school")
        if school:
            qs = qs.filter(school_id=school)
        active = self.request.query_params.get("active")
        if active in ("true", "1"):
            qs = qs.filter(is_active=True)
        elif active in ("false", "0"):
            qs = qs.filter(is_active=False)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        obj, created = SubAdminGrant.objects.update_or_create(
            subadmin=data["subadmin"],
            school=data["school"],
            defaults={
                "can_manage_school": data.get("can_manage_school", False),
                "can_onboard_students": data.get("can_onboard_students", False),
                "can_onboard_teachers": data.get("can_onboard_teachers", False),
                "can_approve_quizzes": data.get("can_approve_quizzes", False),
                "is_active": data.get("is_active", True),
                "created_by": request.user,
            },
        )
        out = self.get_serializer(obj)
        return Response(
            out.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="my-access")
    def my_access(self, request):
        """The requesting sub-admin's own ACTIVE grants (one row per school)."""
        if request.user.role != User.Role.SUB_ADMIN:
            return Response([])
        qs = (
            SubAdminGrant.objects.select_related("school")
            .filter(subadmin_id=request.user.id, is_active=True)
            .order_by("school__name")
        )
        return Response(self.get_serializer(qs, many=True).data)
