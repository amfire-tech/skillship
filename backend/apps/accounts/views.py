"""
File:    backend/apps/accounts/views.py
Purpose: Auth endpoints — login, refresh, logout, /me/.
Owner:   Prashant

Contract (matches frontend/src/app/api/auth/*/route.ts proxies):

  POST /api/v1/auth/login/     body: {email, password}
    → 200 {user, access}  + Set-Cookie: refresh=<jwt>; HttpOnly; Path=/api/v1/auth/

  POST /api/v1/auth/refresh/   cookie: refresh=<jwt>
    → 200 {access}  + rotated Set-Cookie: refresh=<jwt>
    → 401 if cookie missing / token invalid / blacklisted

  POST /api/v1/auth/logout/    cookie: refresh=<jwt>
    → 204  + Set-Cookie clearing the refresh cookie
      (always 204 — logging out with no cookie is still a clean "logged out")

  GET  /api/v1/auth/me/        Authorization: Bearer <access>
    → 200 UserSerializer

The refresh token NEVER appears in a response body — it only flows through
HttpOnly cookies. This is what keeps it safe from XSS.
"""

import uuid

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError as DRFValidationError
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.permissions import Role

from .models import User
from .permissions import CanManageUsers, CanManageUsersOrOnboard
from .serializers import (
    LoginSerializer,
    PasswordSetSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

REFRESH_COOKIE_NAME = "refresh"
REFRESH_COOKIE_PATH = "/api/v1/auth/"

# DRF coerces a 401 to 403 when the view has no auth scheme to advertise via
# the WWW-Authenticate header. Login/refresh accept credentials in the body
# (or cookie), not in Authorization, so they have no auth classes — but the
# *response* still wants to be 401 ("your credentials didn't work"), not 403
# ("you have no business here"). Declaring the scheme keeps DRF honest.
_BEARER_AUTH_HEADER = 'Bearer realm="api"'


def _set_refresh_cookie(response: Response, token: str) -> None:
    """Attach a rotated / freshly-issued refresh token as an HttpOnly cookie."""
    max_age = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        path=REFRESH_COOKIE_PATH,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)


class LoginView(APIView):
    authentication_classes: list = []
    permission_classes = [AllowAny]

    def get_authenticate_header(self, request):
        return _BEARER_AUTH_HEADER

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        access = serializer.validated_data["access"]
        refresh = serializer.validated_data["refresh"]

        response = Response(
            {"user": UserSerializer(user).data, "access": access},
            status=status.HTTP_200_OK,
        )
        _set_refresh_cookie(response, refresh)
        return response


class RefreshView(APIView):
    """Cookie-driven refresh. Reuses SimpleJWT's rotation + blacklist machinery.

    The token comes in via the HttpOnly cookie (never via body), and the rotated
    token goes out via Set-Cookie. The body only ever contains the new access token.
    """

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def get_authenticate_header(self, request):
        return _BEARER_AUTH_HEADER

    def post(self, request):
        refresh_value = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not refresh_value:
            return Response(
                {"code": "refresh_missing", "message": "Refresh token missing"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={"refresh": refresh_value})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(str(exc)) from exc

        access = serializer.validated_data["access"]
        rotated = serializer.validated_data.get("refresh", refresh_value)

        response = Response({"access": access}, status=status.HTTP_200_OK)
        _set_refresh_cookie(response, rotated)
        return response


class LogoutView(APIView):
    """Blacklist the refresh token (if present) and clear the cookie.

    Always returns 204. Logging out should never fail for the client — even if
    the cookie is missing or the token is already invalid, the user ends up
    logged out either way.
    """

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_value = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if refresh_value:
            try:
                RefreshToken(refresh_value).blacklist()
            except TokenError:
                pass

        response = Response(status=status.HTTP_204_NO_CONTENT)
        _clear_refresh_cookie(response)
        return response


class MeView(RetrieveAPIView):
    """Return the currently-authenticated user's profile."""

    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        # Flag this as the self-profile call so UserSerializer computes the
        # student dashboard stats (rank, class, certificates) — they are skipped
        # on the user list / login body to avoid per-row queries.
        return {**super().get_serializer_context(), "me": True}


class CompleteProfileView(APIView):
    """POST /api/v1/auth/complete-profile/ — a student's one-time first-login setup.

    A blank account (minted by generate-credentials) has no name / roll / class.
    The student fills those in here exactly ONCE: we set their name + roll, find
    or create the class (grade + section) in THEIR OWN school, enrol them, and
    flip profile_completed=True. After that the profile is locked — re-posting
    returns 403, and only MAIN_ADMIN can change it (via /api/v1/users/).

    The school is taken from request.user, never the body, so a student can
    never place themselves in another tenant.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.academics.models import Class, Enrollment

        from .serializers import CompleteProfileSerializer

        user = request.user
        if user.role != Role.STUDENT:
            return Response(
                {"detail": "Only students complete a first-login profile."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user.profile_completed:
            return Response(
                {"detail": "Your profile is already set and can only be changed by your school admin."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user.school_id is None:
            # A STUDENT always has a school (DB constraint), but guard anyway.
            return Response(
                {"detail": "Your account is not linked to a school yet — contact your admin."},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = CompleteProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            year = self._current_year(user.school_id)
            klass, _ = Class.objects.get_or_create(
                school_id=user.school_id,
                academic_year=year,
                grade=data["grade"],
                section=data["section"],
            )
            Enrollment.objects.get_or_create(
                school_id=user.school_id, student=user, klass=klass, course=None,
            )
            user.first_name = data["first_name"]
            user.last_name = data["last_name"]
            user.admission_number = data["admission_number"]
            user.profile_completed = True
            user.save(update_fields=[
                "first_name", "last_name", "admission_number", "profile_completed",
            ])

        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

    @staticmethod
    def _current_year(school_id):
        """The school's current AcademicYear — preferring is_current, else any
        existing, else a freshly-created one for the Indian (Apr–Mar) year."""
        from datetime import date

        from apps.academics.models import AcademicYear

        year = (
            AcademicYear.objects.filter(school_id=school_id, is_current=True).first()
            or AcademicYear.objects.filter(school_id=school_id).first()
        )
        if year is not None:
            return year

        today = date.today()
        start_year = today.year if today.month >= 4 else today.year - 1
        name = f"{start_year}-{str((start_year + 1) % 100).zfill(2)}"
        # get_or_create (not create) keyed on the year's unique (school, name)
        # so two students completing at the same time can't collide on it.
        year, _ = AcademicYear.objects.get_or_create(
            school_id=school_id,
            name=name,
            defaults={
                "start_date": date(start_year, 4, 1),
                "end_date": date(start_year + 1, 3, 31),
                "is_current": True,
            },
        )
        return year


class UpdateProfilePhotoView(APIView):
    """POST /api/v1/auth/profile-photo/ — the logged-in user sets/clears their
    own avatar (a base64 data-URL, same storage pattern as School.logo). Any
    authenticated role may call this; it matters most for Skillship (roaming)
    teachers, whose photo is how an unfamiliar school's principal recognises
    them on the "Today's Teacher" view, but it's not restricted to them.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .serializers import ProfilePhotoSerializer

        serializer = ProfilePhotoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.profile_photo = serializer.validated_data["photo"]
        user.save(update_fields=["profile_photo"])
        return Response(UserSerializer(user, context={"me": True}).data)


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password/ — the logged-in user changes their own
    password by proving the current one. Body: {current_password, new_password}.

    Self-service (any authenticated role); we verify the current password and run
    the new one through Django's validators. No email is involved — that matches
    the rest of the platform, which never does email-based resets.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .serializers import ChangePasswordSerializer

        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentRosterView(ListAPIView):
    """GET /api/v1/users/roster/ — the student roster, role-scoped.

    - TEACHER    → students assigned to them (assigned_teacher == self).
    - PRINCIPAL  → every student in their own school.
    - MAIN_ADMIN → all students, optional ?school= / ?teacher= / ?search=.
    - anyone else → 403.

    Each row carries the student's class (from their latest enrolment) + assigned
    teacher + best-effort avg_score / quizzes (from analytics.StudentDailyStats).
    Both the class and the stats are batched (a prefetch + one aggregate query)
    so the list stays free of N+1s. Paginated via StandardPagination.
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        from .serializers import StudentRosterSerializer
        return StudentRosterSerializer

    def get_queryset(self):
        from django.db.models import Prefetch

        from apps.academics.models import Enrollment

        actor = self.request.user
        qs = (
            User.objects.filter(role=User.Role.STUDENT)
            .select_related("assigned_teacher")
            .prefetch_related(
                Prefetch(
                    "enrollments",
                    queryset=Enrollment.objects.select_related("klass").order_by("-enrolled_on"),
                    to_attr="recent_enrollments",
                )
            )
            .order_by("first_name", "last_name", "email")
        )

        if actor.role == Role.TEACHER:
            # Scope to the school this teacher is acting in. For a normal teacher
            # that's their own school; for a Skillship (roaming) teacher it's the
            # active X-School-Context school they're assigned to. Without this a
            # Skillship teacher would see EVERY student assigned to them across
            # ALL schools — a cross-tenant leak (the one rule that can't break).
            from apps.common.tenancy import resolve_school_id

            school_id = resolve_school_id(self.request)
            if not school_id:
                return qs.none()
            return qs.filter(assigned_teacher_id=actor.id, school_id=school_id)
        if actor.role == Role.PRINCIPAL:
            return qs.filter(school_id=actor.school_id)
        if actor.role == Role.SUB_ADMIN:
            # Roaming sub-admin: students of the validated X-School-Context school
            # they're acting in (None → empty, never a cross-tenant leak).
            from apps.common.tenancy import resolve_school_id

            school_id = resolve_school_id(self.request)
            return qs.filter(school_id=school_id) if school_id else qs.none()
        if actor.role == Role.MAIN_ADMIN:
            params = self.request.query_params
            school = params.get("school")
            if school:
                try:
                    uuid.UUID(str(school))
                except (ValueError, TypeError):
                    return qs.none()
                qs = qs.filter(school_id=school)
            teacher = params.get("teacher")
            if teacher:
                try:
                    uuid.UUID(str(teacher))
                except (ValueError, TypeError):
                    return qs.none()
                qs = qs.filter(assigned_teacher_id=teacher)
            search = (params.get("search") or "").strip()
            if search:
                qs = qs.filter(
                    Q(first_name__icontains=search)
                    | Q(last_name__icontains=search)
                    | Q(email__icontains=search)
                    | Q(admission_number__icontains=search)
                )
            return qs

        raise PermissionDenied("Only teachers, principals, and the super admin can view the roster.")

    @staticmethod
    def _stats_for(student_ids):
        """Two queries → {student_id: {avg, quizzes, last, last_score, last_quiz_title}}.

        Computed straight from submitted quiz attempts so a student's marks show
        up the moment they finish a quiz (the analytics daily-rollup table is a
        separate, nightly concern and may lag / be empty).

        Besides the running average we also surface the *latest* submitted
        attempt's score + quiz title, so the teacher's roster shows "latest exam
        and marks" next to the average — the full leaderboard at a glance.
        """
        from django.db.models import Avg, Count, Max

        from apps.quizzes.models import QuizAttempt

        rows = (
            QuizAttempt.objects.filter(
                student_id__in=student_ids,
                status=QuizAttempt.Status.SUBMITTED,
            )
            .values("student_id")
            .annotate(avg=Avg("score_percent"), quizzes=Count("id"), last=Max("submitted_at"))
        )
        stats = {r["student_id"]: r for r in rows}

        # Most-recent submitted attempt per student → its score + quiz title.
        # DISTINCT ON (PostgreSQL) keeps this to one query; select_related avoids
        # an N+1 on quiz.title. The leftmost ORDER BY must match the distinct col.
        latest = (
            QuizAttempt.objects.filter(
                student_id__in=student_ids,
                status=QuizAttempt.Status.SUBMITTED,
            )
            .select_related("quiz")
            .order_by("student_id", "-submitted_at")
            .distinct("student_id")
        )
        for a in latest:
            row = stats.get(a.student_id)
            if row is not None:
                row["last_score"] = a.score_percent
                row["last_quiz_title"] = a.quiz.title if a.quiz_id else None
        return stats

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        rows = page if page is not None else list(queryset)
        context = {**self.get_serializer_context(), "stats": self._stats_for([s.id for s in rows])}
        serializer = self.get_serializer(rows, many=True, context=context)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)


class TeacherDirectoryView(ListAPIView):
    """GET /api/v1/users/teachers/ — read-only teacher directory, role-scoped.

    - PRINCIPAL / SUB_ADMIN → teachers in their own school.
    - MAIN_ADMIN            → all teachers, optional ?school= / ?search=.
    - anyone else           → 403.

    Read-only by design: creating/editing teacher accounts stays on the
    MAIN_ADMIN-only /users/ surface (see permissions.CanManageUsers). This view
    only lets a principal SEE the teachers in their own school (and how many
    students each one has), which is not a privilege-escalation risk.
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        from .serializers import TeacherDirectorySerializer
        return TeacherDirectorySerializer

    def get_queryset(self):
        from django.db.models import Count

        actor = self.request.user
        qs = (
            User.objects.filter(role=User.Role.TEACHER)
            .annotate(student_count=Count("assigned_students", distinct=True))
            .order_by("first_name", "last_name", "email")
        )

        if actor.role == Role.PRINCIPAL:
            return qs.filter(school_id=actor.school_id)
        if actor.role == Role.SUB_ADMIN:
            # Roaming sub-admin: scope to the validated X-School-Context school
            # they're currently acting in (None → no rows, never a leak).
            from apps.common.tenancy import resolve_school_id

            school_id = resolve_school_id(self.request)
            return qs.filter(school_id=school_id) if school_id else qs.none()
        if actor.role == Role.MAIN_ADMIN:
            params = self.request.query_params
            school = params.get("school")
            if school:
                try:
                    uuid.UUID(str(school))
                except (ValueError, TypeError):
                    return qs.none()
                qs = qs.filter(school_id=school)
            search = (params.get("search") or "").strip()
            if search:
                qs = qs.filter(
                    Q(first_name__icontains=search)
                    | Q(last_name__icontains=search)
                    | Q(email__icontains=search)
                )
            return qs

        raise PermissionDenied(
            "Only principals, sub-admins, and the super admin can view the teacher directory."
        )


# ── /api/v1/users/ — user management surface ────────────────────────────────


class UsersViewSet(ModelViewSet):
    """CRUD for User resources, plus a /set-password/ action.

    Surface lock:
        The entire /api/v1/users/ surface is MAIN_ADMIN-only via
        `CanManageUsers` (see apps/accounts/permissions.py). No other role —
        principal, sub-admin, teacher, student — can list, create, update, or
        delete user accounts. Only the platform super admin manages users, so
        only the super admin can change a student's locked profile.
    """

    permission_classes = [IsAuthenticated, CanManageUsersOrOnboard]
    lookup_field = "id"

    def _subadmin_school_or_403(self, capability: str):
        """For a SUB_ADMIN: the acting (X-School-Context) school id, requiring an
        active grant with `capability`. Returns None for MAIN_ADMIN (who targets
        a school via the request body). Raises 403 otherwise."""
        u = self.request.user
        if u.role == Role.MAIN_ADMIN:
            return None
        from apps.assignments.access import subadmin_can
        from apps.common.tenancy import require_school_id

        school_id = require_school_id(self.request)  # 403 if no active context
        if not subadmin_can(u, school_id, capability):
            raise PermissionDenied(
                f"You don't have {capability.replace('can_', '').replace('_', ' ')} "
                "access to your current school."
            )
        return school_id

    @staticmethod
    def _apply_filters(qs, params):
        """Apply the User Management screen's query filters (?role=, ?school=,
        ?activation=, ?assigned=, ?search=) to `qs`. Shared by the paginated list
        and the `student-ids` action so "select all matching" can never drift out
        of sync with what the list actually shows. Returns None on a malformed
        school id so callers can short-circuit to an empty result."""
        role = params.get("role")
        if role:
            qs = qs.filter(role=role)

        school = params.get("school")
        if school:
            try:
                uuid.UUID(str(school))
            except (ValueError, TypeError):
                return None  # malformed school id → caller returns no matches
            qs = qs.filter(school_id=school)

        # Activation filter (students): a "generated" account is one minted by
        # credential generation that the student has not yet activated via
        # first-login (profile_completed=False); "activated" = they completed it.
        activation = (params.get("activation") or "").lower()
        if activation == "activated":
            qs = qs.filter(profile_completed=True)
        elif activation in ("generated", "pending"):
            qs = qs.filter(profile_completed=False)

        # Assignment filter (students): with / without an assigned teacher.
        assigned = (params.get("assigned") or "").lower()
        if assigned in ("true", "1", "yes"):
            qs = qs.filter(assigned_teacher__isnull=False)
        elif assigned in ("false", "0", "no"):
            qs = qs.filter(assigned_teacher__isnull=True)

        search = (params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(username__icontains=search)
                | Q(admission_number__icontains=search)
            )
        return qs

    def get_queryset(self):
        # MAIN_ADMIN sees every user; a granted SUB_ADMIN sees only users in the
        # schools they hold an active grant for (their territory), then both are
        # narrowed by the same query params. select_related keeps school_name cheap.
        qs = User.objects.select_related("school").order_by("-date_joined")
        u = self.request.user
        if u.role == Role.SUB_ADMIN:
            from apps.assignments.access import active_school_ids

            qs = qs.filter(school_id__in=active_school_ids(u))
        filtered = self._apply_filters(qs, self.request.query_params)
        return qs.none() if filtered is None else filtered

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in {"update", "partial_update"}:
            return UserUpdateSerializer
        if self.action == "set_password":
            return PasswordSetSerializer
        return UserSerializer

    @action(detail=True, methods=["post"], url_path="set-password")
    def set_password(self, request, id=None):
        """Reset a user's password. Returns 204 on success.

        Body: {"password": "<new password>"}
        Permission: CanManageUsers (MAIN_ADMIN any; PRINCIPAL same-school).
        """
        target = self.get_object()  # invokes has_object_permission via DRF
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target.set_password(serializer.validated_data["password"])
        target.save(update_fields=["password"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Bulk CSV upload (Phase 4.5) ─────────────────────────────────────────

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-upload",
        parser_classes=[MultiPartParser, FormParser],
    )
    def bulk_upload(self, request):
        """
        POST /api/v1/users/bulk-upload/

        Multipart form with a `file` field.

        Required columns: `username, email, first_name, last_name, role, password`
        Optional: `admission_number`
        MAIN_ADMIN may include an optional `school` column (slug or UUID).
        PRINCIPAL uploads only land in their own school regardless of `school`.

        Role whitelist: STUDENT, TEACHER, SUB_ADMIN. MAIN_ADMIN and PRINCIPAL
        cannot be created via bulk upload — they have to be set up explicitly.

        Response: {total_rows, created, errors: [{row, message}]}
        """
        upload = request.FILES.get("file")
        if upload is None:
            raise DRFValidationError({"file": "CSV file is required."})
        if upload.size and upload.size > 5 * 1024 * 1024:
            raise DRFValidationError({"file": "CSV must be 5 MB or smaller."})

        try:
            text = upload.read().decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise DRFValidationError({"file": "CSV must be UTF-8 encoded."}) from exc

        from . import bulk as _bulk
        result = _bulk.import_users_csv(actor=request.user, csv_text=text)
        return Response(result)

    # ── Class onboarding (generate credentials + create + enrol) ────────────

    @action(detail=False, methods=["post"], url_path="onboard-class")
    def onboard_class(self, request):
        """
        POST /api/v1/users/onboard-class/   (MAIN_ADMIN only via CanManageUsers)

        Body (JSON):
            {
              "school": "<uuid>",
              "klass":  "<class uuid>",            # must belong to `school`
              "course_code": "AI-INTRO",            # optional
              "students": [
                {"first_name": "Aarav", "last_name": "Sharma", "admission_number": "23-1042"},
                {"first_name": "Diya",  "last_name": "Patel"}
              ]
            }

        For each student we generate a unique login (email + username
        namespaced under the school slug) and a readable password, create the
        STUDENT account (school-stamped), and enrol them into the class — one
        atomic transaction per student. Rows whose admission_number already
        exists in the school are re-enrolled, not duplicated.

        Response: {created_count, existing_count, error_count, students[], errors[]}
        The plaintext passwords appear ONCE here (the DB stores only the hash).
        """
        from . import onboarding
        from .serializers import OnboardClassSerializer

        # A sub-admin onboards only into the school they're acting in, and only
        # with can_onboard_students. Forcing `school` here means the serializer
        # also rejects a class from any other school.
        forced_school = self._subadmin_school_or_403("can_onboard_students")
        payload = request.data if forced_school is None else {**request.data, "school": str(forced_school)}

        serializer = OnboardClassSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = onboarding.onboard_class(
            school=data["school"],
            klass=data["klass"],
            course=data["course"],
            students=[dict(s) for s in data["students"]],
        )
        code = status.HTTP_200_OK if result["error_count"] == 0 else status.HTTP_207_MULTI_STATUS
        return Response(result, status=code)

    # ── Bulk credential generation (blank logins, no names) ─────────────────

    @action(detail=False, methods=["post"], url_path="generate-credentials")
    def generate_credentials(self, request):
        """
        POST /api/v1/users/generate-credentials/   (MAIN_ADMIN only)

        Body (JSON): {"school": "<uuid>", "count": 100}

        Mints `count` blank STUDENT accounts for the school — each with a unique
        login + readable password but NO name, roll number, or class yet. The
        Super Admin downloads the slips and hands one to each student, who fills
        in their own details on first login (then it locks).

        Response: {generated_count, error_count, school_name, students[], errors[]}
        The plaintext passwords appear ONCE here (the DB stores only the hash).
        """
        from . import onboarding
        from .serializers import GenerateCredentialsSerializer

        # Gate on the capability that matches the requested role: minting teacher
        # logins needs can_onboard_teachers; student logins need can_onboard_students.
        requested_role = request.data.get("role") or User.Role.STUDENT
        capability = (
            "can_onboard_teachers"
            if requested_role == User.Role.TEACHER
            else "can_onboard_students"
        )
        forced_school = self._subadmin_school_or_403(capability)
        payload = request.data if forced_school is None else {**request.data, "school": str(forced_school)}

        serializer = GenerateCredentialsSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = onboarding.generate_blank_credentials(
            school=data["school"], count=data["count"], role=data["role"],
        )
        code = status.HTTP_200_OK if result["error_count"] == 0 else status.HTTP_207_MULTI_STATUS
        return Response(result, status=code)

    # ── Student activation / assignment stats ────────────────────────────────

    @action(detail=False, methods=["get"], url_path="student-stats")
    def student_stats(self, request):
        """
        GET /api/v1/users/student-stats/?school=<uuid>   (MAIN_ADMIN only)

        Headline counts for the User Management → Students view so the super
        admin can see, at a glance, how many student accounts are still just
        GENERATED (credentials minted, not yet activated by first-login) vs
        ACTIVATED, and how many already have a teacher.

        Response: {total, activated, generated, assigned, unassigned}
        """
        from django.db.models import Count

        zeros = {"total": 0, "activated": 0, "generated": 0, "assigned": 0, "unassigned": 0}
        qs = User.objects.filter(role=User.Role.STUDENT)
        if request.user.role == Role.SUB_ADMIN:
            # Pinned to the school the sub-admin is acting in (active grant).
            from apps.common.tenancy import resolve_school_id

            acting = resolve_school_id(request)
            if not acting:
                return Response(zeros)
            qs = qs.filter(school_id=acting)
        else:
            school = request.query_params.get("school")
            if school:
                try:
                    uuid.UUID(str(school))
                except (ValueError, TypeError):
                    return Response(zeros)
                qs = qs.filter(school_id=school)

        agg = qs.aggregate(
            total=Count("id"),
            activated=Count("id", filter=Q(profile_completed=True)),
            assigned=Count("id", filter=Q(assigned_teacher__isnull=False)),
        )
        total = agg["total"] or 0
        activated = agg["activated"] or 0
        assigned = agg["assigned"] or 0
        return Response({
            "total": total,
            "activated": activated,
            "generated": total - activated,
            "assigned": assigned,
            "unassigned": total - assigned,
        })

    @action(detail=False, methods=["get"], url_path="student-ids")
    def student_ids(self, request):
        """
        GET /api/v1/users/student-ids/?school=&activation=&assigned=&search=

        Flat list of the student UUIDs matching the SAME filters as the list view
        — ids only, unpaginated — so the UI can offer "select all N matching"
        across pages without fetching every serialized row. MAIN_ADMIN only.

        Response: {"ids": ["<uuid>", ...], "count": N}
        """
        qs = User.objects.filter(role=User.Role.STUDENT)
        # Force the student role regardless of any ?role= in the params.
        params = request.query_params.copy()
        params["role"] = User.Role.STUDENT
        if request.user.role == Role.SUB_ADMIN:
            # Confine "select all matching" to the sub-admin's granted schools.
            from apps.assignments.access import active_school_ids

            qs = qs.filter(school_id__in=active_school_ids(request.user))
        filtered = self._apply_filters(qs, params)
        if filtered is None:
            return Response({"ids": [], "count": 0})
        ids = [str(i) for i in filtered.values_list("id", flat=True)]
        return Response({"ids": ids, "count": len(ids)})

    # ── Bulk assign students to a teacher ────────────────────────────────────

    @action(detail=False, methods=["post"], url_path="assign-teacher")
    def assign_teacher(self, request):
        """
        POST /api/v1/users/assign-teacher/   (MAIN_ADMIN only)

        Body (JSON): {"teacher": "<uuid>|null", "students": ["<uuid>", ...]}

        Sets each student's assigned_teacher (null = unassign). The teacher and
        every student must belong to the same school (validated). The teacher
        then sees these students on their dashboard (GET /users/roster/).

        Idempotent by design: assigned_teacher is a single FK, so re-submitting a
        student already assigned to this teacher can never create a duplicate or
        error — it is simply counted as `already_assigned` and skipped. Duplicate
        ids in the payload are de-duplicated. This makes "select the same student
        again with some new ones" safe: only the genuinely-new ones are written.

        Response: {requested, assigned_count, already_assigned, unassigned_count}
        """
        from .serializers import AssignTeacherSerializer

        serializer = AssignTeacherSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        teacher = serializer.validated_data["teacher"]
        # De-dupe ids so counts are honest even if the client sent a student twice.
        student_ids = {s.id for s in serializer.validated_data["students"]}

        # A sub-admin may only assign within the school they're acting in (and
        # only with can_onboard_students). The serializer already guarantees the
        # teacher and students share a school; we additionally pin it to theirs.
        if request.user.role == Role.SUB_ADMIN:
            acting = self._subadmin_school_or_403("can_onboard_students")
            students = serializer.validated_data["students"]
            out_of_scope = any(str(s.school_id) != str(acting) for s in students)
            if (teacher is not None and str(teacher.school_id) != str(acting)) or out_of_scope:
                raise PermissionDenied("Teacher and students must be in your current school.")

        if teacher is None:
            # Unassign — only the rows that currently HAVE a teacher are touched.
            unassigned = (
                User.objects.filter(id__in=student_ids, assigned_teacher__isnull=False)
                .update(assigned_teacher=None)
            )
            return Response(
                {
                    "requested": len(student_ids),
                    "assigned_count": 0,
                    "already_assigned": 0,
                    "unassigned_count": unassigned,
                },
                status=status.HTTP_200_OK,
            )

        # Already-on-this-teacher rows are left untouched (no duplicate / no error).
        already = User.objects.filter(
            id__in=student_ids, assigned_teacher_id=teacher.id
        ).count()
        newly = (
            User.objects.filter(id__in=student_ids)
            .exclude(assigned_teacher_id=teacher.id)
            .update(assigned_teacher=teacher)
        )
        return Response(
            {
                "requested": len(student_ids),
                "assigned_count": newly,
                "already_assigned": already,
                "unassigned_count": 0,
            },
            status=status.HTTP_200_OK,
        )
