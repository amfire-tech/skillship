"""
File:    backend/apps/analytics/views.py
Purpose: Read-only dashboard endpoints + RiskSignal management.
Owner:   Vishal
"""

from __future__ import annotations

from datetime import date, timedelta

from django.db.models import Avg, Sum
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academics.models import Class
from apps.accounts.models import User
from apps.common.permissions import (
    IsPrincipal, IsSchoolStaff, IsStudent, IsTeacher, Role,
)
from apps.common.viewsets import TenantScopedViewSet
from apps.schools.models import School

from . import benchmarking as bench
from . import exports as report_exports
from . import skills as skill_breakdowns
from .models import ClassWeeklyStats, RiskSignal, StudentDailyStats
from .serializers import (
    ClassWeeklyStatsSerializer,
    PrincipalDashboardSerializer,
    RiskSignalSerializer,
    StudentDailyStatsSerializer,
    StudentDashboardSerializer,
    TeacherDashboardSerializer,
)


class StudentDashboardView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        student = request.user
        thirty_days_ago = date.today() - timedelta(days=30)

        recent_stats = StudentDailyStats.objects.filter(
            school_id=request.user.school_id,
            student=student,
            date__gte=thirty_days_ago,
        ).order_by("-date")[:30]

        agg = recent_stats.aggregate(avg=Avg("avg_score"), total_time=Sum("time_spent_seconds"))
        total_quizzes = sum(s.quizzes_taken for s in recent_stats)
        total_time_hours = (agg["total_time"] or 0) / 3600

        risk_signals = RiskSignal.objects.filter(
            school_id=request.user.school_id,
            student=student,
            acknowledged_by__isnull=True,
        )

        payload = {
            "recent_stats": recent_stats,
            "total_quizzes_taken": total_quizzes,
            "avg_score_last_30d": agg["avg"],
            "total_time_spent_hours": round(total_time_hours, 2),
            "active_risk_signals": risk_signals,
        }
        return Response(StudentDashboardSerializer(payload).data)


class TeacherDashboardView(APIView):
    permission_classes = [IsTeacher]

    def get(self, request):
        four_weeks_ago = date.today() - timedelta(weeks=4)

        class_stats = ClassWeeklyStats.objects.filter(
            school_id=request.user.school_id,
            week_start_date__gte=four_weeks_ago,
        ).select_related("klass").order_by("-week_start_date")[:20]

        risk_signals = RiskSignal.objects.filter(
            school_id=request.user.school_id,
            acknowledged_by__isnull=True,
        ).order_by("-created_at")[:10]

        agg = class_stats.aggregate(avg=Avg("avg_score"))
        at_risk = sum(s.at_risk_count for s in class_stats)

        payload = {
            "class_weekly_stats": class_stats,
            "at_risk_students_count": at_risk,
            "class_avg_score": agg["avg"],
            "recent_risk_signals": risk_signals,
        }
        return Response(TeacherDashboardSerializer(payload).data)


class PrincipalDashboardView(APIView):
    permission_classes = [IsPrincipal]

    def get(self, request):
        four_weeks_ago = date.today() - timedelta(weeks=4)

        class_stats = ClassWeeklyStats.objects.filter(
            school_id=request.user.school_id,
            week_start_date__gte=four_weeks_ago,
        ).select_related("klass").order_by("-week_start_date")

        risk_signals = RiskSignal.objects.filter(
            school_id=request.user.school_id,
            acknowledged_by__isnull=True,
        ).order_by("-created_at")[:20]

        agg = class_stats.aggregate(avg=Avg("avg_score"))
        total_at_risk = sum(s.at_risk_count for s in class_stats)

        payload = {
            "school_avg_score": agg["avg"],
            "total_at_risk": total_at_risk,
            "class_stats": class_stats,
            "top_risk_signals": risk_signals,
        }
        return Response(PrincipalDashboardSerializer(payload).data)


# ── Benchmarking (Phase 2.3) ─────────────────────────────────────────────────


class BenchmarkingView(APIView):
    """
    GET /api/v1/analytics/benchmarking/?level=class|school&from=&to=

    - level=class  → cross-class ranking within the caller's school.
                     Students blocked; staff/principal allowed.
    - level=school → cross-school ranking (MAIN_ADMIN only).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        level = (request.query_params.get("level") or "class").lower()
        if level not in {"class", "school"}:
            raise ValidationError({"detail": "level must be 'class' or 'school'."})

        window = _resolve_window(request)

        if level == "class":
            if user.role == Role.STUDENT:
                raise PermissionDenied("Students cannot view class benchmarks.")
            if user.role == Role.MAIN_ADMIN:
                # Main admin must pick a school explicitly when looking at class scope.
                school_id = request.query_params.get("school_id")
                if not school_id:
                    raise ValidationError({"detail": "MAIN_ADMIN must pass ?school_id= for level=class."})
            else:
                school_id = user.school_id
            data = bench.compute_class_benchmarking(school_id=school_id, date_range=window)
            return Response({**data, "from": window.start, "to": window.end})

        # level == school
        if user.role != Role.MAIN_ADMIN:
            raise PermissionDenied("Cross-school benchmarking is MAIN_ADMIN-only.")
        data = bench.compute_school_benchmarking(date_range=window)
        return Response({**data, "from": window.start, "to": window.end})


# ── Skill-wise analytics (Phase 2.2) ─────────────────────────────────────────


class StudentSkillBreakdownView(APIView):
    """
    GET /api/v1/analytics/dashboards/student/skills/?from=&to=&student_id=

    Per-tag accuracy / volume / pacing for one student over the date window.
    STUDENT can query their own; school staff can pass `?student_id=` to view
    any student in their school. MAIN_ADMIN can view any school's student.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        target_id = request.query_params.get("student_id") or user.id

        # Resolve and gate the target student.
        target = get_object_or_404(User, id=target_id, role=User.Role.STUDENT)
        if user.role == Role.STUDENT and user.id != target.id:
            raise Http404()
        if user.role != Role.MAIN_ADMIN and target.school_id != user.school_id:
            raise Http404()

        window = _resolve_window(request)
        rows = skill_breakdowns.compute_student_skill_breakdown(
            school_id=target.school_id, student=target, date_range=window,
        )
        return Response({
            "student_id": str(target.id),
            "from":       window.start,
            "to":         window.end,
            "skills":     rows,
        })


class ClassSkillBreakdownView(APIView):
    """
    GET /api/v1/analytics/dashboards/class/{id}/skills/?from=&to=

    Per-tag aggregation across all currently-enrolled students in the class.
    Students cannot call this; teachers/principals/sub-admins in the same
    school can.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, class_id):
        user = request.user
        if user.role == Role.STUDENT:
            raise PermissionDenied("Students cannot view class skill breakdowns.")
        klass = get_object_or_404(Class, id=class_id)
        if user.role != Role.MAIN_ADMIN and klass.school_id != user.school_id:
            raise Http404()

        window = _resolve_window(request)
        rows = skill_breakdowns.compute_class_skill_breakdown(
            school_id=klass.school_id, klass=klass, date_range=window,
        )
        return Response({
            "class_id": str(klass.id),
            "from":     window.start,
            "to":       window.end,
            "skills":   rows,
        })


# ── Report exports (PDF + XLSX) ──────────────────────────────────────────────


_FORMAT_BY_QS = {"pdf": "pdf", "xlsx": "xlsx"}
_CONTENT_TYPE = {
    "pdf":  "application/pdf",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


def _resolve_window(request) -> report_exports.DateRange:
    """Parse ?from=YYYY-MM-DD&to=YYYY-MM-DD, defaulting to last 30 days."""
    today = date.today()
    try:
        end = date.fromisoformat(request.query_params["to"]) if "to" in request.query_params else today
        start = date.fromisoformat(request.query_params["from"]) if "from" in request.query_params else end - timedelta(days=29)
    except ValueError as exc:
        raise ValidationError({"detail": "from/to must be ISO dates (YYYY-MM-DD)."}) from exc
    if start > end:
        raise ValidationError({"detail": "from must be <= to."})
    if (end - start).days > 366:
        raise ValidationError({"detail": "Range cannot exceed 366 days."})
    return report_exports.DateRange(start=start, end=end)


def _resolve_format(request) -> str:
    # We deliberately read `?fmt=` rather than `?format=` because DRF's content
    # negotiation intercepts `format` and raises 404 when no renderer matches
    # (we don't register PDF/XLSX renderers — we return HttpResponse directly).
    fmt = (request.query_params.get("fmt") or "pdf").lower()
    if fmt not in _FORMAT_BY_QS:
        raise ValidationError({"detail": "fmt must be 'pdf' or 'xlsx'."})
    return fmt


def _stream(report: dict, fmt: str, filename_stem: str) -> HttpResponse:
    body = report_exports.render_pdf(report) if fmt == "pdf" else report_exports.render_xlsx(report)
    resp = HttpResponse(body, content_type=_CONTENT_TYPE[fmt])
    resp["Content-Disposition"] = f'attachment; filename="{filename_stem}.{fmt}"'
    return resp


class StudentReportExportView(APIView):
    """GET /analytics/reports/student/{id}/export/?format=pdf|xlsx&from=&to="""
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        user = request.user
        # Tenant + role gate: students can only export their own; staff in the same school.
        target = get_object_or_404(User, id=student_id, role=User.Role.STUDENT)
        if user.role == Role.STUDENT and user.id != target.id:
            raise Http404()
        if user.role != Role.MAIN_ADMIN and target.school_id != user.school_id:
            raise Http404()

        fmt = _resolve_format(request)
        window = _resolve_window(request)
        report = report_exports.assemble_student_report(
            school_id=target.school_id, student=target, date_range=window,
        )
        return _stream(report, fmt, f"student-{target.username}-{window.start}-{window.end}")


class ClassReportExportView(APIView):
    """GET /analytics/reports/class/{id}/export/?format=pdf|xlsx&from=&to="""
    permission_classes = [IsAuthenticated]

    def get(self, request, class_id):
        user = request.user
        if user.role == Role.STUDENT:
            raise PermissionDenied("Students cannot export class reports.")
        klass = get_object_or_404(
            Class.objects.select_related("academic_year"),
            id=class_id,
        )
        if user.role != Role.MAIN_ADMIN and klass.school_id != user.school_id:
            raise Http404()

        fmt = _resolve_format(request)
        window = _resolve_window(request)
        report = report_exports.assemble_class_report(
            school_id=klass.school_id, klass=klass, date_range=window,
        )
        stem = f"class-grade{klass.grade}-{klass.section}-{window.start}-{window.end}"
        return _stream(report, fmt, stem)


class SchoolReportExportView(APIView):
    """GET /analytics/reports/school/{id}/export/?format=pdf|xlsx&from=&to="""
    permission_classes = [IsAuthenticated]

    def get(self, request, school_id):
        user = request.user
        if user.role not in {Role.MAIN_ADMIN, Role.PRINCIPAL, Role.SUB_ADMIN}:
            raise PermissionDenied("School reports require principal+ scope.")
        school = get_object_or_404(School, id=school_id)
        if user.role != Role.MAIN_ADMIN and school.id != user.school_id:
            raise Http404()

        fmt = _resolve_format(request)
        window = _resolve_window(request)
        report = report_exports.assemble_school_report(school=school, date_range=window)
        return _stream(report, fmt, f"school-{school.slug}-{window.start}-{window.end}")


# ── Risk signals ─────────────────────────────────────────────────────────────


class RiskSignalViewSet(TenantScopedViewSet):
    serializer_class = RiskSignalSerializer
    http_method_names = ["get", "head", "options", "post"]
    queryset = RiskSignal.objects.select_related("student", "acknowledged_by")

    def get_permissions(self):
        return [IsSchoolStaff()]

    @action(detail=True, methods=["post"], url_path="acknowledge")
    def acknowledge(self, request, pk=None):
        from django.utils import timezone

        signal = self.get_object()
        if signal.acknowledged_by is not None:
            return Response({"detail": "Already acknowledged."}, status=status.HTTP_400_BAD_REQUEST)
        signal.acknowledged_by = request.user
        signal.acknowledged_at = timezone.now()
        signal.save(update_fields=["acknowledged_by", "acknowledged_at"])
        return Response(RiskSignalSerializer(signal).data)
