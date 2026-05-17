"""
File:    backend/apps/analytics/migrations/0003_seed_report_tasks.py
Purpose: Schedule auto-report fan-outs:
           - monthly:  03:30 IST on day 1 of every month
           - yearly:   04:00 IST on Jan 1
Owner:   Navanish
"""

from django.db import migrations


def install(apps, schema_editor):
    CrontabSchedule = apps.get_model("django_celery_beat", "CrontabSchedule")
    PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")

    monthly, _ = CrontabSchedule.objects.get_or_create(
        minute="30",
        hour="3",
        day_of_month="1",
        day_of_week="*",
        month_of_year="*",
        timezone="Asia/Kolkata",
    )
    yearly, _ = CrontabSchedule.objects.get_or_create(
        minute="0",
        hour="4",
        day_of_month="1",
        day_of_week="*",
        month_of_year="1",
        timezone="Asia/Kolkata",
    )

    PeriodicTask.objects.update_or_create(
        name="analytics.fan_out_monthly_reports",
        defaults={
            "task":     "analytics.fan_out_monthly_reports",
            "crontab":  monthly,
            "enabled":  True,
        },
    )
    PeriodicTask.objects.update_or_create(
        name="analytics.fan_out_yearly_reports",
        defaults={
            "task":     "analytics.fan_out_yearly_reports",
            "crontab":  yearly,
            "enabled":  True,
        },
    )


def uninstall(apps, schema_editor):
    PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")
    PeriodicTask.objects.filter(
        name__in=[
            "analytics.fan_out_monthly_reports",
            "analytics.fan_out_yearly_reports",
        ]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("analytics", "0002_seed_periodic_tasks"),
        ("django_celery_beat", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(install, reverse_code=uninstall),
    ]
