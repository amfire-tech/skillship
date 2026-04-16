"""
File:    backend/jobs/weekly_reports.py
Purpose: Sunday-night Celery job — generates weekly school report for each principal.
Why:     Principals want a ready-to-read summary in their inbox Monday morning.
Owner:   Vishal
TODO:    @shared_task generate_for_all():
           for school in active: call ai_bridge.services.weekly_report(school);
           save PDF/HTML; email principal via notifications.services.send_notification.
"""
