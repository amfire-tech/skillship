"""
File:    backend/apps/academics/views.py
Purpose: ViewSets for AcademicYear, Class, Course, Enrollment + bulk CSV.
Owner:   Prashant

Permission shape (one rule for all four resources):
    Surface  : MAIN_ADMIN | PRINCIPAL only.
    Object   : MAIN_ADMIN any; PRINCIPAL same-school only.
    Anonymous: 401.

Tenant scoping is delegated to apps.common.viewsets.TenantScopedViewSet —
both the queryset filter and the school_id stamp on create. Cross-FK same-
school checks live in the serializers (one validator per FK field) so a
PRINCIPAL of school A cannot smuggle a school B FK into a payload.
"""

from __future__ import annotations

import csv
import io

from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import SAFE_METHODS, BasePermission, IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.common.permissions import Role
from apps.common.viewsets import TenantScopedViewSet

from .models import AcademicYear, Class, Course, Enrollment
from .serializers import (
    AcademicYearSerializer,
    BulkEnrollmentUploadSerializer,
    ClassReadSerializer,
    ClassSerializer,
    CourseSerializer,
    EnrollmentSerializer,
)


# ── Permission ──────────────────────────────────────────────────────────────


class CanManageAcademics(BasePermission):
    """MAIN_ADMIN and PRINCIPAL on the surface; same-school for objects."""

    SURFACE_ROLES = {Role.MAIN_ADMIN, Role.PRINCIPAL}

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.role in self.SURFACE_ROLES)

    def has_object_permission(self, request, view, obj):
        actor = request.user
        if actor.role == Role.MAIN_ADMIN:
            return True
        return actor.school_id is not None and obj.school_id == actor.school_id


class CanReadClassesOrManage(CanManageAcademics):
    """Same as CanManageAcademics, but TEACHERs may READ classes in their own
    school. Teachers need the class list to assign quizzes, build class
    analytics, and export class reports; writes stay MAIN_ADMIN / PRINCIPAL.
    """

    def has_permission(self, request, view):
        u = request.user
        if request.method in SAFE_METHODS and u and u.is_authenticated and u.role == Role.TEACHER:
            from apps.common.tenancy import resolve_school_id

            # Concrete acting school — a normal teacher's own school, or a
            # Skillship teacher's selected, actively-assigned school. (Don't use
            # request.school_id here: it's a lazy proxy, never None by identity.)
            if resolve_school_id(request) is not None:
                return True
        return super().has_permission(request, view)


class _AcademicsBaseViewSet(TenantScopedViewSet):
    """Common knobs for every academics viewset — auth + role gate + lookup."""

    permission_classes = [IsAuthenticated, CanManageAcademics]
    lookup_field = "id"


# ── Concrete viewsets ───────────────────────────────────────────────────────


class AcademicYearViewSet(_AcademicsBaseViewSet):
    queryset = AcademicYear.objects.all().order_by("-start_date")
    serializer_class = AcademicYearSerializer


class CourseViewSet(_AcademicsBaseViewSet):
    queryset = Course.objects.all().order_by("code")
    serializer_class = CourseSerializer


class ClassViewSet(_AcademicsBaseViewSet):
    queryset = (
        Class.objects.select_related("academic_year", "class_teacher")
        .annotate(
            student_count_ann=Count(
                "enrollments",
                filter=Q(enrollments__withdrawn_on__isnull=True),
                distinct=True,
            )
        )
        .order_by("grade", "section")
    )
    serializer_class = ClassSerializer
    # Teachers get read-only access (assign quizzes / analytics / reports).
    permission_classes = [IsAuthenticated, CanReadClassesOrManage]

    def get_serializer_class(self):
        # List/detail use the enriched read serializer (class_name, student_count,
        # academic_year_name); writes use the validating ClassSerializer.
        if self.action in ("list", "retrieve"):
            return ClassReadSerializer
        return ClassSerializer


class EnrollmentViewSet(_AcademicsBaseViewSet):
    queryset = Enrollment.objects.select_related("student", "klass", "course").order_by(
        "-enrolled_on"
    )
    serializer_class = EnrollmentSerializer

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-csv",
        parser_classes=[MultiPartParser, FormParser],
    )
    def bulk_csv(self, request):
        """Bulk-create Enrollment rows from a CSV upload.

        Body (multipart/form-data):
            file: CSV with header `student_email,grade,section[,course_code]`

        Behaviour:
            - Looks up the *current* AcademicYear for the requester's school
              (or the body's `school` if MAIN_ADMIN). 400 if none is_current.
            - Each row creates one Enrollment. Duplicates (the unique
              constraint kicks in) are reported as `skipped_duplicates`,
              not errors. Anything else is per-row `errors`.
            - All-or-nothing per row, but the response is a flat report —
              the caller learns exactly which rows succeeded.

        Why this lives on the viewset (not its own URL): every academics
        resource picks up `bulk-csv` here without needing a second mount.
        """
        serializer = BulkEnrollmentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload = serializer.validated_data["file"]

        target_school_id = self._resolve_target_school_id(request)
        current_year = AcademicYear.objects.filter(
            school_id=target_school_id, is_current=True
        ).first()
        if current_year is None:
            return Response(
                {"detail": "No is_current AcademicYear for this school."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            text = upload.read().decode("utf-8-sig")  # strip BOM if Excel-saved
        except UnicodeDecodeError:
            return Response({"detail": "file is not UTF-8."}, status=400)

        reader = csv.DictReader(io.StringIO(text))
        required_cols = {"student_email", "grade", "section"}
        missing = required_cols - set(reader.fieldnames or [])
        if missing:
            return Response(
                {"detail": f"missing CSV columns: {sorted(missing)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created, skipped, errors = [], [], []

        # Pre-fetch lookups for speed; school-scoped so we don't see other tenants.
        students_by_email = {
            u.email.lower(): u
            for u in User.objects.filter(school_id=target_school_id, role=User.Role.STUDENT)
        }
        classes_by_key = {
            (c.grade, c.section.upper()): c
            for c in Class.objects.filter(
                school_id=target_school_id, academic_year=current_year
            )
        }
        courses_by_code = {
            c.code.upper(): c
            for c in Course.objects.filter(school_id=target_school_id)
        }

        for row_num, row in enumerate(reader, start=2):  # row 1 is header
            email = (row.get("student_email") or "").strip().lower()
            try:
                grade = int(row.get("grade") or 0)
            except (TypeError, ValueError):
                errors.append({"row": row_num, "error": "grade must be an integer"})
                continue
            section = (row.get("section") or "").strip().upper()
            course_code = (row.get("course_code") or "").strip().upper() or None

            student = students_by_email.get(email)
            if student is None:
                errors.append({"row": row_num, "error": f"no STUDENT with email {email!r} in this school"})
                continue
            klass = classes_by_key.get((grade, section))
            if klass is None:
                errors.append(
                    {"row": row_num, "error": f"no class for grade={grade} section={section!r} in current year"}
                )
                continue
            course = None
            if course_code:
                course = courses_by_code.get(course_code)
                if course is None:
                    errors.append({"row": row_num, "error": f"unknown course_code {course_code!r}"})
                    continue

            try:
                with transaction.atomic():
                    enrollment = Enrollment.objects.create(
                        school_id=target_school_id,
                        student=student,
                        klass=klass,
                        course=course,
                    )
                created.append({"row": row_num, "id": str(enrollment.id)})
            except IntegrityError:
                skipped.append({"row": row_num, "reason": "already enrolled"})

        return Response(
            {
                "created_count": len(created),
                "skipped_count": len(skipped),
                "error_count": len(errors),
                "created": created,
                "skipped_duplicates": skipped,
                "errors": errors,
            },
            status=status.HTTP_200_OK if not errors else status.HTTP_207_MULTI_STATUS,
        )

    # ── Internals ───────────────────────────────────────────────────────────

    def _resolve_target_school_id(self, request):
        actor = request.user
        if actor.role == Role.MAIN_ADMIN:
            target = request.data.get("school")
            if not target:
                raise PermissionDenied(
                    "MAIN_ADMIN must include `school` in the form data when bulk-uploading."
                )
            # Verify the school exists (so a typo'd UUID doesn't silently no-op).
            from apps.schools.models import School

            get_object_or_404(School, pk=target)
            return target
        return actor.school_id
