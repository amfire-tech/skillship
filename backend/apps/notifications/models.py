"""
File:    backend/apps/notifications/models.py
Purpose: Notification + NotificationTemplate — in-app + email + SMS deliveries.
Why:     We need a queryable history of who was told what (for audits and re-send).
Owner:   Vishal
TODO:    class Notification(TenantModel):
           - recipient FK(User), channel (IN_APP / EMAIL / SMS / PUSH),
           - title, body, data_json (deep-link payload),
           - status (PENDING / SENT / FAILED / READ), sent_at, read_at

         class NotificationTemplate(TenantModel):
           - code (e.g. "risk_alert"), channel, subject, body_template (Jinja),
           - is_active
"""
