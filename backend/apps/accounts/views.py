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
from .permissions import CanManageUsers
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
            return qs.filter(assigned_teacher_id=actor.id)
        if actor.role == Role.PRINCIPAL:
            return qs.filter(school_id=actor.school_id)
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
        """One aggregate query → {student_id: {avg, quizzes}} for the page.

        Computed straight from submitted quiz attempts so a student's marks show
        up the moment they finish a quiz (the analytics daily-rollup table is a
        separate, nightly concern and may lag / be empty).
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
        return {r["student_id"]: r for r in rows}

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

        if actor.role in (Role.PRINCIPAL, Role.SUB_ADMIN):
            return qs.filter(school_id=actor.school_id)
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

    permission_classes = [IsAuthenticated, CanManageUsers]
    lookup_field = "id"

    def get_queryset(self):
        # MAIN_ADMIN is the only role that reaches this surface (CanManageUsers
        # gates has_permission), so they see every user — optionally narrowed by
        # query params for the User Management screen: ?role=, ?school=<uuid>,
        # ?search=. select_related("school") keeps school_name cheap on the list.
        qs = User.objects.select_related("school").order_by("-date_joined")
        params = self.request.query_params

        role = params.get("role")
        if role:
            qs = qs.filter(role=role)

        school = params.get("school")
        if school:
            try:
                uuid.UUID(str(school))
            except (ValueError, TypeError):
                return qs.none()  # malformed school id → no matches, not a 500
            qs = qs.filter(school_id=school)

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

        serializer = OnboardClassSerializer(data=request.data)
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

        serializer = GenerateCredentialsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = onboarding.generate_blank_credentials(
            school=data["school"], count=data["count"],
        )
        code = status.HTTP_200_OK if result["error_count"] == 0 else status.HTTP_207_MULTI_STATUS
        return Response(result, status=code)

    # ── Bulk assign students to a teacher ────────────────────────────────────

    @action(detail=False, methods=["post"], url_path="assign-teacher")
    def assign_teacher(self, request):
        """
        POST /api/v1/users/assign-teacher/   (MAIN_ADMIN only)

        Body (JSON): {"teacher": "<uuid>|null", "students": ["<uuid>", ...]}

        Sets each student's assigned_teacher (null = unassign). The teacher and
        every student must belong to the same school (validated). The teacher
        then sees these students on their dashboard (GET /users/roster/).

        Response: {updated_count}
        """
        from .serializers import AssignTeacherSerializer

        serializer = AssignTeacherSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        teacher = serializer.validated_data["teacher"]
        students = serializer.validated_data["students"]
        updated = User.objects.filter(id__in=[s.id for s in students]).update(
            assigned_teacher=teacher
        )
        return Response({"updated_count": updated}, status=status.HTTP_200_OK)
