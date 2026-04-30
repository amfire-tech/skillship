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


def send_in_app(recipient, title: str, body: str, data: dict | None = None) -> Notification:
    """Shortcut for a quick in-app notification without a template."""
    notif = Notification.objects.create(
        school_id=recipient.school_id,
        recipient=recipient,
        channel=Notification.Channel.IN_APP,
        title=title,
        body=body,
        data_json=data or {},
        status=Notification.Status.SENT,
        sent_at=timezone.now(),
    )
    return notif


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
