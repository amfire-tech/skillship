"""
File:    backend/apps/notifications/services.py
Purpose: send_notification() — the single entrypoint everyone uses to notify a user.
Why:     Every caller (risk_alerts job, quiz graded, new announcement) calls one function;
         this function picks channel, renders template, creates Notification row, queues delivery.
Owner:   Vishal
TODO:    - send_notification(recipient, template_code, context_dict, channels=[IN_APP])
         - mark_as_read(notification, user)
         - deliver_email_async(notification_id)    # Celery task entry
         - deliver_sms_async(notification_id)      # Celery task entry
"""
