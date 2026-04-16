"""
File:    backend/jobs/celery_app.py
Purpose: Celery app instance — defines the task queue, beat schedule, and auto-discovery.
Why:     Background jobs (risk scan, weekly report, email sending) must not block HTTP requests.
Owner:   Navanish
TODO:    - os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
         - app = Celery("skillship"); app.config_from_object("django.conf:settings", namespace="CELERY")
         - app.autodiscover_tasks()
         - beat schedule:
             * 02:00 daily     -> jobs.risk_alerts.scan_all_schools
             * Sun 22:00       -> jobs.weekly_reports.generate_for_all
             * 03:00 daily     -> analytics.services.rebuild_daily_stats_for_all
"""
