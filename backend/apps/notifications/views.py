"""
File:    backend/apps/notifications/views.py
Purpose: NotificationViewSet (own notifications, mark as read) + NotificationTemplateViewSet.
Owner:   Vishal
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import IsSchoolStaff
from apps.common.viewsets import TenantScopedViewSet

from .models import Notification, NotificationTemplate
from .serializers import NotificationSerializer, NotificationTemplateSerializer


class NotificationViewSet(TenantScopedViewSet):
    serializer_class = NotificationSerializer
    http_method_names = ["get", "head", "options", "post"]
    queryset = Notification.objects.none()

    def get_queryset(self):
        # Every user only sees their own notifications
        return Notification.objects.filter(
            school_id=self.request.user.school_id,
            recipient=self.request.user,
        ).order_by("-created_at")

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        from django.utils import timezone

        notif = self.get_object()
        if notif.status == Notification.Status.READ:
            return Response(NotificationSerializer(notif).data)
        notif.status = Notification.Status.READ
        notif.read_at = timezone.now()
        notif.save(update_fields=["status", "read_at"])
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = self.get_queryset().exclude(status=Notification.Status.READ).count()
        return Response({"unread_count": count})

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        from django.utils import timezone

        now = timezone.now()
        updated = self.get_queryset().exclude(status=Notification.Status.READ).update(
            status=Notification.Status.READ,
            read_at=now,
        )
        return Response({"marked_read": updated})


class NotificationTemplateViewSet(TenantScopedViewSet):
    serializer_class = NotificationTemplateSerializer
    queryset = NotificationTemplate.objects.all()

    def get_permissions(self):
        return [IsSchoolStaff()]

    def perform_create(self, serializer):
        serializer.save(school_id=self.request.user.school_id)
