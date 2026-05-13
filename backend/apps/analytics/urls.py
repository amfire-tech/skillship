"""
File:    backend/apps/analytics/urls.py
Purpose: URL routing for the analytics app.
Owner:   Vishal
"""

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PrincipalDashboardView, RiskSignalViewSet, StudentDashboardView, TeacherDashboardView

router = DefaultRouter()
router.register(r"risk-signals", RiskSignalViewSet, basename="risksignal")

urlpatterns = [
    path("dashboards/student/", StudentDashboardView.as_view(), name="student-dashboard"),
    path("dashboards/teacher/", TeacherDashboardView.as_view(), name="teacher-dashboard"),
    path("dashboards/principal/", PrincipalDashboardView.as_view(), name="principal-dashboard"),
] + router.urls
