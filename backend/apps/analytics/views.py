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
    IsMainAdmin, IsPrincipal, IsSchoolStaff, IsStudent, IsTeacher, Role,
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


class PlatformAnalyticsView(APIView):
    """GET /api/v1/analytics/platform/ — owner-wide analytics for MAIN_ADMIN.

    Every number here is computed from live rows (schools, users, quizzes, quiz
    attempts) — nothing is fabricated:

      * onboarding trends come from created_at / date_joined,
      * performance/score metrics from submitted QuizAttempt rows,
      * "avg time per quiz" is the real attempt duration (submitted_at − started_at),
      * "active students" are students with a submitted attempt in the window.

    We deliberately do NOT expose a "website visit" count or a "dashboard usage
    time" figure: there is no pageview / session tracking in the data model, so
    inventing those would be fake. The metrics below are the real equivalents.
    """

    permission_classes = [IsAuthenticated, IsMainAdmin]

    # ── small helpers ────────────────────────────────────────────────────────
    @staticmethod
    def _month_buckets(n: int):
        """Return the first-of-month `date` for each of the last `n` months,
        oldest first."""
        from django.utils import timezone

        first = timezone.now().date().replace(day=1)
        out, y, m = [], first.year, first.month
        for _ in range(n):
            out.append(date(y, m, 1))
            m -= 1
            if m == 0:
                m, y = 12, y - 1
        return list(reversed(out))

    @staticmethod
    def _series(qs, field: str, months):
        """Count rows per calendar month for `field`, aligned to `months` (so
        gaps are filled with 0). Keyed by 'YYYY-MM' to dodge timezone edge cases."""
        from django.db.models import Count
        from django.db.models.functions import TruncMonth

        start = months[0]
        raw = (
            qs.filter(**{f"{field}__date__gte": start})
            .annotate(_m=TruncMonth(field))
            .values("_m")
            .annotate(c=Count("id"))
        )
        cmap = {r["_m"].strftime("%Y-%m"): r["c"] for r in raw if r["_m"]}
        return [
            {"month": mo.strftime("%Y-%m"), "label": mo.strftime("%b"), "count": cmap.get(mo.strftime("%Y-%m"), 0)}
            for mo in months
        ]

    def get(self, request):
        from datetime import timedelta

        from django.db.models import (
            Avg, Count, DurationField, ExpressionWrapper, F, Q,
        )
        from django.db.models.functions import TruncMonth
        from django.utils import timezone

        from apps.quizzes.models import Quiz, QuizAttempt

        now = timezone.now()
        months = self._month_buckets(12)

        students_qs = User.objects.filter(role=User.Role.STUDENT)
        teachers_qs = User.objects.filter(role=User.Role.TEACHER)
        submitted = QuizAttempt.objects.filter(status=QuizAttempt.Status.SUBMITTED)

        # ── onboarding / creation trends (last 12 months) ────────────────────
        schools_pm = self._series(School.objects.all(), "created_at", months)
        students_pm = self._series(students_qs, "date_joined", months)
        teachers_pm = self._series(teachers_qs, "date_joined", months)
        quizzes_pm = self._series(Quiz.objects.all(), "created_at", months)

        # ── quiz attempts + average score per month ──────────────────────────
        attempts_raw = (
            submitted.annotate(_m=TruncMonth("submitted_at"))
            .values("_m")
            .annotate(c=Count("id"), avg=Avg("score_percent"))
        )
        amap = {r["_m"].strftime("%Y-%m"): r for r in attempts_raw if r["_m"]}
        attempts_pm = [
            {
                "month": mo.strftime("%Y-%m"),
                "label": mo.strftime("%b"),
                "count": amap.get(mo.strftime("%Y-%m"), {}).get("c", 0),
                "avg_score": round(float(amap[mo.strftime("%Y-%m")]["avg"]), 1)
                if mo.strftime("%Y-%m") in amap and amap[mo.strftime("%Y-%m")]["avg"] is not None
                else 0,
            }
            for mo in months
        ]

        # ── quiz status breakdown ────────────────────────────────────────────
        status_raw = dict(Quiz.objects.values_list("status").annotate(c=Count("id")))
        quiz_status = [
            {"label": lbl, "count": status_raw.get(code, 0)}
            for code, lbl in (
                ("PUBLISHED", "Published"), ("REVIEW", "In Review"),
                ("DRAFT", "Draft"), ("ARCHIVED", "Archived"),
            )
        ]

        # ── score distribution (submitted attempts) ──────────────────────────
        dist = submitted.aggregate(
            b0=Count("id", filter=Q(score_percent__lt=40)),
            b1=Count("id", filter=Q(score_percent__gte=40, score_percent__lt=60)),
            b2=Count("id", filter=Q(score_percent__gte=60, score_percent__lt=75)),
            b3=Count("id", filter=Q(score_percent__gte=75, score_percent__lt=90)),
            b4=Count("id", filter=Q(score_percent__gte=90)),
        )
        score_distribution = [
            {"bucket": "0–40%", "count": dist["b0"]},
            {"bucket": "40–60%", "count": dist["b1"]},
            {"bucket": "60–75%", "count": dist["b2"]},
            {"bucket": "75–90%", "count": dist["b3"]},
            {"bucket": "90–100%", "count": dist["b4"]},
        ]

        # ── average score by subject (quiz.course.name) ──────────────────────
        subj_raw = (
            submitted.values("quiz__course__name")
            .annotate(avg=Avg("score_percent"), n=Count("id"))
            .order_by("-n")[:8]
        )
        avg_score_by_subject = [
            {
                "subject": r["quiz__course__name"] or "—",
                "avg": round(float(r["avg"]), 1) if r["avg"] is not None else 0,
                "attempts": r["n"],
            }
            for r in subj_raw
        ]

        # ── regional distribution: schools + students per state ──────────────
        sch_state = dict(School.objects.values_list("state").annotate(c=Count("id")))
        stu_state = {
            r["school__state"]: r["c"]
            for r in students_qs.values("school__state").annotate(c=Count("id"))
        }
        regional = sorted(
            (
                {"state": (st or "Unknown"), "schools": sch_state.get(st, 0), "students": stu_state.get(st, 0)}
                for st in (set(sch_state) | set(stu_state))
            ),
            key=lambda x: (-x["students"], -x["schools"]),
        )

        # ── engagement / real usage time ─────────────────────────────────────
        # Average real attempt duration (submitted_at − started_at). Only count
        # rows where submitted_at is genuinely after started_at — otherwise a
        # mis-stamped row would drag the average negative.
        dur = (
            submitted.filter(submitted_at__isnull=False, submitted_at__gt=F("started_at"))
            .annotate(d=ExpressionWrapper(F("submitted_at") - F("started_at"), output_field=DurationField()))
            .aggregate(avg=Avg("d"))["avg"]
        )
        avg_quiz_minutes = round(max(dur.total_seconds(), 0) / 60, 1) if dur else 0
        active_7d = submitted.filter(submitted_at__gte=now - timedelta(days=7)).values("student_id").distinct().count()
        active_30d = submitted.filter(submitted_at__gte=now - timedelta(days=30)).values("student_id").distinct().count()

        # ── headline KPIs ────────────────────────────────────────────────────
        agg = submitted.aggregate(
            total=Count("id"),
            avg=Avg("score_percent"),
            passed=Count("id", filter=Q(score_percent__gte=F("quiz__pass_percentage"))),
        )
        total = agg["total"] or 0
        kpis = {
            "schools": School.objects.count(),
            "students": students_qs.count(),
            "teachers": teachers_qs.count(),
            "quizzes": Quiz.objects.count(),
            "total_attempts": total,
            "avg_score": round(float(agg["avg"]), 1) if agg["avg"] is not None else 0,
            "pass_rate": round(100 * agg["passed"] / total, 1) if total else 0,
            "active_students_30d": active_30d,
            "avg_quiz_minutes": avg_quiz_minutes,
        }

        return Response({
            "kpis": kpis,
            "schools_per_month": schools_pm,
            "students_per_month": students_pm,
            "teachers_per_month": teachers_pm,
            "quizzes_per_month": quizzes_pm,
            "attempts_per_month": attempts_pm,
            "quiz_status": quiz_status,
            "score_distribution": score_distribution,
            "avg_score_by_subject": avg_score_by_subject,
            "regional": regional,
            "engagement": {
                "active_7d": active_7d,
                "active_30d": active_30d,
                "avg_quiz_minutes": avg_quiz_minutes,
            },
        })
