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

from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.accounts.models import User
from apps.common.permissions import IsMainAdmin, Role
from apps.common.tenancy import require_school_id
from apps.common.viewsets import TenantScopedViewSet

from .models import DailyTeachingLog, SkillshipAssignment, SubAdminGrant
from .serializers import (
    DailyTeachingLogListSerializer,
    DailyTeachingLogSerializer,
    SkillshipAssignmentSerializer,
    SubAdminGrantSerializer,
    TodaysTeacherSerializer,
)


def _is_scheduled_today(assignment: SkillshipAssignment, today, iso_today: str) -> bool:
    """Mirrors the frontend's TeachingScheduleCard `isToday` logic — within the
    optional date_from/date_to range AND (today's weekday is a recurring visit
    day OR today is one of the ad-hoc specific_dates)."""
    if assignment.date_from and iso_today < assignment.date_from.isoformat():
        return False
    if assignment.date_to and iso_today > assignment.date_to.isoformat():
        return False
    if today.weekday() in (assignment.weekdays or []):
        return True
    return iso_today in (assignment.specific_dates or [])


class SkillshipAssignmentViewSet(ModelViewSet):
    serializer_class = SkillshipAssignmentSerializer
    permission_classes = [IsAuthenticated, IsMainAdmin]
    lookup_field = "id"

    def get_permissions(self):
        # `mine` is the one action a Skillship teacher calls on themselves
        # (to populate their school switcher); `today` is the one action a
        # PRINCIPAL calls about THEIR school — everything else is admin-only.
        if self.action in ("mine", "today"):
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

    @action(detail=False, methods=["get"], url_path="today")
    def today(self, request):
        """The Skillship teacher(s) scheduled at the requesting PRINCIPAL's
        school today — name, id, photo, class, subject. Computed in Python
        (not the DB) since the schedule match needs weekday/date-range logic
        identical to the teacher's own "My Teaching Schedule" card."""
        if request.user.role != Role.PRINCIPAL:
            raise PermissionDenied("Only a principal can view today's Skillship teachers.")
        if request.user.school_id is None:
            return Response([])
        today = timezone.localdate()
        iso_today = today.isoformat()
        qs = (
            SkillshipAssignment.objects.select_related("teacher", "klass")
            .filter(school_id=request.user.school_id, is_active=True)
        )
        rows = [a for a in qs if _is_scheduled_today(a, today, iso_today)]
        return Response(TodaysTeacherSerializer(rows, many=True).data)

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


class DailyTeachingLogViewSet(TenantScopedViewSet):
    """Daily teaching logs for Skillship (roaming) teachers.

    - A SKILLSHIP teacher creates + reads their OWN logs, scoped to the school
      they're currently acting in (X-School-Context). Tenant scoping comes from
      TenantScopedViewSet; we further filter to teacher_id=self so one teacher
      never sees another's logs even within the same school.
    - MAIN_ADMIN reads EVERY teacher's logs across all schools (the super-admin
      "what did my teachers do today" view), with ?teacher / ?school / ?date /
      ?date_from / ?date_to filters. Creating is teacher-only.
    - A normal SCHOOL teacher has no daily-log surface: creation is refused and
      the list is empty (they have no SKILLSHIP logs).
    """

    serializer_class = DailyTeachingLogSerializer
    queryset = DailyTeachingLog.objects.select_related("teacher", "school")
    lookup_field = "id"

    def get_serializer_class(self):
        # Lists drop the heavy base64 photo; detail/create/update keep it.
        if self.action == "list":
            return DailyTeachingLogListSerializer
        return DailyTeachingLogSerializer

    def get_queryset(self):
        qs = super().get_queryset()  # tenant-scoped (MAIN_ADMIN bypasses)
        if self.action == "list":
            # Never load the (potentially MBs) photo column for list responses.
            qs = qs.defer("photo")
        user = self.request.user
        if user.role == User.Role.TEACHER:
            # A teacher only ever sees their own logs.
            qs = qs.filter(teacher_id=user.id)
        else:
            # MAIN_ADMIN — allow narrowing to one teacher / school / date(s).
            params = self.request.query_params
            teacher = params.get("teacher")
            school = params.get("school")
            on = params.get("date")
            date_from = params.get("date_from")
            date_to = params.get("date_to")
            if teacher:
                qs = qs.filter(teacher_id=teacher)
            if school:
                qs = qs.filter(school_id=school)
            if on:
                qs = qs.filter(date=on)
            if date_from:
                qs = qs.filter(date__gte=date_from)
            if date_to:
                qs = qs.filter(date__lte=date_to)
        return qs.order_by("-date", "-created_at")

    def perform_create(self, serializer):
        user = self.request.user
        # Only a Skillship teacher submits daily logs.
        if not (user.role == User.Role.TEACHER and getattr(user, "is_skillship_teacher", False)):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Only Skillship teachers can submit daily logs.")
        # Stamp school from the acting context (raises 403 if none) + teacher
        # from the request — never from request data.
        school_id = require_school_id(self.request)
        serializer.save(teacher=user, school_id=school_id)

    def perform_update(self, serializer):
        # Edits keep the original teacher/school; only the day's details change.
        serializer.save()


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
