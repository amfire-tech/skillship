"""
File:    backend/apps/analytics/views.py
Purpose: Read-only dashboard endpoints + RiskSignal management.
Owner:   Vishal
"""

from __future__ import annotations

from datetime import date, timedelta

from django.db.models import Avg, Sum
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsPrincipal, IsSchoolStaff, IsStudent, IsTeacher
from apps.common.viewsets import TenantScopedViewSet

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
