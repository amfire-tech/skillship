"""
File:    backend/apps/assignments/models.py
Purpose: SkillshipAssignment — links a Skillship (roaming) teacher to a school
         (and optionally a specific class) so they can teach there, plus the
         visit schedule (days). The assignment IS the access grant: while
         is_active, the teacher works in that school like a normal teacher;
         MAIN_ADMIN can revoke (is_active=False) at any time to pull access.
Owner:   Navanish

Why this is the access boundary (multi-tenancy):
    A Skillship teacher has school=NULL. They never see a school's data unless
    an ACTIVE assignment grants it, and even then they act in ONE school at a
    time (resolved from the X-School-Context request header, validated against
    these rows). See apps.common.tenancy.resolve_school_id.
"""

from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models

from apps.common.models import TenantModel, TimeStampedModel


class SkillshipAssignment(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="skillship_assignments",
        limit_choices_to={"role": "TEACHER", "teacher_type": "SKILLSHIP"},
    )
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="skillship_assignments",
    )
    # Optional: a specific class the teacher takes at that school. Null = the
    # teacher is assigned to the school broadly (super-admin can narrow later).
    klass = models.ForeignKey(
        "academics.Class",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="skillship_assignments",
    )
    # The access switch. Revoke = set False; the teacher instantly loses access.
    is_active = models.BooleanField(default=True)

    # Visit schedule (informational — access is NOT gated on these dates).
    date_from = models.DateField(null=True, blank=True)
    date_to = models.DateField(null=True, blank=True)
    # Recurring weekdays as ints, Mon=0 … Sun=6 (matches Python's weekday()).
    weekdays = models.JSONField(default=list, blank=True)
    # Ad-hoc specific dates as ISO strings, e.g. ["2026-06-24", "2026-06-26"].
    specific_dates = models.JSONField(default=list, blank=True)
    # The subject this teacher takes for this assignment (e.g. "Robotics") —
    # shown to the school's principal on the "Today's Teacher" view alongside
    # the class. Free text since Skillship subjects aren't tied to the
    # school's own Course catalogue.
    subject = models.CharField(max_length=120, blank=True)
    note = models.CharField(max_length=255, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="skillship_assignments_created",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["teacher", "is_active"]),
            models.Index(fields=["school", "is_active"]),
        ]

    def __str__(self):
        state = "active" if self.is_active else "revoked"
        return f"{self.teacher_id} → {self.school_id} ({state})"


class DailyTeachingLog(TenantModel):
    """A Skillship (roaming) teacher's daily record of what they taught at a
    school. After each visit the teacher logs {date, subject, description}; the
    super-admin reads these to see what every roaming teacher actually did, in
    which school, on which day.

    Tenant-scoped (TenantModel → school FK + UUID pk): the row is stamped with
    the school the teacher was acting in (X-School-Context, via
    require_school_id), so the super-admin sees each log against its school and
    the multi-tenancy rule still holds. Only SKILLSHIP teachers create these —
    a normal school teacher has no daily-log surface (enforced in the viewset).
    """

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="daily_teaching_logs",
        limit_choices_to={"role": "TEACHER", "teacher_type": "SKILLSHIP"},
    )
    # The day the teaching happened (teacher-pickable, defaults to today on the
    # client). Not unique — a teacher may take several subjects the same day.
    date = models.DateField()
    subject = models.CharField(max_length=120)
    description = models.TextField()

    # Optional attendance proof: a geo-stamped photo (base64 data-URL, same
    # storage pattern as School.logo — kept out of list responses for weight)
    # plus the GPS coordinates the browser reported when it was taken. Lets the
    # super-admin confirm the teacher was physically at the school.
    photo = models.TextField(blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        ordering = ["-date", "-created_at"]
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=["teacher", "date"]),
        ]

    def __str__(self):
        return f"{self.teacher_id} · {self.date} · {self.subject}"


class SubAdminGrant(TimeStampedModel):
    """Per-school capability grant for a SUB_ADMIN — the access boundary for a
    roaming sub-admin, exactly mirroring SkillshipAssignment for teachers.

    A sub-admin has school=NULL and sees NOTHING until an ACTIVE grant gives it.
    Within a granted school they act like a scoped-down super-admin, but only
    for the capabilities switched on here. They act in ONE school per request,
    resolved from the X-School-Context header and validated against these rows
    (see apps.common.tenancy.resolve_school_id). MAIN_ADMIN owns these grants;
    setting is_active=False (or unchecking a capability) pulls access on the
    very next request. Capabilities are deliberately granular + per-school so the
    super-admin can, e.g., delegate quiz approval in one school and student
    onboarding in another.
    """

    # The grantable capabilities, as (field_name) — kept here so callers and
    # the resolver share one vocabulary instead of stringly-typed literals.
    CAPABILITIES = (
        "can_manage_school",
        "can_onboard_students",
        "can_onboard_teachers",
        "can_approve_quizzes",
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subadmin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subadmin_grants",
        limit_choices_to={"role": "SUB_ADMIN"},
    )
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="subadmin_grants",
    )

    # Per-school capability switches. All default False — a fresh grant gives no
    # power until the super-admin turns something on.
    can_manage_school = models.BooleanField(default=False)
    can_onboard_students = models.BooleanField(default=False)
    can_onboard_teachers = models.BooleanField(default=False)
    can_approve_quizzes = models.BooleanField(default=False)

    # The access switch. Revoke = set False; the sub-admin instantly loses the
    # whole school (not just one capability) on their next request.
    is_active = models.BooleanField(default=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subadmin_grants_created",
    )

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["subadmin", "school"], name="uniq_subadmin_school_grant"
            ),
        ]
        indexes = [
            models.Index(fields=["subadmin", "is_active"]),
            models.Index(fields=["school", "is_active"]),
        ]

    def __str__(self):
        state = "active" if self.is_active else "revoked"
        return f"sub-admin {self.subadmin_id} → {self.school_id} ({state})"
