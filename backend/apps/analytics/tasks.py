"""
File:    backend/apps/analytics/tasks.py
Purpose: Celery wrappers around analytics aggregation + auto-report generation.
Owner:   Navanish

Schedules (seeded in migrations/0002 / 0003):
  - fan_out_daily_rebuild      → 02:30 IST daily — rebuild yesterday's stats
  - fan_out_weekly_rebuild     → 03:00 IST Monday — rebuild last week
  - fan_out_monthly_reports    → 03:30 IST on the 1st of each month — last-month PDF
  - fan_out_yearly_reports     → 04:00 IST on Jan 1 — last-year PDF

Each fan-out enqueues one per-school task so a single slow tenant does not
block the rest. Per-school tasks have retry/backoff so transient DB errors
do not lose data.
"""

from __future__ import annotations

import datetime
import logging

from celery import shared_task

from . import services

logger = logging.getLogger(__name__)


def _last_month_window(today: datetime.date) -> tuple[datetime.date, datetime.date]:
    """First and last day of the calendar month before `today`."""
    first_of_this_month = today.replace(day=1)
    last_of_prev = first_of_this_month - datetime.timedelta(days=1)
    first_of_prev = last_of_prev.replace(day=1)
    return first_of_prev, last_of_prev


def _last_year_window(today: datetime.date) -> tuple[datetime.date, datetime.date]:
    return (
        datetime.date(today.year - 1, 1, 1),
        datetime.date(today.year - 1, 12, 31),
    )


@shared_task(
    bind=True,
    name="analytics.rebuild_daily_stats_for_school",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def rebuild_daily_stats_for_school(self, school_id: str, date_iso: str) -> int:
    """Rebuild StudentDailyStats for one school on one calendar day."""
    date = datetime.date.fromisoformat(date_iso)
    rows = services.rebuild_daily_stats(school_id=school_id, date=date)
    logger.info("analytics.daily school=%s date=%s rows=%s", school_id, date_iso, rows)
    return rows


@shared_task(
    bind=True,
    name="analytics.rebuild_weekly_stats_for_school",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def rebuild_weekly_stats_for_school(self, school_id: str, week_start_iso: str) -> int:
    """Rebuild ClassWeeklyStats for one school for the week starting Monday."""
    week_start = datetime.date.fromisoformat(week_start_iso)
    rows = services.rebuild_weekly_stats(school_id=school_id, week_start=week_start)
    logger.info("analytics.weekly school=%s week=%s rows=%s", school_id, week_start_iso, rows)
    return rows


@shared_task(name="analytics.fan_out_daily_rebuild")
def fan_out_daily_rebuild() -> int:
    """Enqueue daily rebuild for every active school. Returns task count."""
    from apps.schools.models import School

    yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
    count = 0
    for school_id in School.objects.filter(is_active=True).values_list("id", flat=True):
        rebuild_daily_stats_for_school.delay(str(school_id), yesterday)
        count += 1
    logger.info("analytics.daily fan-out enqueued=%s date=%s", count, yesterday)
    return count


@shared_task(name="analytics.fan_out_weekly_rebuild")
def fan_out_weekly_rebuild() -> int:
    """Enqueue weekly rebuild for every active school. Aligns to last Monday."""
    from apps.schools.models import School

    today = datetime.date.today()
    # weekday(): Monday=0 — back up to the most recent Monday.
    last_monday = today - datetime.timedelta(days=today.weekday() or 7)
    week_iso = last_monday.isoformat()
    count = 0
    for school_id in School.objects.filter(is_active=True).values_list("id", flat=True):
        rebuild_weekly_stats_for_school.delay(str(school_id), week_iso)
        count += 1
    logger.info("analytics.weekly fan-out enqueued=%s week=%s", count, week_iso)
    return count


# ── Auto-report generation (Phase 2.4) ───────────────────────────────────────


@shared_task(
    bind=True,
    name="analytics.generate_school_report",
    max_retries=3,
    default_retry_delay=120,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def generate_school_report(self, school_id: str, start_iso: str, end_iso: str, label: str) -> str:
    """Render a PDF progress report for one school over the given window
    and store it as a `content.ContentItem` of kind=PDF in that school.

    Returns the new ContentItem's UUID as a string (or "" if nothing to report).
    """
    from django.core.files.base import ContentFile
    from django.core.files.storage import default_storage
    from django.utils.text import slugify

    from apps.academics.models import Course
    from apps.content.models import ContentItem
    from apps.schools.models import School
    from . import exports as report_exports

    start = datetime.date.fromisoformat(start_iso)
    end = datetime.date.fromisoformat(end_iso)
    window = report_exports.DateRange(start=start, end=end)

    school = School.objects.get(pk=school_id)
    report = report_exports.assemble_school_report(school=school, date_range=window)
    if not report["table"]["rows"]:
        logger.info("analytics.report skipped school=%s (%s): no data", school_id, label)
        return ""

    pdf_bytes = report_exports.render_pdf(report)
    filename = f"auto-reports/{school.slug}/{slugify(label)}-{start_iso}-{end_iso}.pdf"
    stored_path = default_storage.save(filename, ContentFile(pdf_bytes))
    try:
        file_url = default_storage.url(stored_path)
    except (NotImplementedError, ValueError):
        file_url = stored_path  # FS backend without a public URL — store the path

    # The report needs a Course to attach to (ContentItem requires it).
    # We pick any course in the school. If none, skip — schools without courses
    # cannot host the report yet.
    course = Course.objects.filter(school=school).first()
    if course is None:
        logger.info("analytics.report skipped school=%s: no course to attach to", school_id)
        return ""

    item = ContentItem.objects.create(
        school=school,
        course=course,
        title=f"[Auto Report] {label} — {school.name}",
        description=f"Auto-generated progress report for {label} ({start_iso} → {end_iso}).",
        kind=ContentItem.Kind.PDF,
        file_url=file_url,
    )
    logger.info(
        "analytics.report generated school=%s item=%s path=%s",
        school_id, item.id, stored_path,
    )
    return str(item.id)


@shared_task(name="analytics.fan_out_monthly_reports")
def fan_out_monthly_reports() -> int:
    """On the 1st of the month: render last month's PDF for every active school."""
    from apps.schools.models import School

    today = datetime.date.today()
    start, end = _last_month_window(today)
    label = f"Monthly Progress {start.strftime('%B %Y')}"

    count = 0
    for school_id in School.objects.filter(is_active=True).values_list("id", flat=True):
        generate_school_report.delay(str(school_id), start.isoformat(), end.isoformat(), label)
        count += 1
    logger.info("analytics.monthly_reports enqueued=%s label=%s", count, label)
    return count


@shared_task(name="analytics.fan_out_yearly_reports")
def fan_out_yearly_reports() -> int:
    """On Jan 1: render last year's PDF for every active school."""
    from apps.schools.models import School

    today = datetime.date.today()
    start, end = _last_year_window(today)
    label = f"Yearly Progress {start.year}"

    count = 0
    for school_id in School.objects.filter(is_active=True).values_list("id", flat=True):
        generate_school_report.delay(str(school_id), start.isoformat(), end.isoformat(), label)
        count += 1
    logger.info("analytics.yearly_reports enqueued=%s label=%s", count, label)
    return count
