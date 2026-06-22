"""
File:    backend/apps/notifications/views.py
Purpose: NotificationViewSet (own notifications, mark as read) + NotificationTemplateViewSet.
Owner:   Vishal
"""

from __future__ import annotations

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.common.permissions import IsMainAdmin, IsSchoolStaff, Role
from apps.common.viewsets import TenantScopedViewSet

from .models import Notification, NotificationTemplate, PushSubscription
from .serializers import NotificationSerializer, NotificationTemplateSerializer
from .services import send_alert


class NotificationViewSet(TenantScopedViewSet):
    serializer_class = NotificationSerializer
    http_method_names = ["get", "head", "options", "post"]
    queryset = Notification.objects.none()

    def get_queryset(self):
        # Every user only sees their own notifications. Scope by recipient ONLY
        # (not school) — recipient=user is already a complete, leak-proof scope,
        # and a roaming user (SUB_ADMIN / Skillship teacher, school=NULL) would
        # otherwise never see alerts a super-admin addressed to them about a
        # specific school.
        return Notification.objects.filter(
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


# ── Super-admin alert composer ────────────────────────────────────────────────


ALERTABLE_ROLES = {Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.SUB_ADMIN}


def _alert_recipients(school_id, roles):
    """Every active user the super-admin can reach for `school_id` under the
    chosen `roles`. Handles both school-bound roles and roaming actors:

      - PRINCIPAL / TEACHER (SCHOOL) / STUDENT → users whose own school is this.
      - TEACHER also includes Skillship (roaming) teachers ACTIVELY assigned to
        this school — they have school=NULL but teach here.
      - SUB_ADMIN → roaming sub-admins with an ACTIVE grant for this school.

    Returns a de-duplicated list of User instances.
    """
    roles = set(roles)
    by_id = {}

    direct_roles = roles & {Role.PRINCIPAL, Role.TEACHER, Role.STUDENT}
    if direct_roles:
        for u in User.objects.filter(school_id=school_id, role__in=direct_roles, is_active=True):
            by_id[u.id] = u

    if Role.TEACHER in roles:
        from apps.assignments.models import SkillshipAssignment

        ids = (
            SkillshipAssignment.objects.filter(school_id=school_id, is_active=True)
            .values_list("teacher_id", flat=True)
        )
        for u in User.objects.filter(id__in=ids, is_active=True):
            by_id[u.id] = u

    if Role.SUB_ADMIN in roles:
        from apps.assignments.models import SubAdminGrant

        ids = (
            SubAdminGrant.objects.filter(school_id=school_id, is_active=True)
            .values_list("subadmin_id", flat=True)
        )
        for u in User.objects.filter(id__in=ids, is_active=True):
            by_id[u.id] = u

    return list(by_id.values())


class AdminAlertView(APIView):
    """POST /api/v1/notifications/admin/send/ — MAIN_ADMIN sends an alert.

    Body: { school: <uuid>, roles: ["PRINCIPAL","TEACHER","STUDENT","SUB_ADMIN"],
            title, body, category? }
    Creates one in-app Notification per matching recipient in that school and
    fires a best-effort browser push to each. Like the billing endpoints, this
    is a plain APIView (not tenant-scoped) because MAIN_ADMIN has school=NULL.
    """

    permission_classes = [IsAuthenticated, IsMainAdmin]

    def post(self, request):
        data = request.data
        school = data.get("school")
        roles = data.get("roles") or []
        title = (data.get("title") or "").strip()
        body = (data.get("body") or "").strip()
        category = (data.get("category") or "").strip()

        if not school:
            raise ValidationError({"school": "Pick a school to alert."})
        if not title:
            raise ValidationError({"title": "A title is required."})
        if not body:
            raise ValidationError({"body": "A message is required."})
        roles = [r for r in roles if r in ALERTABLE_ROLES]
        if not roles:
            raise ValidationError(
                {"roles": "Choose at least one of Principal, Teachers, Students or Sub-Admins."}
            )

        sent = 0
        for user in _alert_recipients(school, roles):
            # Stamp the alert with the target school so a roaming recipient's
            # (school=NULL) notification still belongs to the right tenant.
            send_alert(user, title=title, body=body, category=category, school_id=school)
            sent += 1

        return Response({"sent": sent}, status=status.HTTP_201_CREATED)


# ── Web Push subscriptions ────────────────────────────────────────────────────


class PushPublicKeyView(APIView):
    """GET /api/v1/notifications/push/public-key/ — the VAPID public key the
    browser needs to create a subscription. Safe to expose."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"public_key": settings.VAPID_PUBLIC_KEY})


class PushSubscribeView(APIView):
    """POST /api/v1/notifications/push/subscribe/ — store this browser's
    subscription for the current user (idempotent on endpoint)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        sub = request.data or {}
        endpoint = sub.get("endpoint")
        keys = sub.get("keys") or {}
        p256dh, auth = keys.get("p256dh"), keys.get("auth")
        if not (endpoint and p256dh and auth):
            raise ValidationError("A valid push subscription (endpoint + keys) is required.")

        PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={"user": request.user, "p256dh": p256dh, "auth": auth},
        )
        return Response({"subscribed": True}, status=status.HTTP_201_CREATED)


class PushUnsubscribeView(APIView):
    """POST /api/v1/notifications/push/unsubscribe/ — drop a subscription."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        endpoint = (request.data or {}).get("endpoint")
        if endpoint:
            PushSubscription.objects.filter(endpoint=endpoint, user=request.user).delete()
        return Response({"unsubscribed": True})
