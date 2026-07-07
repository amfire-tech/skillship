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
           STUDENT *already enrolled in this class*, no second account is made —
           that student is simply (re)enrolled and reported as `existing`. This
           makes re-running the same roster safe and lets you append students
           to a class later. Dedupe is scoped to the class, not the school, so
           the same roll number in a different section is a different student
           and gets its own login (see `_class_prefix`).

Login format: `{grade}{section}{admission}@{school-slug}.skillship.in`
           e.g. roll 01 in Grade 10-A at "sunrise" -> 10a01@sunrise.skillship.in,
           while roll 01 in 10-B -> 10b01@sunrise.skillship.in. Distinct logins.
"""

from __future__ import annotations

import os
import re
import secrets
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from django.contrib.auth.hashers import get_hasher, make_password
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


def _class_prefix(klass: Class) -> str:
    """Login-safe grade+section tag for a class, e.g. Grade 10-A -> "10a".

    This is prepended to every student token so the same roll/admission number
    in different sections (or grades) yields a DISTINCT login. Without it,
    "roll 01 in 10-A" and "roll 01 in 10-B" would collide on the same email."""
    return re.sub(r"[^a-z0-9]+", "", f"{klass.grade}{klass.section}".lower())


def _token_from(admission: str, fallback_index: int, klass: Class) -> str:
    """A login-safe token, namespaced by the class (grade+section): the
    admission number if present (lowercased, only [a-z0-9]); otherwise a short
    unique fallback. The class prefix guarantees two sections sharing a roll
    number never generate the same email."""
    base = re.sub(r"[^a-z0-9]+", "", (admission or "").strip().lower())
    if not base:
        base = f"s{fallback_index:03d}{secrets.token_hex(2)}"
    return f"{_class_prefix(klass)}{base}"


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


def _bulk_initial_hash(raw: str) -> str:
    """Hash a freshly-generated password with a deliberately LIGHTER cost.

    Full-strength PBKDF2 (~870k iterations, hundreds of ms) is far too slow to
    run a few hundred times inline. These accounts are blank and unused until
    the student first logs in, so we store a reduced-iteration hash now and let
    Django upgrade it to the full default cost automatically on that first login
    (check_password() calls the User's setter when must_update() is True). The
    only window with a lighter hash is before the empty account is ever used.

    Only PBKDF2 (which exposes an `iterations` knob) is sped up; any other
    configured hasher (argon2 / bcrypt) falls back to full-strength make_password.
    """
    hasher = get_hasher("default")
    iterations = getattr(hasher, "iterations", None)
    if iterations:
        return hasher.encode(raw, hasher.salt(), iterations=max(10_000, iterations // 12))
    return make_password(raw)


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

    # Index students ALREADY ENROLLED IN THIS CLASS by admission number, so a
    # re-run of the same roster re-enrols instead of duplicating. Dedupe is
    # scoped to the class (not the whole school) on purpose: the same roll
    # number in another section is a DIFFERENT student and must get its own
    # account + login — see _class_prefix().
    existing_by_adm: dict[str, User] = {
        u.admission_number.strip().lower(): u
        for u in User.objects.filter(
            school=school, role=User.Role.STUDENT, enrollments__klass=klass,
        ).exclude(admission_number="").distinct()
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

            token = _token_from(adm, idx + 1, klass)
            email, username = _unique_login(school.slug, token)
            draft = User(
                username=username, email=email, first_name=first, last_name=last,
                role=User.Role.STUDENT, school=school, admission_number=adm, is_active=True,
                # Roster onboarding supplies the full profile up front, so these
                # accounts are already complete — they skip the first-login screen.
                profile_completed=True,
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


# Upper bound on a single generate request — a printed slip per student, so a
# few hundred per class is plenty. Stops a fat-fingered "100000" from spinning
# the DB. The serializer enforces the same ceiling for a clean 400.
MAX_GENERATE = 500


def generate_blank_credentials(
    *, school: School, count: int, role: str = User.Role.STUDENT,
) -> dict[str, Any]:
    """Create `count` blank accounts (STUDENT by default, or TEACHER) for
    `school` and return their plaintext logins ONCE so the caller can print
    credential slips.

    Unlike `onboard_class`, no names / roll numbers / class are known yet: the
    Super Admin just wants N ready-to-hand-out logins. Each account carries a
    random login token, no name, and `profile_completed=False` — the student
    fills in their own name / roll / class on first login (see
    CompleteProfileView), after which it locks. The DB only ever stores the
    password hash; the plaintext lives only in the returned payload.

    Uniqueness is school-wide, not just per batch: we load the school's existing
    logins once and dedupe new tokens against them (plus an in-batch set), so
    generating the next 500 never collides with the first 500.

    Tokens are short and sequential (s001, s002, ... / t001, t002, ... for
    teachers) rather than random, so a printed credential slip reads as
    "dps-demo.s001" / "s001@dps-demo.skillship.in" instead of an 8-char hex
    string — easy for an admin to hand out in order and for a student to
    remember and re-type. Any already-taken token (from an earlier batch, or
    a legacy random one) is simply skipped.

    Speed: full-strength PBKDF2 hashing is deliberately slow (~hundreds of ms
    each), so hashing a few hundred inline took a minute+. These accounts are
    blank and unused until the student logs in, so we hash the initial password
    with a lighter cost (see `_bulk_initial_hash`) — Django re-hashes it at full
    strength automatically on the student's first login — and run the batch in
    parallel + insert it in one bulk_create. A batch of 500 drops from ~80s to
    a few seconds.
    """
    count = max(0, min(int(count), MAX_GENERATE))
    if count == 0:
        return {
            "generated_count": 0, "error_count": 0,
            "school_name": school.name, "students": [], "errors": [],
        }

    is_teacher = role == User.Role.TEACHER
    # Teachers are staff and never use the student first-login profile flow, so
    # their account is "complete" from the start (the dashboard layout only
    # redirects STUDENTs with profile_completed=False). Students self-complete.
    profile_completed = is_teacher

    slug = school.slug
    email_suffix = f"@{slug}.{_LOGIN_DOMAIN_SUFFIX}"
    username_prefix = f"{slug}."

    # Load this school's existing logins ONCE so a fresh batch can never collide
    # with an earlier one. Lower-cased for case-insensitive comparison.
    taken_emails = {
        e.lower() for e in
        User.objects.filter(email__iendswith=email_suffix).values_list("email", flat=True)
    }
    taken_usernames = {
        u.lower() for u in
        User.objects.filter(username__istartswith=username_prefix).values_list("username", flat=True)
    }

    # Build `count` unique, unsaved accounts + their plaintext passwords.
    # Tokens are short + sequential (s001, s002, ... / t001, t002, ...) so the
    # printed slip is easy to read and remember, not a random hex string.
    role_tag = "t" if is_teacher else "s"
    drafts: list[User] = []
    plaintexts: list[str] = []
    seq = 1
    while len(drafts) < count:
        token = f"{role_tag}{seq:03d}"
        seq += 1
        email = f"{token}{email_suffix}"
        username = f"{username_prefix}{token}"
        if email.lower() in taken_emails or username.lower() in taken_usernames:
            continue
        taken_emails.add(email.lower())
        taken_usernames.add(username.lower())
        draft = User(
            username=username, email=email, role=role,
            school=school, is_active=True, profile_completed=profile_completed,
        )
        drafts.append(draft)
        plaintexts.append(_valid_password_for(draft))

    # Hash every initial password with a lighter cost (full strength is restored
    # automatically on first login), in parallel across cores.
    workers = min(32, os.cpu_count() or 4)
    with ThreadPoolExecutor(max_workers=workers) as pool:
        hashes = list(pool.map(_bulk_initial_hash, plaintexts))
    for draft, hashed in zip(drafts, hashes):
        draft.password = hashed

    # One bulk insert (in a transaction) instead of count× save + unique-check.
    with transaction.atomic():
        User.objects.bulk_create(drafts, batch_size=200)

    students = [
        {"index": i, "email": d.email, "username": d.username, "password": pw}
        for i, (d, pw) in enumerate(zip(drafts, plaintexts))
    ]
    return {
        "generated_count": len(students),
        "error_count": 0,
        "school_name": school.name,
        "students": students,
        "errors": [],
    }
