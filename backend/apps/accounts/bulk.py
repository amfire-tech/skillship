"""
File:    backend/apps/accounts/bulk.py
Purpose: CSV bulk-import for users. Called only from UsersViewSet.bulk_upload.
Owner:   Navanish

Design:
  - One row → one User. Failures reported per-row; valid rows still commit.
  - Role gate: PRINCIPAL can only create STUDENT / TEACHER in their school.
                MAIN_ADMIN can create STUDENT / TEACHER / SUB_ADMIN in any school.
                PRINCIPAL / MAIN_ADMIN rows are never accepted via this surface.
  - Each created row pegs `is_active=True`. Passwords are hashed via set_password.

Returns: {total_rows, created, errors: [{row, message}]}
"""

from __future__ import annotations

import csv as _csv
import io as _io
from typing import Any

from django.db import IntegrityError, transaction

from apps.common.permissions import Role
from apps.schools.models import School

from .models import User


_REQUIRED_COLUMNS = ("username", "email", "first_name", "last_name", "role", "password")
_ALLOWED_ROLES_BULK = {Role.STUDENT, Role.TEACHER, Role.SUB_ADMIN}


def import_users_csv(*, actor: User, csv_text: str) -> dict[str, Any]:
    reader = _csv.DictReader(_io.StringIO(csv_text))
    if reader.fieldnames is None:
        return {"total_rows": 0, "created": 0, "errors": [{"row": 0, "message": "CSV is empty."}]}

    missing = [c for c in _REQUIRED_COLUMNS if c not in reader.fieldnames]
    if missing:
        return {
            "total_rows": 0, "created": 0,
            "errors": [{"row": 0, "message": f"Missing required columns: {', '.join(missing)}"}],
        }

    created = 0
    errors: list[dict] = []
    total = 0

    for row_idx, row in enumerate(reader, start=2):
        total += 1
        try:
            _create_user_from_row(actor=actor, row=row)
            created += 1
        except (ValueError, IntegrityError) as exc:
            errors.append({"row": row_idx, "message": str(exc)})

    return {"total_rows": total, "created": created, "errors": errors}


def _create_user_from_row(*, actor: User, row: dict) -> User:
    username = (row.get("username") or "").strip()
    email = (row.get("email") or "").strip().lower()
    first_name = (row.get("first_name") or "").strip()
    last_name = (row.get("last_name") or "").strip()
    role_raw = (row.get("role") or "").strip().upper()
    password = row.get("password") or ""
    admission_number = (row.get("admission_number") or "").strip()
    school_raw = (row.get("school") or "").strip()

    if not username:
        raise ValueError("`username` is required.")
    if not email:
        raise ValueError("`email` is required.")
    if not password or len(password) < 6:
        raise ValueError("`password` must be at least 6 characters.")
    if role_raw not in _ALLOWED_ROLES_BULK:
        raise ValueError(
            f"`role` must be one of STUDENT / TEACHER / SUB_ADMIN (got {role_raw!r})."
        )

    # Resolve target school per actor role.
    if actor.role == Role.MAIN_ADMIN:
        if not school_raw:
            raise ValueError("MAIN_ADMIN must provide `school` (slug or UUID) in each row.")
        school = _resolve_school(school_raw)
    else:
        # PRINCIPAL — ignore any school cell, lock to actor's school.
        if actor.school_id is None:
            raise ValueError("Caller has no school — cannot create scoped users.")
        school = School.objects.get(pk=actor.school_id)

    with transaction.atomic():
        u = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role_raw,
            school=school,
            admission_number=admission_number,
            is_active=True,
        )
        u.set_password(password)
        u.full_clean(exclude=["password"])
        u.save()
        return u


def _resolve_school(value: str) -> School:
    # Try UUID first, then slug.
    school = School.objects.filter(id=value).first() if len(value) > 30 else None
    if school is None:
        school = School.objects.filter(slug=value).first()
    if school is None:
        raise ValueError(f"School {value!r} not found.")
    return school
