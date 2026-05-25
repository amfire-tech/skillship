"""
File:    backend/apps/leads/urls.py
Purpose: Routes for /api/v1/demo-requests/.
Owner:   Navanish
"""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from .views import DemoRequestViewSet

app_name = "leads"

router = DefaultRouter()
# Empty prefix so the viewset hangs off /api/v1/demo-requests/ directly,
# rather than /api/v1/demo-requests/demo-requests/.
router.register(r"", DemoRequestViewSet, basename="demo-request")

urlpatterns = router.urls
