"""
File:    backend/jobs/email.py
Purpose: Async email-sending Celery tasks (invitation, password reset, risk alert, weekly report).
Why:     Sending email inline blocks the request; Celery handles it in background with retry.
Owner:   Vishal
TODO:    @shared_task send_email_task(to, subject, body_html): use Django's send_mail; retry 3x.
"""
