"""
File:    backend/apps/analytics/migrations/0002_seed_periodic_tasks.py
Purpose: Idempotently install the two analytics fan-out schedules in django-celery-beat.
Owner:   Navanish

Schedules (Asia/Kolkata, set in settings.TIME_ZONE):
  - 02:30 daily       → analytics.fan_out_daily_rebuild
  - 03:00 Monday      → analytics.fan_out_weekly_rebuild

Reverse migration removes both rows. Safe to run on any environment.
"""

from django.db import migrations


def install(apps, schema_editor):
    CrontabSchedule = apps.get_model("django_celery_beat", "CrontabSchedule")
    PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")

    daily, _ = CrontabSchedule.objects.get_or_create(
        minute="30",
        hour="2",
        day_of_week="*",
        day_of_month="*",
        month_of_year="*",
        timezone="Asia/Kolkata",
    )
    weekly, _ = CrontabSchedule.objects.get_or_create(
        minute="0",
        hour="3",
        day_of_week="1",  # Monday — django-celery-beat uses Sun=0 OR Mon=1 depending on version; ISO Mon=1 is the safe pick.
        day_of_month="*",
        month_of_year="*",
        timezone="Asia/Kolkata",
    )

    PeriodicTask.objects.update_or_create(
        name="analytics.fan_out_daily_rebuild",
        defaults={
            "task":     "analytics.fan_out_daily_rebuild",
            "crontab":  daily,
            "enabled":  True,
        },
    )
    PeriodicTask.objects.update_or_create(
        name="analytics.fan_out_weekly_rebuild",
        defaults={
            "task":     "analytics.fan_out_weekly_rebuild",
            "crontab":  weekly,
            "enabled":  True,
        },
    )


def uninstall(apps, schema_editor):
    PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")
    PeriodicTask.objects.filter(
        name__in=[
            "analytics.fan_out_daily_rebuild",
            "analytics.fan_out_weekly_rebuild",
        ]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("analytics", "0001_initial"),
        ("django_celery_beat", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(install, reverse_code=uninstall),
    ]
