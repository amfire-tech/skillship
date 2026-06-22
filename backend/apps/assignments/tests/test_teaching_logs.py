"""
File:    backend/apps/assignments/tests/test_teaching_logs.py
Purpose: Daily teaching logs — a Skillship (roaming) teacher submits {date,
         subject, description} scoped to the school they're acting in; they see
         only their own logs; MAIN_ADMIN sees every teacher's logs and can
         filter; a normal SCHOOL teacher cannot create them; logs never leak
         across schools.
Owner:   Navanish
"""

from __future__ import annotations

import datetime

import pytest

from apps.accounts.models import User
from apps.assignments.models import DailyTeachingLog, SkillshipAssignment

pytestmark = pytest.mark.django_db

LOGS = "/api/v1/assignments/teaching-logs/"


@pytest.fixture
def skillship_teacher(db, password):
    return User.objects.create_user(
        username="roamer-log", email="roamer-log@skillship.test", password=password,
        first_name="Roamer", last_name="Skillship",
        role=User.Role.TEACHER, teacher_type=User.TeacherType.SKILLSHIP, school=None,
    )


def _payload(**over):
    base = {"date": "2026-06-23", "subject": "Algebra", "description": "Quadratic equations, ch 4."}
    base.update(over)
    return base


# ── Create ────────────────────────────────────────────────────────────────────


def test_skillship_teacher_creates_log_scoped_to_acting_school(
    api_client, skillship_teacher, school_a, login
):
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    login(api_client, skillship_teacher)
    res = api_client.post(LOGS, _payload(), format="json", HTTP_X_SCHOOL_CONTEXT=str(school_a.id))
    assert res.status_code == 201, res.content
    log = DailyTeachingLog.objects.get()
    # Teacher + school are stamped server-side, never from the request body.
    assert log.teacher_id == skillship_teacher.id
    assert log.school_id == school_a.id
    assert log.subject == "Algebra"


def test_create_without_school_context_is_refused(api_client, skillship_teacher, school_a, login):
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    login(api_client, skillship_teacher)
    # No X-School-Context header → no acting school → 403 (never a null-tenant row).
    res = api_client.post(LOGS, _payload(), format="json")
    assert res.status_code == 403
    assert DailyTeachingLog.objects.count() == 0


def test_normal_school_teacher_cannot_create_log(api_client, teacher_a, login):
    login(api_client, teacher_a)
    res = api_client.post(LOGS, _payload(), format="json")
    assert res.status_code == 403
    assert DailyTeachingLog.objects.count() == 0


def test_blank_subject_or_description_rejected(api_client, skillship_teacher, school_a, login):
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    login(api_client, skillship_teacher)
    res = api_client.post(
        LOGS, _payload(subject="   ", description=""), format="json",
        HTTP_X_SCHOOL_CONTEXT=str(school_a.id),
    )
    assert res.status_code == 400
    assert "subject" in res.data or "description" in res.data


def test_create_with_photo_and_geo_proof(api_client, skillship_teacher, school_a, login):
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    login(api_client, skillship_teacher)
    photo = "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
    res = api_client.post(
        LOGS, _payload(photo=photo, latitude=28.6139, longitude=77.2090),
        format="json", HTTP_X_SCHOOL_CONTEXT=str(school_a.id),
    )
    assert res.status_code == 201, res.content
    log = DailyTeachingLog.objects.get()
    assert log.photo == photo
    assert log.latitude == 28.6139 and log.longitude == 77.2090
    # Create response (full serializer) echoes the proof + has_photo flag.
    assert res.data["has_photo"] is True
    assert res.data["latitude"] == 28.6139


def test_list_omits_photo_blob_but_keeps_flag_and_geo(api_client, skillship_teacher, school_a, login):
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    DailyTeachingLog.objects.create(
        teacher=skillship_teacher, school=school_a, date=datetime.date(2026, 6, 23),
        subject="Proof", description="x", photo="data:image/jpeg;base64,AAAA",
        latitude=28.6, longitude=77.2,
    )
    login(api_client, skillship_teacher)
    res = api_client.get(LOGS, HTTP_X_SCHOOL_CONTEXT=str(school_a.id))
    rows = res.data["results"] if isinstance(res.data, dict) else res.data
    row = rows[0]
    # List must NOT ship the heavy base64 photo, but says one exists + has coords.
    assert "photo" not in row
    assert row["has_photo"] is True
    assert row["latitude"] == 28.6 and row["longitude"] == 77.2


def test_detail_returns_full_photo(api_client, skillship_teacher, school_a, login):
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    log = DailyTeachingLog.objects.create(
        teacher=skillship_teacher, school=school_a, date=datetime.date(2026, 6, 23),
        subject="Proof", description="x", photo="data:image/jpeg;base64,ZZZZ",
    )
    login(api_client, skillship_teacher)
    res = api_client.get(f"{LOGS}{log.id}/", HTTP_X_SCHOOL_CONTEXT=str(school_a.id))
    assert res.status_code == 200
    assert res.data["photo"] == "data:image/jpeg;base64,ZZZZ"


# ── Read scoping ──────────────────────────────────────────────────────────────


def test_teacher_sees_only_own_logs(api_client, skillship_teacher, school_a, login, password):
    other = User.objects.create_user(
        username="roamer2", email="r2@skillship.test", password=password,
        role=User.Role.TEACHER, teacher_type=User.TeacherType.SKILLSHIP, school=None,
    )
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    SkillshipAssignment.objects.create(teacher=other, school=school_a, is_active=True)
    DailyTeachingLog.objects.create(
        teacher=skillship_teacher, school=school_a, date=datetime.date(2026, 6, 23),
        subject="Mine", description="x",
    )
    DailyTeachingLog.objects.create(
        teacher=other, school=school_a, date=datetime.date(2026, 6, 23),
        subject="Theirs", description="y",
    )
    login(api_client, skillship_teacher)
    res = api_client.get(LOGS, HTTP_X_SCHOOL_CONTEXT=str(school_a.id))
    assert res.status_code == 200
    rows = res.data["results"] if isinstance(res.data, dict) else res.data
    subjects = {r["subject"] for r in rows}
    assert subjects == {"Mine"}


def test_logs_do_not_leak_across_schools(
    api_client, skillship_teacher, school_a, school_b, login
):
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_b, is_active=True)
    DailyTeachingLog.objects.create(
        teacher=skillship_teacher, school=school_a, date=datetime.date(2026, 6, 23),
        subject="A-subject", description="x",
    )
    DailyTeachingLog.objects.create(
        teacher=skillship_teacher, school=school_b, date=datetime.date(2026, 6, 23),
        subject="B-subject", description="y",
    )
    login(api_client, skillship_teacher)
    # Acting in school_a → only school_a's log, even though both are the teacher's.
    res = api_client.get(LOGS, HTTP_X_SCHOOL_CONTEXT=str(school_a.id))
    rows = res.data["results"] if isinstance(res.data, dict) else res.data
    assert {r["subject"] for r in rows} == {"A-subject"}


# ── MAIN_ADMIN view ───────────────────────────────────────────────────────────


def test_main_admin_sees_all_logs_and_filters(
    api_client, main_admin, skillship_teacher, school_a, school_b, login
):
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    DailyTeachingLog.objects.create(
        teacher=skillship_teacher, school=school_a, date=datetime.date(2026, 6, 23),
        subject="A", description="x",
    )
    DailyTeachingLog.objects.create(
        teacher=skillship_teacher, school=school_b, date=datetime.date(2026, 6, 22),
        subject="B", description="y",
    )
    login(api_client, main_admin)
    # Sees both schools' logs.
    res = api_client.get(LOGS)
    rows = res.data["results"] if isinstance(res.data, dict) else res.data
    assert {r["subject"] for r in rows} == {"A", "B"}
    # Filter by school.
    res = api_client.get(LOGS, {"school": str(school_b.id)})
    rows = res.data["results"] if isinstance(res.data, dict) else res.data
    assert {r["subject"] for r in rows} == {"B"}
    # Filter by date.
    res = api_client.get(LOGS, {"date": "2026-06-23"})
    rows = res.data["results"] if isinstance(res.data, dict) else res.data
    assert {r["subject"] for r in rows} == {"A"}
