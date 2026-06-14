"""
File:    backend/apps/accounts/models.py
Purpose: Custom User model — identity + role + school link.
Owner:   Prashant

Design:
- UUID pk (no sequential ID leaks).
- email is unique + required so we can log in by email.
- role determines dashboard routing and permissions.
- school FK is NULL for MAIN_ADMIN only (platform superuser).
- Two check constraints keep the role/school invariant at the DB level —
  no bug in Python can ever create a teacher without a school, or a
  MAIN_ADMIN bound to one school.
- Custom UserManager so `manage.py createsuperuser` produces a valid
  MAIN_ADMIN (otherwise the constraint above rejects the row).
"""

import uuid

from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.db import models


class UserManager(DjangoUserManager):
    """createsuperuser → MAIN_ADMIN with school=NULL, which our constraints allow."""

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.MAIN_ADMIN)
        extra_fields.setdefault("school", None)
        return self._create_user(username, email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        MAIN_ADMIN = "MAIN_ADMIN", "Main Admin"
        SUB_ADMIN = "SUB_ADMIN", "Sub Admin"
        PRINCIPAL = "PRINCIPAL", "Principal"
        TEACHER = "TEACHER", "Teacher"
        STUDENT = "STUDENT", "Student"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField("email address", unique=True)
    role = models.CharField(max_length=20, choices=Role.choices)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users",
    )
    phone = models.CharField(max_length=20, blank=True)
    admission_number = models.CharField(max_length=50, blank=True)

    # Per-user AI gate. MAIN_ADMIN can switch a specific teacher / student off so
    # they can no longer reach any AI feature (career pilot, quiz generation,
    # adaptive engine, content search). Default True so existing accounts keep
    # access. The effective gate is this AND the school's SchoolSettings.ai_enabled
    # — either being off blocks AI. Enforced by ai_bridge.permissions.CanUseAI.
    ai_enabled = models.BooleanField(default=True)

    # First-login profile lock. Accounts created blank (via bulk credential
    # generation) start False: the student fills in their own name / roll /
    # class exactly once on first login, after which this flips to True and
    # the student can never edit again — only MAIN_ADMIN can. Accounts that
    # arrive already-populated (admin-created, roster onboarding, or any row
    # predating this field — see migration 0003) are True from the start so
    # they are never sent to the first-login screen.
    profile_completed = models.BooleanField(default=False)

    # The teacher who manages this student, set by MAIN_ADMIN. This is the
    # source of truth for "this student's teacher" — direct and independent of
    # the class the student self-selects at first login (a teacher is assigned
    # before/regardless of class). Must be a TEACHER in the SAME school; that
    # invariant is enforced in the serializer / assign endpoint, not the DB.
    assigned_teacher = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_students",
        limit_choices_to={"role": "TEACHER"},
    )

    objects = UserManager()

    class Meta:
        constraints = [
            models.CheckConstraint(
                name="main_admin_no_school",
                condition=~models.Q(role="MAIN_ADMIN") | models.Q(school__isnull=True),
            ),
            models.CheckConstraint(
                name="non_admin_has_school",
                condition=models.Q(role="MAIN_ADMIN") | models.Q(school__isnull=False),
            ),
        ]

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"
