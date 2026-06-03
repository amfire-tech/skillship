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

On successful create() we also fire a best-effort email notification to the
owner inbox so they get a live ping the moment a school books a walkthrough.
The notification is wrapped in try/except — a broken SMTP config must never
cause a 500 on the public form.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsMainAdmin

from .models import DemoRequest
from .serializers import DemoRequestCreateSerializer, DemoRequestReadSerializer

logger = logging.getLogger(__name__)


def _notify_owner(lead: DemoRequest) -> None:
    """Best-effort owner notification — never raises into the request path."""
    recipient = getattr(settings, "LEADS_NOTIFY_EMAIL", "") or getattr(
        settings, "DEFAULT_FROM_EMAIL", ""
    )
    if not recipient:
        logger.info("LEADS_NOTIFY_EMAIL not set; skipping owner email for lead %s", lead.id)
        return

    slot_display = lead.get_preferred_time_slot_display() if lead.preferred_time_slot else "—"
    date_display = lead.preferred_date.isoformat() if lead.preferred_date else "—"

    subject = f"[Skillship] New demo request — {lead.school_name}"
    body = (
        f"A new school just booked a Skillship walkthrough.\n\n"
        f"School:      {lead.school_name}\n"
        f"Principal:   {lead.principal_name}\n"
        f"City:        {lead.city}\n"
        f"Students:    {lead.get_student_range_display()}\n"
        f"Board:       {lead.school_board or '—'}\n"
        f"Phone:       {lead.phone_number}\n"
        f"Email:       {lead.email_address}\n\n"
        f"Preferred:   {date_display} at {slot_display}\n\n"
        f"Triage in Django admin:  /admin/leads/demorequest/{lead.id}/change/\n"
        f"Lead id: {lead.id}\n"
    )
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", recipient),
            recipient_list=[recipient],
            fail_silently=False,
        )
    except Exception as exc:  # noqa: BLE001 — best-effort notification
        # Swallow but log — the lead is already persisted; we don't want a
        # broken SMTP config to surface as a 500 on the public form.
        logger.warning("Owner email notification failed for lead %s: %s", lead.id, exc)


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
        _notify_owner(lead)
        # Echo back the read shape (with id + created_at) so the frontend can
        # confirm receipt without an extra round-trip.
        return Response(
            DemoRequestReadSerializer(lead).data,
            status=status.HTTP_201_CREATED,
        )
