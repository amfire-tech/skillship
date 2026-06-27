"""
File:    backend/apps/assignments/tests/test_skillship.py
Purpose: Skillship-teacher feature + the multi-tenancy guarantees around it:
         a Skillship teacher only ever sees a school they're ACTIVELY assigned
         to (via the X-School-Context header), revoking cuts access, and a
         NORMAL teacher can never use the header to reach another school.
Owner:   Navanish
"""

from __future__ import annotations

import datetime

import pytest

from apps.academics.models import AcademicYear, Class
from apps.accounts.models import User
from apps.assignments.models import SkillshipAssignment
from apps.common.tenancy import resolve_school_id

pytestmark = pytest.mark.django_db

USERS = "/api/v1/users/"
SKILLSHIP = "/api/v1/assignments/skillship/"
CLASSES = "/api/v1/academics/classes/"
ROSTER = "/api/v1/users/roster/"


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture
def skillship_teacher(db, password):
    return User.objects.create_user(
        username="roamer", email="roamer@skillship.test", password=password,
        first_name="Roamer", last_name="Skillship",
        role=User.Role.TEACHER, teacher_type=User.TeacherType.SKILLSHIP, school=None,
    )


def _class(school, grade=10, section="A"):
    ay, _ = AcademicYear.objects.get_or_create(
        school=school, name="2026-27",
        defaults={"start_date": datetime.date(2026, 4, 1), "end_date": datetime.date(2027, 3, 31), "is_current": True},
    )
    return Class.objects.create(school=school, academic_year=ay, grade=grade, section=section)


class _Req:
    """Minimal stand-in for resolve_school_id (needs .user + .headers.get)."""
    def __init__(self, user, headers=None):
        self.user = user
        self.headers = headers or {}


# ── Teacher creation rules ────────────────────────────────────────────────────


def test_create_skillship_teacher_without_school(api_client, main_admin, login, password):
    login(api_client, main_admin)
    res = api_client.post(USERS, {
        "email": "ss1@x.test", "username": "ss1", "first_name": "S", "last_name": "S",
        "role": "TEACHER", "teacher_type": "SKILLSHIP", "password": password,
    }, format="json")
    assert res.status_code == 201, res.content
    u = User.objects.get(email="ss1@x.test")
    assert u.is_skillship_teacher and u.school_id is None


def test_create_school_teacher_requires_school(api_client, main_admin, login, password):
    login(api_client, main_admin)
    res = api_client.post(USERS, {
        "email": "sc1@x.test", "username": "sc1", "first_name": "S", "last_name": "C",
        "role": "TEACHER", "teacher_type": "SCHOOL", "password": password,
    }, format="json")
    assert res.status_code == 400
    assert "school" in res.data


def test_skillship_teacher_must_not_have_school(api_client, main_admin, school_a, login, password):
    login(api_client, main_admin)
    res = api_client.post(USERS, {
        "email": "ss2@x.test", "username": "ss2", "first_name": "S", "last_name": "S",
        "role": "TEACHER", "teacher_type": "SKILLSHIP", "school": str(school_a.id), "password": password,
    }, format="json")
    assert res.status_code == 400


# ── Assignment management (MAIN_ADMIN) ────────────────────────────────────────


def test_admin_creates_and_revokes_assignment(api_client, main_admin, skillship_teacher, school_a, login):
    login(api_client, main_admin)
    res = api_client.post(SKILLSHIP, {
        "teacher": str(skillship_teacher.id), "school": str(school_a.id),
        "weekdays": [0, 2], "specific_dates": ["2026-07-01"], "note": "Robotics",
    }, format="json")
    assert res.status_code == 201, res.content
    aid = res.data["id"]
    assert res.data["is_active"] is True

    res = api_client.post(f"{SKILLSHIP}{aid}/revoke/")
    assert res.status_code == 200
    assert res.data["is_active"] is False


def test_assignment_rejects_non_skillship_teacher(api_client, main_admin, teacher_a, school_a, login):
    login(api_client, main_admin)
    res = api_client.post(SKILLSHIP, {"teacher": str(teacher_a.id), "school": str(school_a.id)}, format="json")
    assert res.status_code == 400


def test_principal_cannot_manage_assignments(api_client, principal_a, skillship_teacher, school_a, login):
    login(api_client, principal_a)
    assert api_client.get(SKILLSHIP).status_code == 403


# ── resolve_school_id (the isolation core) ────────────────────────────────────


def test_resolve_normal_teacher_uses_own_school(teacher_a, school_a, school_b):
    # Header is IGNORED for a normal teacher — they can NEVER reach another school.
    req = _Req(teacher_a, {"X-School-Context": str(school_b.id)})
    assert resolve_school_id(req) == school_a.id


def test_resolve_skillship_requires_active_assignment(skillship_teacher, school_a, school_b):
    # No assignment yet → no access anywhere.
    assert resolve_school_id(_Req(skillship_teacher, {"X-School-Context": str(school_a.id)})) is None
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    # Assigned school resolves; un-assigned school does not.
    assert resolve_school_id(_Req(skillship_teacher, {"X-School-Context": str(school_a.id)})) == str(school_a.id)
    assert resolve_school_id(_Req(skillship_teacher, {"X-School-Context": str(school_b.id)})) is None
    # No header → None.
    assert resolve_school_id(_Req(skillship_teacher, {})) is None


def test_resolve_revoked_assignment_loses_access(skillship_teacher, school_a):
    a = SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    assert resolve_school_id(_Req(skillship_teacher, {"X-School-Context": str(school_a.id)})) == str(school_a.id)
    a.is_active = False
    a.save(update_fields=["is_active"])
    assert resolve_school_id(_Req(skillship_teacher, {"X-School-Context": str(school_a.id)})) is None


# ── End-to-end through a tenant-scoped endpoint ───────────────────────────────


def test_skillship_teacher_sees_only_assigned_school_classes(api_client, skillship_teacher, school_a, school_b, login):
    ca = _class(school_a)
    _class(school_b)
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    login(api_client, skillship_teacher)

    # With the assigned-school context → sees school_a's class only.
    res = api_client.get(CLASSES, HTTP_X_SCHOOL_CONTEXT=str(school_a.id))
    assert res.status_code == 200, res.content
    ids = [c["id"] for c in (res.data.get("results") or res.data)]
    assert str(ca.id) in ids
    assert len(ids) == 1

    # Context for a school they're NOT assigned to → blocked (no school context).
    res = api_client.get(CLASSES, HTTP_X_SCHOOL_CONTEXT=str(school_b.id))
    assert res.status_code == 403


def test_skillship_roster_does_not_leak_students_across_schools(
    api_client, skillship_teacher, school_a, school_b, login, password
):
    """Regression: a Skillship teacher assigned students in school_a must NOT see
    them while acting in school_b. The roster filters by assigned_teacher AND the
    X-School-Context school — never by assigned_teacher alone (that leaked every
    school's students into whichever school the teacher was 'working in')."""
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_b, is_active=True)
    student = User.objects.create_user(
        username="stud_a", email="stud_a@x.test", password=password,
        first_name="Stud", last_name="A",
        role=User.Role.STUDENT, school=school_a, assigned_teacher=skillship_teacher,
    )
    login(api_client, skillship_teacher)

    def _ids(res):
        body = res.data
        rows = body["results"] if isinstance(body, dict) and "results" in body else body
        return [r["id"] for r in rows]

    # Working in school_a → the assigned student shows up.
    res = api_client.get(ROSTER, HTTP_X_SCHOOL_CONTEXT=str(school_a.id))
    assert res.status_code == 200, res.content
    assert str(student.id) in _ids(res)

    # Working in school_b (no students there) → the school_a student must NOT leak.
    res = api_client.get(ROSTER, HTTP_X_SCHOOL_CONTEXT=str(school_b.id))
    assert res.status_code == 200, res.content
    assert _ids(res) == []


def test_normal_teacher_cannot_cross_schools_via_header(api_client, teacher_a, school_a, school_b, login):
    _class(school_a)
    cb = _class(school_b)
    login(api_client, teacher_a)
    # Even passing school_b's id, a normal teacher stays scoped to their own school.
    res = api_client.get(CLASSES, HTTP_X_SCHOOL_CONTEXT=str(school_b.id))
    assert res.status_code == 200
    ids = [c["id"] for c in (res.data.get("results") or res.data)]
    assert str(cb.id) not in ids


# ── Student assignment to a Skillship teacher ─────────────────────────────────


def test_student_assigned_to_skillship_teacher_requires_assignment(
    api_client, main_admin, student_a, skillship_teacher, school_a, login
):
    login(api_client, main_admin)
    url = f"{USERS}{student_a.id}/"
    # No assignment yet → rejected.
    res = api_client.patch(url, {"assigned_teacher": str(skillship_teacher.id)}, format="json")
    assert res.status_code == 400

    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    res = api_client.patch(url, {"assigned_teacher": str(skillship_teacher.id)}, format="json")
    assert res.status_code == 200, res.content
    student_a.refresh_from_db()
    assert student_a.assigned_teacher_id == skillship_teacher.id


def test_mine_lists_own_active_assignments(api_client, skillship_teacher, school_a, school_b, login):
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_b, is_active=False)
    login(api_client, skillship_teacher)
    res = api_client.get(f"{SKILLSHIP}mine/")
    assert res.status_code == 200, res.content
    school_ids = {row["school"] for row in res.data}
    assert str(school_a.id) in school_ids
    assert str(school_b.id) not in school_ids  # revoked → excluded


# ── Today's Teacher (PRINCIPAL) ───────────────────────────────────────────────


def test_today_lists_only_scheduled_for_principals_school(api_client, principal_a, skillship_teacher, school_a, school_b, login):
    import datetime as _dt

    today_weekday = _dt.date.today().weekday()
    SkillshipAssignment.objects.create(
        teacher=skillship_teacher, school=school_a, is_active=True,
        weekdays=[today_weekday], subject="Robotics",
    )
    # Scheduled at a DIFFERENT school today — must not leak into school_a's view.
    SkillshipAssignment.objects.create(
        teacher=skillship_teacher, school=school_b, is_active=True, weekdays=[today_weekday],
    )
    login(api_client, principal_a)
    res = api_client.get(f"{SKILLSHIP}today/")
    assert res.status_code == 200, res.content
    assert len(res.data) == 1
    row = res.data[0]
    assert row["teacher_id"] == str(skillship_teacher.id)
    assert row["subject"] == "Robotics"


def test_today_excludes_assignment_not_scheduled_today(api_client, principal_a, skillship_teacher, school_a, login):
    import datetime as _dt

    other_weekday = (_dt.date.today().weekday() + 1) % 7
    SkillshipAssignment.objects.create(
        teacher=skillship_teacher, school=school_a, is_active=True, weekdays=[other_weekday],
    )
    login(api_client, principal_a)
    res = api_client.get(f"{SKILLSHIP}today/")
    assert res.status_code == 200, res.content
    assert res.data == []


def test_today_forbidden_for_non_principal(api_client, skillship_teacher, login):
    login(api_client, skillship_teacher)
    res = api_client.get(f"{SKILLSHIP}today/")
    assert res.status_code == 403


def test_bulk_assign_students_to_skillship_teacher(api_client, main_admin, student_a, skillship_teacher, school_a, login):
    SkillshipAssignment.objects.create(teacher=skillship_teacher, school=school_a, is_active=True)
    login(api_client, main_admin)
    res = api_client.post(
        "/api/v1/users/assign-teacher/",
        {"teacher": str(skillship_teacher.id), "students": [str(student_a.id)]},
        format="json",
    )
    assert res.status_code in (200, 201, 204), res.content
    student_a.refresh_from_db()
    assert student_a.assigned_teacher_id == skillship_teacher.id
