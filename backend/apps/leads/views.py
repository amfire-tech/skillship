"""
File:    backend/apps/leads/views.py
Purpose: DemoRequestViewSet — public POST + Main Admin triage surface.
Owner:   Navanish

Endpoints (mounted under /api/v1/demo-requests/):
    POST    /                  — public, AllowAny. Captures a lead.
    GET     /                  — MAIN_ADMIN only. List leads (paginated).
    GET     /{id}/             — MAIN_ADMIN only. Retrieve one lead.
    PATCH   /{id}/             — MAIN_ADMIN only. Update status / triage_notes.

DELETE is intentionally omitted: we never delete leads, we mark them LOST.

Throttling: the DRF anon throttle (30/min) already protects the public POST.
We do not stack a custom throttle on top — one rate limit is enough, and the
proposal already promises "rate limiting" as a platform-level guarantee.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsMainAdmin

from .models import DemoRequest
from .serializers import DemoRequestCreateSerializer, DemoRequestReadSerializer


class DemoRequestViewSet(ModelViewSet):
    """Public-create + admin-read viewset for demo / sales leads."""

    queryset = DemoRequest.objects.all().order_by("-created_at")
    http_method_names = ["get", "post", "patch", "head", "options"]
    lookup_field = "id"

    def get_serializer_class(self):
        if self.action == "create":
            return DemoRequestCreateSerializer
        return DemoRequestReadSerializer

    def get_permissions(self):
        # Anonymous users can POST a lead; everything else is MAIN_ADMIN only.
        if self.action == "create":
            return [AllowAny()]
        return [IsMainAdmin()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = serializer.save()
        # Echo back the read shape (with id + created_at) so the frontend can
        # confirm receipt without an extra round-trip.
        return Response(
            DemoRequestReadSerializer(lead).data,
            status=status.HTTP_201_CREATED,
        )
