"""
File:    backend/apps/notifications/services.py
Purpose: send_notification() — the single entrypoint for all notification delivery.
Owner:   Vishal
"""

from __future__ import annotations

from django.utils import timezone

from .models import Notification, NotificationTemplate


def send_notification(
    recipient,
    template_code: str,
    context: dict,
    channels: list[str] | None = None,
) -> list[Notification]:
    """Create Notification rows and queue async delivery for each channel.

    Args:
        recipient:      User instance to notify.
        template_code:  Code matching a NotificationTemplate row (e.g. "risk_alert").
        context:        Dict of variables for template rendering (Jinja-style).
        channels:       Override channels; defaults to the template's channel.

    Returns:
        List of created Notification instances.
    """
    from jinja2 import Template

    school_id = recipient.school_id
    templates = NotificationTemplate.objects.filter(
        school_id=school_id,
        code=template_code,
        is_active=True,
    )

    if channels:
        templates = templates.filter(channel__in=channels)

    created: list[Notification] = []

    for tmpl in templates:
        try:
            rendered_subject = Template(tmpl.subject).render(**context) if tmpl.subject else ""
            rendered_body = Template(tmpl.body_template).render(**context)
        except Exception:
            rendered_subject = tmpl.subject
            rendered_body = tmpl.body_template

        notif = Notification.objects.create(
            school_id=school_id,
            recipient=recipient,
            channel=tmpl.channel,
            title=rendered_subject or template_code,
            body=rendered_body,
            data_json=context,
            status=Notification.Status.PENDING,
        )
        created.append(notif)

        if tmpl.channel == Notification.Channel.EMAIL:
            deliver_email_async.delay(str(notif.id))
        elif tmpl.channel == Notification.Channel.IN_APP:
            # In-app: mark as sent immediately (client polls REST endpoint)
            notif.status = Notification.Status.SENT
            notif.sent_at = timezone.now()
            notif.save(update_fields=["status", "sent_at"])

    return created


def send_in_app(
    recipient, title: str, body: str, data: dict | None = None, school_id=None
) -> Notification:
    """Shortcut for a quick in-app notification without a template.

    `school_id` defaults to the recipient's own school, but callers may pass it
    explicitly — required for roaming recipients (a SUB_ADMIN or Skillship
    teacher has school=NULL, yet the Notification is a TenantModel and must
    belong to the school the alert is about)."""
    notif = Notification.objects.create(
        school_id=school_id or recipient.school_id,
        recipient=recipient,
        channel=Notification.Channel.IN_APP,
        title=title,
        body=body,
        data_json=data or {},
        status=Notification.Status.SENT,
        sent_at=timezone.now(),
    )
    return notif


def send_alert(recipient, title: str, body: str, category: str = "", school_id=None) -> Notification:
    """Create an in-app alert AND fire a best-effort browser push.

    Used by the super-admin alert composer. The in-app row is the source of
    truth (always created); the web push is a bonus that reaches the user even
    when the dashboard tab is closed. Pass `school_id` for roaming recipients
    (SUB_ADMIN / Skillship teacher) whose own school is NULL.
    """
    notif = send_in_app(recipient, title, body, {"category": category}, school_id=school_id)
    send_web_push(recipient, title=title, body=body, data={"category": category, "url": "/dashboard"})
    return notif


def send_web_push(user, *, title: str, body: str, data: dict | None = None) -> int:
    """Push to every browser `user` has subscribed. Returns how many succeeded.

    Best-effort: prunes subscriptions the push service reports as gone (404/410)
    and no-ops when VAPID keys aren't configured, so an in-app alert is never
    blocked by a push failure.
    """
    import json
    import logging

    from django.conf import settings

    from .models import PushSubscription

    logger = logging.getLogger(__name__)

    if not (settings.VAPID_PRIVATE_KEY and settings.VAPID_PUBLIC_KEY):
        return 0

    subs = list(PushSubscription.objects.filter(user=user))
    if not subs:
        return 0

    try:
        from pywebpush import WebPushException, webpush
    except ImportError:  # pragma: no cover - dependency missing
        logger.warning("pywebpush not installed; skipping web push")
        return 0

    message = json.dumps({"title": title, "body": body, "data": data or {}})
    delivered = 0
    for sub in subs:
        try:
            webpush(
                subscription_info=sub.as_subscription_info(),
                data=message,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_SUBJECT},
            )
            delivered += 1
        except WebPushException as exc:
            status = getattr(getattr(exc, "response", None), "status_code", None)
            if status in (404, 410):
                sub.delete()  # permanently gone — stop retrying
            else:
                logger.warning("Web push failed for sub %s: %s", sub.id, exc)
    return delivered


# ── Async delivery tasks ──────────────────────────────────────────────────────


from celery import shared_task  # noqa: E402


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def deliver_email_async(self, notification_id: str) -> None:
    """Celery task: fetch the Notification row and send it via email.py send_email_task."""
    try:
        notif = Notification.objects.get(id=notification_id)
    except Notification.DoesNotExist:
        return

    from jobs.email import send_email_task

    try:
        send_email_task(
            to=notif.recipient.email,
            subject=notif.title,
            body_html=notif.body,
        )
        notif.status = Notification.Status.SENT
        notif.sent_at = timezone.now()
        notif.save(update_fields=["status", "sent_at"])
    except Exception as exc:
        notif.status = Notification.Status.FAILED
        notif.save(update_fields=["status"])
        raise self.retry(exc=exc)
