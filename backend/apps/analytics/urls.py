"""
File:    backend/apps/analytics/urls.py
Purpose: URL routing for the analytics app.
Owner:   Navanish (exports added Phase 2.1)
"""

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    BenchmarkingView,
    ClassReportExportView,
    ClassSkillBreakdownView,
    PrincipalDashboardView,
    RiskSignalViewSet,
    SchoolReportExportView,
    StudentDashboardView,
    StudentReportExportView,
    StudentSkillBreakdownView,
    TeacherDashboardView,
)

router = DefaultRouter()
router.register(r"risk-signals", RiskSignalViewSet, basename="risksignal")

urlpatterns = [
    path("dashboards/student/", StudentDashboardView.as_view(), name="student-dashboard"),
    path("dashboards/teacher/", TeacherDashboardView.as_view(), name="teacher-dashboard"),
    path("dashboards/principal/", PrincipalDashboardView.as_view(), name="principal-dashboard"),
    # PDF / XLSX exports (Phase 2.1)
    path("reports/student/<uuid:student_id>/export/", StudentReportExportView.as_view(), name="report-student"),
    path("reports/class/<uuid:class_id>/export/",     ClassReportExportView.as_view(),   name="report-class"),
    path("reports/school/<uuid:school_id>/export/",   SchoolReportExportView.as_view(),  name="report-school"),
    # Skill-wise analytics (Phase 2.2)
    path("dashboards/student/skills/",                StudentSkillBreakdownView.as_view(), name="student-skills"),
    path("dashboards/class/<uuid:class_id>/skills/",  ClassSkillBreakdownView.as_view(),   name="class-skills"),
    # Benchmarking (Phase 2.3)
    path("benchmarking/",                             BenchmarkingView.as_view(),          name="benchmarking"),
] + router.urls
