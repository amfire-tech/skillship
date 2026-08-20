"""
File:    backend/apps/gallery/urls.py
Purpose: Routes for /api/v1/gallery/.
Owner:   Navanish
"""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from .views import GalleryImageViewSet

app_name = "gallery"

router = DefaultRouter()
router.register(r"", GalleryImageViewSet, basename="gallery-image")

urlpatterns = router.urls
