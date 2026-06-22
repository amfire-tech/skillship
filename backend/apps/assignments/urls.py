"""
File:    backend/apps/assignments/urls.py
Purpose: Routes for Skillship-teacher assignments.
Owner:   Navanish
"""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from .views import (
    DailyTeachingLogViewSet,
    SkillshipAssignmentViewSet,
    SubAdminGrantViewSet,
)

router = DefaultRouter()
router.register(r"skillship", SkillshipAssignmentViewSet, basename="skillship-assignment")
router.register(r"subadmin-grants", SubAdminGrantViewSet, basename="subadmin-grant")
router.register(r"teaching-logs", DailyTeachingLogViewSet, basename="teaching-log")

urlpatterns = router.urls
