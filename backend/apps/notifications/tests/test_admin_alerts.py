"""
File:    backend/apps/notifications/tests/test_admin_alerts.py
Purpose: Super-admin alert composer + Web Push subscription endpoints.
Owner:   Vishal
"""

from __future__ import annotations

import pytest

from apps.notifications.models import Notification, PushSubscription

pytestmark = pytest.mark.django_db

SEND = "/api/v1/notifications/admin/send/"
SUBSCRIBE = "/api/v1/notifications/push/subscribe/"
UNSUBSCRIBE = "/api/v1/notifications/push/unsubscribe/"
PUBLIC_KEY = "/api/v1/notifications/push/public-key/"


def _alerts_for(user):
    return Notification.objects.filter(recipient=user, channel=Notification.Channel.IN_APP)


def test_admin_alerts_principal_only(api_client, main_admin, school_a, principal_a, teacher_a, login):
    login(api_client, main_admin)
    res = api_client.post(
        SEND,
        {"school": str(school_a.id), "roles": ["PRINCIPAL"], "title": "Payment due", "body": "Please clear the invoice.", "category": "PAYMENT"},
        format="json",
    )
    assert res.status_code == 201, res.content
    assert res.data["sent"] == 1
    assert _alerts_for(principal_a).count() == 1
    assert _alerts_for(teacher_a).count() == 0
    notif = _alerts_for(principal_a).first()
    assert notif.title == "Payment due"
    assert notif.data_json["category"] == "PAYMENT"
    assert notif.status == Notification.Status.SENT


def test_admin_alerts_teachers(api_client, main_admin, school_a, principal_a, teacher_a, login):
    login(api_client, main_admin)
    res = api_client.post(
        SEND,
        {"school": str(school_a.id), "roles": ["TEACHER"], "title": "Guidance", "body": "Upload weekly plans."},
        format="json",
    )
    assert res.status_code == 201, res.content
    assert _alerts_for(teacher_a).count() == 1
    assert _alerts_for(principal_a).count() == 0


def test_admin_alert_is_school_scoped(api_client, main_admin, school_a, principal_a, principal_b, login):
    login(api_client, main_admin)
    api_client.post(
        SEND,
        {"school": str(school_a.id), "roles": ["PRINCIPAL"], "title": "Hi", "body": "Only school A."},
        format="json",
    )
    assert _alerts_for(principal_a).count() == 1
    assert _alerts_for(principal_b).count() == 0


def test_admin_alerts_students(api_client, main_admin, school_a, student_a, teacher_a, login):
    login(api_client, main_admin)
    res = api_client.post(
        SEND,
        {"school": str(school_a.id), "roles": ["STUDENT"], "title": "Holiday", "body": "School closed tomorrow."},
        format="json",
    )
    assert res.status_code == 201, res.content
    assert _alerts_for(student_a).count() == 1
    assert _alerts_for(teacher_a).count() == 0


def test_admin_alerts_subadmin_roaming(api_client, main_admin, school_a, login, password):
    """A roaming SUB_ADMIN (school=NULL) with an active grant for the school gets
    the alert, the notification is stamped with that school, and they see it on
    their own feed (the bell is recipient-scoped, not school-scoped)."""
    from apps.accounts.models import User
    from apps.assignments.models import SubAdminGrant

    sub = User.objects.create_user(
        username="sub1", email="sub1@x.test", password=password,
        role=User.Role.SUB_ADMIN, school=None,
    )
    SubAdminGrant.objects.create(subadmin=sub, school=school_a, is_active=True, can_manage_school=True)

    login(api_client, main_admin)
    res = api_client.post(
        SEND,
        {"school": str(school_a.id), "roles": ["SUB_ADMIN"], "title": "FYI", "body": "Territory update."},
        format="json",
    )
    assert res.status_code == 201, res.content
    assert res.data["sent"] == 1
    notif = _alerts_for(sub).first()
    assert notif is not None
    assert str(notif.school_id) == str(school_a.id)

    # The sub-admin (school=NULL) can read it on their own feed.
    sc = api_client.__class__()
    login(sc, sub)
    feed = sc.get("/api/v1/notifications/")
    titles = [n["title"] for n in (feed.data.get("results") or feed.data)]
    assert "FYI" in titles


def test_admin_alerts_teacher_includes_skillship(api_client, main_admin, school_a, login, password):
    """Targeting TEACHER also reaches Skillship (roaming) teachers actively
    assigned to the school, even though their own school is NULL."""
    from apps.accounts.models import User
    from apps.assignments.models import SkillshipAssignment

    roamer = User.objects.create_user(
        username="roam1", email="roam1@x.test", password=password,
        role=User.Role.TEACHER, teacher_type=User.TeacherType.SKILLSHIP, school=None,
    )
    SkillshipAssignment.objects.create(teacher=roamer, school=school_a, is_active=True)

    login(api_client, main_admin)
    res = api_client.post(
        SEND,
        {"school": str(school_a.id), "roles": ["TEACHER"], "title": "Plans", "body": "Send weekly plans."},
        format="json",
    )
    assert res.status_code == 201, res.content
    assert _alerts_for(roamer).count() == 1
    assert str(_alerts_for(roamer).first().school_id) == str(school_a.id)


def test_admin_alerts_teacher_types_school_only(api_client, main_admin, school_a, teacher_a, login, password):
    """teacher_types=["SCHOOL"] reaches school teachers but NOT roaming Skillship
    teachers assigned to the school."""
    from apps.accounts.models import User
    from apps.assignments.models import SkillshipAssignment

    roamer = User.objects.create_user(
        username="roam2", email="roam2@x.test", password=password,
        role=User.Role.TEACHER, teacher_type=User.TeacherType.SKILLSHIP, school=None,
    )
    SkillshipAssignment.objects.create(teacher=roamer, school=school_a, is_active=True)

    login(api_client, main_admin)
    res = api_client.post(
        SEND,
        {"school": str(school_a.id), "roles": ["TEACHER"], "teacher_types": ["SCHOOL"],
         "title": "School only", "body": "Hi school staff."},
        format="json",
    )
    assert res.status_code == 201, res.content
    assert _alerts_for(teacher_a).count() == 1
    assert _alerts_for(roamer).count() == 0


def test_admin_alerts_teacher_types_skillship_only(api_client, main_admin, school_a, teacher_a, login, password):
    """teacher_types=["SKILLSHIP"] reaches only the roaming teacher."""
    from apps.accounts.models import User
    from apps.assignments.models import SkillshipAssignment

    roamer = User.objects.create_user(
        username="roam3", email="roam3@x.test", password=password,
        role=User.Role.TEACHER, teacher_type=User.TeacherType.SKILLSHIP, school=None,
    )
    SkillshipAssignment.objects.create(teacher=roamer, school=school_a, is_active=True)

    login(api_client, main_admin)
    res = api_client.post(
        SEND,
        {"school": str(school_a.id), "roles": ["TEACHER"], "teacher_types": ["SKILLSHIP"],
         "title": "Roamers", "body": "Hi Skillship staff."},
        format="json",
    )
    assert res.status_code == 201, res.content
    assert _alerts_for(roamer).count() == 1
    assert _alerts_for(teacher_a).count() == 0


def test_admin_alerts_specific_subadmin(api_client, main_admin, school_a, login, password):
    """subadmin_id targets exactly one sub-admin, not every granted one."""
    from apps.accounts.models import User
    from apps.assignments.models import SubAdminGrant

    target = User.objects.create_user(
        username="subT", email="subt@x.test", password=password, role=User.Role.SUB_ADMIN, school=None,
    )
    other = User.objects.create_user(
        username="subO", email="subo@x.test", password=password, role=User.Role.SUB_ADMIN, school=None,
    )
    SubAdminGrant.objects.create(subadmin=target, school=school_a, is_active=True, can_manage_school=True)
    SubAdminGrant.objects.create(subadmin=other, school=school_a, is_active=True, can_manage_school=True)

    login(api_client, main_admin)
    res = api_client.post(
        SEND,
        {"school": str(school_a.id), "roles": ["SUB_ADMIN"], "subadmin_id": str(target.id),
         "title": "Just you", "body": "A word."},
        format="json",
    )
    assert res.status_code == 201, res.content
    assert res.data["sent"] == 1
    assert _alerts_for(target).count() == 1
    assert _alerts_for(other).count() == 0


def test_admin_alert_validation(api_client, main_admin, school_a, login):
    login(api_client, main_admin)
    res = api_client.post(SEND, {"school": str(school_a.id), "roles": [], "title": "x", "body": "y"}, format="json")
    assert res.status_code == 400
    assert "roles" in res.data


def test_non_admin_cannot_send(api_client, principal_a, school_a, login):
    login(api_client, principal_a)
    res = api_client.post(
        SEND, {"school": str(school_a.id), "roles": ["TEACHER"], "title": "x", "body": "y"}, format="json"
    )
    assert res.status_code == 403


def test_recipient_sees_alert_on_own_feed(api_client, main_admin, school_a, principal_a, login):
    login(api_client, main_admin)
    api_client.post(
        SEND, {"school": str(school_a.id), "roles": ["PRINCIPAL"], "title": "Ping", "body": "Check this."}, format="json"
    )
    # Principal lists their own notifications.
    pc = api_client.__class__()
    login(pc, principal_a)
    res = pc.get("/api/v1/notifications/")
    assert res.status_code == 200, res.content
    titles = [n["title"] for n in (res.data.get("results") or res.data)]
    assert "Ping" in titles


# ── Web Push subscription ─────────────────────────────────────────────────────


def test_push_public_key(api_client, principal_a, login, settings):
    settings.VAPID_PUBLIC_KEY = "TEST_PUB_KEY"
    login(api_client, principal_a)
    res = api_client.get(PUBLIC_KEY)
    assert res.status_code == 200
    assert res.data["public_key"] == "TEST_PUB_KEY"


def test_push_subscribe_and_unsubscribe(api_client, principal_a, login):
    login(api_client, principal_a)
    sub = {"endpoint": "https://push.example/abc", "keys": {"p256dh": "k1", "auth": "k2"}}
    res = api_client.post(SUBSCRIBE, sub, format="json")
    assert res.status_code == 201, res.content
    assert PushSubscription.objects.filter(user=principal_a, endpoint=sub["endpoint"]).exists()

    # Idempotent: posting the same endpoint again updates, doesn't duplicate.
    api_client.post(SUBSCRIBE, sub, format="json")
    assert PushSubscription.objects.filter(endpoint=sub["endpoint"]).count() == 1

    res = api_client.post(UNSUBSCRIBE, {"endpoint": sub["endpoint"]}, format="json")
    assert res.status_code == 200
    assert not PushSubscription.objects.filter(endpoint=sub["endpoint"]).exists()


def test_push_subscribe_rejects_incomplete(api_client, principal_a, login):
    login(api_client, principal_a)
    res = api_client.post(SUBSCRIBE, {"endpoint": "https://push.example/x"}, format="json")
    assert res.status_code == 400
