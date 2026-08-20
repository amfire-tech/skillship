"""
File:    backend/apps/gallery/views.py
Purpose: GalleryImageViewSet — public read, Super Admin (MAIN_ADMIN) write.
Owner:   Navanish

Endpoints (mounted under /api/v1/gallery/):
    GET    /          — public, AllowAny. Only is_active=True images, in display order.
    GET    /{id}/     — public, AllowAny.
    POST   /          — MAIN_ADMIN only. Multipart upload (image file + caption).
    PATCH  /{id}/     — MAIN_ADMIN only. Edit caption/order/is_active.
    DELETE /{id}/     — MAIN_ADMIN only.

MAIN_ADMIN gets every row (including inactive) on list/retrieve too, so the
super-admin gallery panel can manage images before/after publishing them.
"""

from __future__ import annotations

from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsMainAdmin, Role

from .models import GalleryImage
from .serializers import GalleryImageSerializer


class GalleryImageViewSet(ModelViewSet):
    serializer_class = GalleryImageSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        return [IsMainAdmin()]

    def get_queryset(self):
        qs = GalleryImage.objects.select_related("uploaded_by")
        user = self.request.user
        if user.is_authenticated and user.role == Role.MAIN_ADMIN:
            return qs
        return qs.filter(is_active=True)

    def perform_create(self, serializer):
        # Force is_active=True on create regardless of what validated_data has.
        # DRF's BooleanField.get_value() treats a QueryDict (which is what
        # MultiPartParser/FormParser produce for the image upload) as an HTML
        # form: a field missing from the payload is read as an unchecked
        # checkbox -> False, not "use the model default". Without this,
        # every upload silently lands inactive and never appears publicly.
        serializer.save(uploaded_by=self.request.user, is_active=True)
