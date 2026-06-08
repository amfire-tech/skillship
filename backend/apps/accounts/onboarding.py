"""
File:    backend/apps/accounts/onboarding.py
Purpose: One-shot class onboarding for MAIN_ADMIN. For a chosen school + class,
         generate login credentials, create STUDENT accounts, and enrol them
         into the class — atomically PER student (one bad row never poisons the
         rest). Returns the generated credentials ONCE in plaintext so the
         caller can print/hand out login slips; the database only ever stores
         the password hash.
Owner:   Navanish

Isolation: every account and enrolment is stamped with the passed `school`
           (a School instance the view already validated). The class is checked
           to belong to that school before any row is touched, so a class from
           another tenant can never be targeted.

Idempotency: when a row carries an `admission_number` that already maps to a
           STUDENT in this school, no second account is made — that student is
           simply (re)enrolled into the class and reported as `existing`. This
           makes re-running the same roster safe and lets you append students
           to a class later.
"""

from __future__ import annotations

import re
import secrets
from typing import Any

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q

from apps.academics.models import Class, Course, Enrollment
from apps.schools.models import School

from .models import User

# Login identifiers are namespaced under the school slug at this suffix. These
# are NOT real mailboxes — no email is ever delivered to them; they exist only
# as a unique, human-typable login id. Password resets are done by the admin
# via the /users/{id}/set-password/ action, never by email.
_LOGIN_DOMAIN_SUFFIX = "skillship.in"

# Easy-to-read words for generated passwords. Deliberately plain so they can be
# read aloud to a classroom. Combined with 4 digits → >= 8 chars, mixed
# letters+digits, which clears Django's MinimumLength/Numeric/Common validators.
_WORDS = (
    "Tiger", "Falcon", "Comet", "Maple", "River", "Orbit", "Pixel", "Mango",
    "Cobra", "Lotus", "Delta", "Nova", "Quartz", "Zephyr", "Ember", "Lunar",
    "Cedar", "Otter", "Vivid", "Sonic", "Raven", "Coral", "Aspen", "Indigo",
)


def _token_from(admission: str, fallback_index: int) -> str:
    """A login-safe token: the admission number if present (lowercased, only
    [a-z0-9]); otherwise a short unique fallback so emails never collide."""
    base = re.sub(r"[^a-z0-9]+", "", (admission or "").strip().lower())
    if not base:
        base = f"s{fallback_index:03d}{secrets.token_hex(2)}"
    return base


def _gen_password() -> str:
    return f"{secrets.choice(_WORDS)}{secrets.randbelow(9000) + 1000}"


def _unique_login(slug: str, token: str) -> tuple[str, str]:
    """Return (email, username) unique across ALL users, suffixing on a clash."""
    for n in range(50):
        suffix = "" if n == 0 else f"-{n + 1}"
        username = f"{slug}.{token}{suffix}"
        email = f"{token}{suffix}@{slug}.{_LOGIN_DOMAIN_SUFFIX}"
        if not User.objects.filter(Q(username__iexact=username) | Q(email__iexact=email)).exists():
            return email, username
    raise ValueError("could not generate a unique login (too many clashes)")


def _ensure_enrollment(school: School, student: User, klass: Class, course: Course | None) -> None:
    """Idempotent enrolment of a student into a class (optionally a course)."""
    Enrollment.objects.get_or_create(
        school=school, student=student, klass=klass, course=course,
    )


def _valid_password_for(user: User) -> str:
    """A generated password that passes the project's AUTH_PASSWORD_VALIDATORS
    for this specific user (so it can never be similar to their name/login)."""
    for _ in range(8):
        candidate = _gen_password()
        try:
            validate_password(candidate, user=user)
            return candidate
        except DjangoValidationError:
            continue
    # Extremely unlikely; fall back to a longer random token.
    return f"{secrets.choice(_WORDS)}{secrets.token_hex(3)}"


def onboard_class(
    *,
    school: School,
    klass: Class,
    course: Course | None,
    students: list[dict[str, Any]],
) -> dict[str, Any]:
    """Create + enrol a roster of students into a class. See module docstring."""
    results: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    created = existing = 0

    # Index this school's existing students by admission number for dedupe.
    existing_by_adm: dict[str, User] = {
        u.admission_number.strip().lower(): u
        for u in User.objects.filter(school=school, role=User.Role.STUDENT).exclude(admission_number="")
    }

    for idx, row in enumerate(students):
        first = (row.get("first_name") or "").strip()
        last = (row.get("last_name") or "").strip()
        adm = (row.get("admission_number") or "").strip()
        name = f"{first} {last}".strip()

        if not first:
            errors.append({"index": idx, "name": name, "error": "first_name is required"})
            continue

        try:
            existing_user = existing_by_adm.get(adm.lower()) if adm else None
            if existing_user is not None:
                # Already onboarded — just make sure they're in this class.
                _ensure_enrollment(school, existing_user, klass, course)
                results.append({
                    "index": idx, "name": name, "admission_number": adm,
                    "email": existing_user.email, "username": existing_user.username,
                    "password": None, "status": "existing", "enrolled": True,
                })
                existing += 1
                continue

            token = _token_from(adm, idx + 1)
            email, username = _unique_login(school.slug, token)
            draft = User(
                username=username, email=email, first_name=first, last_name=last,
                role=User.Role.STUDENT, school=school, admission_number=adm, is_active=True,
            )
            password = _valid_password_for(draft)

            with transaction.atomic():
                draft.set_password(password)
                draft.full_clean(exclude=["password"])
                draft.save()
                _ensure_enrollment(school, draft, klass, course)

            if adm:
                existing_by_adm[adm.lower()] = draft
            results.append({
                "index": idx, "name": name, "admission_number": adm,
                "email": email, "username": username, "password": password,
                "status": "created", "enrolled": True,
            })
            created += 1
        except (ValueError, IntegrityError, DjangoValidationError) as exc:
            errors.append({"index": idx, "name": name, "error": str(exc)})

    return {
        "created_count": created,
        "existing_count": existing,
        "error_count": len(errors),
        "students": results,
        "errors": errors,
    }
