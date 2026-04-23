"""
File:    backend/apps/schools/urls.py
Purpose: URL routes for the schools app — CRUD on /schools/ + a singleton
         GET/PATCH on /schools/settings/ for the per-school config row.
Owner:   Prashant
"""

from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SchoolSettingsView, SchoolViewSet

app_name = "schools"

# /schools/settings/ is a fixed-path APIView, registered BEFORE the router so
# the router never tries to interpret "settings" as a UUID lookup on /{id}/.
router = DefaultRouter()
router.register(r"", SchoolViewSet, basename="school")

urlpatterns = [
    path("settings/", SchoolSettingsView.as_view(), name="school-settings"),
    path("", include(router.urls)),
]
