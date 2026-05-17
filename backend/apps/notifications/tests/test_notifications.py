"""
File:    backend/apps/notifications/tests/test_notifications.py
Purpose: NotificationViewSet — own-only scoping, mark-read, mark-all-read, unread-count, isolation.
Owner:   Navanish
"""

from __future__ import annotations

import pytest
from django.utils import timezone

from apps.notifications.models import Notification


def _make_notif(school, user, *, title: str = "ping", status: str = Notification.Status.PENDING):
    return Notification.objects.create(
        school=school,
        recipient=user,
        channel=Notification.Channel.IN_APP,
        title=title,
        body="...",
        status=status,
    )


LIST_URL = "/api/v1/notifications/"


@pytest.mark.django_db
class TestOwnScope:
    def test_anonymous_blocked(self, api_client):
        assert api_client.get(LIST_URL).status_code == 401

    def test_list_returns_only_my_notifications(
        self, api_client, login, school_a, student_a, teacher_a
    ):
        _make_notif(school_a, student_a, title="for-student")
        _make_notif(school_a, teacher_a, title="for-teacher")

        login(api_client, student_a)
        items = api_client.get(LIST_URL).json()["results"]
        titles = {n["title"] for n in items}
        assert titles == {"for-student"}

    def test_unread_count(self, api_client, login, school_a, student_a):
        _make_notif(school_a, student_a, status=Notification.Status.PENDING)
        _make_notif(school_a, student_a, status=Notification.Status.SENT)
        _make_notif(school_a, student_a, status=Notification.Status.READ)
        login(api_client, student_a)
        body = api_client.get(LIST_URL + "unread-count/").json()
        # READ status is the only excluded one — PENDING + SENT both count.
        assert body["unread_count"] == 2


@pytest.mark.django_db
class TestMarkRead:
    def test_mark_one_as_read(self, api_client, login, school_a, student_a):
        n = _make_notif(school_a, student_a)
        login(api_client, student_a)
        r = api_client.post(f"{LIST_URL}{n.id}/mark-read/")
        assert r.status_code == 200
        n.refresh_from_db()
        assert n.status == Notification.Status.READ
        assert n.read_at is not None

    def test_mark_already_read_is_noop(self, api_client, login, school_a, student_a):
        n = _make_notif(school_a, student_a, status=Notification.Status.READ)
        n.read_at = timezone.now()
        n.save(update_fields=["read_at"])
        first_read_at = n.read_at

        login(api_client, student_a)
        r = api_client.post(f"{LIST_URL}{n.id}/mark-read/")
        assert r.status_code == 200
        n.refresh_from_db()
        # read_at must not be overwritten on the noop path.
        assert n.read_at == first_read_at

    def test_mark_all_read(self, api_client, login, school_a, student_a):
        for _ in range(3):
            _make_notif(school_a, student_a, status=Notification.Status.PENDING)
        _make_notif(school_a, student_a, status=Notification.Status.READ)

        login(api_client, student_a)
        r = api_client.post(f"{LIST_URL}mark-all-read/")
        assert r.status_code == 200
        assert r.json()["marked_read"] == 3
        assert Notification.objects.filter(
            recipient=student_a, status=Notification.Status.PENDING
        ).count() == 0


@pytest.mark.django_db
class TestTenantIsolation:
    def test_cannot_mark_other_users_notification(
        self, api_client, login, school_a, student_a, teacher_a
    ):
        """Student A must not be able to mark Teacher A's notification as read."""
        n = _make_notif(school_a, teacher_a)
        login(api_client, student_a)
        r = api_client.post(f"{LIST_URL}{n.id}/mark-read/")
        # get_queryset filters by recipient — 404 is correct (don't reveal existence).
        assert r.status_code == 404
        n.refresh_from_db()
        assert n.status == Notification.Status.PENDING

    def test_cannot_see_other_school_notifications(
        self, api_client, login, school_a, school_b, student_a, student_b
    ):
        _make_notif(school_a, student_a, title="A")
        _make_notif(school_b, student_b, title="B")

        login(api_client, student_b)
        items = api_client.get(LIST_URL).json()["results"]
        assert all(n["title"] != "A" for n in items)
