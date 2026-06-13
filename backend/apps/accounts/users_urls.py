"""
File:    backend/apps/accounts/users_urls.py
Purpose: URL routes for /api/v1/users/ — kept in its own module so
         apps/accounts/urls.py stays focused on the /auth/ surface.
Owner:   Prashant
"""

from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import StudentRosterView, TeacherDirectoryView, UsersViewSet

app_name = "accounts-users"

router = DefaultRouter()
router.register(r"", UsersViewSet, basename="user")

# `roster/` and `teachers/` are listed BEFORE the router so the router's `<id>/`
# detail route (which would otherwise treat them as a user id) never shadows them.
urlpatterns = [
    path("roster/", StudentRosterView.as_view(), name="student-roster"),
    path("teachers/", TeacherDirectoryView.as_view(), name="teacher-directory"),
] + router.urls
