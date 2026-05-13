"""
File:    backend/jobs/email.py
Purpose: Async email-sending Celery tasks — invitation, password reset, risk alert notifications.
Owner:   Vishal
"""

from __future__ import annotations

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_email_task(self, to: str, subject: str, body_html: str, body_text: str = "") -> None:
    """Send a single email. Retries up to 3 times on failure with 30-second backoff."""
    try:
        send_mail(
            subject=subject,
            message=body_text or _strip_html(body_html),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to],
            html_message=body_html,
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_bulk_email_task(self, recipients: list[str], subject: str, body_html: str) -> None:
    """Fan out to multiple recipients — one task per recipient so each can retry independently."""
    for to in recipients:
        send_email_task.delay(to=to, subject=subject, body_html=body_html)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _strip_html(html: str) -> str:
    """Minimal HTML-to-text fallback for the plain-text part."""
    import re
    return re.sub(r"<[^>]+>", " ", html).strip()
