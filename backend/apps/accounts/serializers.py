"""
File:    backend/apps/accounts/serializers.py
Purpose: DRF serializers for auth + user profile.
Owner:   Prashant

Public types here must match the frontend `User` and `AuthResponse` types in
frontend/src/types/index.ts. If you change a field name or shape, run
`npm run gen:types` in the frontend to regenerate the OpenAPI types.
"""

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed

from rest_framework_simplejwt.tokens import RefreshToken

from apps.academics.models import Class, Course, Enrollment
from apps.common.permissions import Role
from apps.schools.models import School

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Safe, read-centric user shape returned from /auth/me/ and the login body."""

    # Coerce the FK PK (a UUID) to its hyphenated string form so the
    # response shape matches the frontend `User.school: string | null` type.
    school = serializers.PrimaryKeyRelatedField(
        read_only=True,
        pk_field=serializers.UUIDField(),
    )
    school_name = serializers.SerializerMethodField()
    current_class = serializers.SerializerMethodField()
    assigned_teacher = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.UUIDField()
    )
    assigned_teacher_name = serializers.SerializerMethodField()
    # Student dashboard hero fields — only populated on /auth/me/ (context["me"]),
    # never on the paginated user list / login body, so they cost no extra
    # queries on the hot paths.
    class_name = serializers.SerializerMethodField()
    roll_number = serializers.SerializerMethodField()
    rank_in_class = serializers.SerializerMethodField()
    class_size = serializers.SerializerMethodField()
    certificates_count = serializers.SerializerMethodField()

    def get_school_name(self, obj):
        return obj.school.name if obj.school_id else None

    def get_assigned_teacher_name(self, obj):
        t = obj.assigned_teacher
        return (t.get_full_name() or t.username) if t else None

    def _is_me_student(self, obj):
        """True only when this is the authenticated student's own /auth/me/ —
        guards the dashboard stat queries so they never run on list/login."""
        return bool(self.context.get("me")) and obj.role == User.Role.STUDENT

    def _ensure_rank(self, obj):
        """Compute (rank, class_size) once per serialisation and cache it."""
        if not hasattr(self, "_rank_cache"):
            from apps.quizzes.services import rank_in_class
            self._rank_cache = rank_in_class(obj)
        return self._rank_cache

    def get_class_name(self, obj):
        if not self._is_me_student(obj):
            return None
        enr = (
            Enrollment.objects.filter(student=obj)
            .select_related("klass").order_by("-enrolled_on").first()
        )
        return f"Grade {enr.klass.grade}-{enr.klass.section}" if enr and enr.klass_id else None

    def get_roll_number(self, obj):
        return obj.admission_number or None if self._is_me_student(obj) else None

    def get_rank_in_class(self, obj):
        if not self._is_me_student(obj):
            return None
        return self._ensure_rank(obj)[0]

    def get_class_size(self, obj):
        if not self._is_me_student(obj):
            return None
        return self._ensure_rank(obj)[1]

    def get_certificates_count(self, obj):
        if not self._is_me_student(obj):
            return None
        from apps.quizzes.services import certificates_count
        return certificates_count(obj)

    def get_current_class(self, obj):
        """The student's class as "Grade 6-A", resolved from their latest
        enrolment. Computed ONLY on the single-user detail view so it never adds
        an N+1 to the (paginated) user list — list/login/me responses get None.
        """
        view = self.context.get("view")
        if obj.role != User.Role.STUDENT or getattr(view, "action", None) != "retrieve":
            return None
        enr = (
            Enrollment.objects.filter(student=obj)
            .select_related("klass").order_by("-enrolled_on").first()
        )
        return f"Grade {enr.klass.grade}-{enr.klass.section}" if enr else None

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "role",
            "school",
            "school_name",
            "phone",
            "admission_number",
            "current_class",
            "class_name",
            "roll_number",
            "rank_in_class",
            "class_size",
            "certificates_count",
            "assigned_teacher",
            "assigned_teacher_name",
            "profile_completed",
            "is_active",
            "date_joined",
        ]
        read_only_fields = [
            "id", "email", "username", "first_name", "last_name",
            "role", "school", "phone", "admission_number",
            "current_class", "class_name", "roll_number", "rank_in_class",
            "class_size", "certificates_count",
            "assigned_teacher", "assigned_teacher_name",
            "profile_completed", "is_active", "date_joined",
        ]


class LoginSerializer(serializers.Serializer):
    """Email + password (+ optional role) → validated user + issued token pair.

    We do the lookup + password check ourselves (rather than subclassing
    SimpleJWT's TokenObtainPairSerializer) because:
      - SimpleJWT keys on USERNAME_FIELD, which is "username" here.
      - We want email-based login without flipping USERNAME_FIELD globally
        (that would cascade into admin, management commands, and fixtures).

    Optional role gate:
      When the client sends a `role`, the authenticated user's actual role
      MUST match. Mismatch returns the same generic error as a bad password
      so we don't leak that the email + password were otherwise valid (a
      common auth-design rule — specific errors are an oracle for guessing).
      Clients that omit `role` get the original email/password-only flow.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    role = serializers.ChoiceField(
        choices=User.Role.choices,
        required=False,
        allow_blank=True,
    )

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        password = attrs["password"]
        requested_role = (attrs.get("role") or "").strip() or None

        user = User.objects.filter(email__iexact=email).first()
        if user is None or not user.check_password(password):
            raise AuthenticationFailed("Invalid email or password", code="invalid_credentials")
        if not user.is_active:
            raise AuthenticationFailed("Account is disabled", code="account_disabled")

        # Role gate — only applied when the client supplied one.
        if requested_role and user.role != requested_role:
            raise AuthenticationFailed(
                "Invalid email, password, or role",
                code="invalid_credentials",
            )

        refresh = RefreshToken.for_user(user)
        attrs["user"] = user
        attrs["access"] = str(refresh.access_token)
        attrs["refresh"] = str(refresh)
        return attrs


# ── User CRUD serializers (used by /api/v1/users/) ──────────────────────────


def _validate_role_school_invariant(role: str, school) -> None:
    """The same invariant the DB CheckConstraints enforce, raised early so the
    API user gets a friendly 400 instead of a bare IntegrityError."""
    if role == User.Role.MAIN_ADMIN and school is not None:
        raise serializers.ValidationError(
            {"school": "MAIN_ADMIN must not be attached to a school."}
        )
    if role != User.Role.MAIN_ADMIN and school is None:
        raise serializers.ValidationError(
            {"school": "Non-admin users must be attached to a school."}
        )


class UserCreateSerializer(serializers.ModelSerializer):
    """Create surface for /api/v1/users/.

    Validation responsibilities (in order):
      1. Required fields are present (DRF default).
      2. Password meets Django's AUTH_PASSWORD_VALIDATORS.
      3. role / school invariant matches the DB CheckConstraint.
      4. The acting user is allowed to create the requested (role, school)
         combination — see `validate()` below for the role-based gate.

    `school` is read from the body for MAIN_ADMIN and *overridden* from the
    actor's school for PRINCIPAL — a principal cannot place a user in
    another school even by passing a stray school_id.
    """

    password = serializers.CharField(write_only=True, trim_whitespace=False)
    school = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(),
        required=False,
        allow_null=True,
        pk_field=serializers.UUIDField(),
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "role",
            "school",
            "phone",
            "admission_number",
            "password",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "email": {"required": True},
            "username": {"required": True},
            "role": {"required": True},
        }

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value

    def validate_email(self, value):
        # Surface duplicate emails as a clean 400, not a 500.
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, attrs):
        # As of 2026-05-28 the only actor who reaches this serializer is
        # MAIN_ADMIN (see apps/accounts/permissions.py:CanManageUsers).
        # The earlier PRINCIPAL-as-creator branch was removed when user
        # creation was locked down to the platform super admin only.
        # MAIN_ADMIN may freely set role + school subject to the
        # role/school invariant below (which the DB also enforces).
        target_role = attrs.get("role")
        target_school = attrs.get("school")
        _validate_role_school_invariant(target_role, target_school)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Update surface for /api/v1/users/{id}/.

    `role` and `school` are read-only on this path. Changing either is a
    privilege-escalation footgun; for those use cases either delete and
    recreate, or build a separate admin-only escalation endpoint with
    its own audit trail.

    Password changes go through the dedicated /set-password/ action so we
    can enforce password validators and (later) emit an auth-revocation event.
    """

    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    assigned_teacher = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.TEACHER),
        required=False,
        allow_null=True,
        pk_field=serializers.UUIDField(),
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "role",
            "school",
            "phone",
            "admission_number",
            "assigned_teacher",
            "is_active",
        ]
        read_only_fields = ["id", "role", "school"]

    def validate_email(self, value):
        qs = User.objects.filter(email__iexact=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_assigned_teacher(self, value):
        # The teacher must belong to the same school as the student being edited.
        if value is not None and self.instance is not None and value.school_id != self.instance.school_id:
            raise serializers.ValidationError("Teacher must belong to the same school as the student.")
        return value


class PasswordSetSerializer(serializers.Serializer):
    """Body for POST /api/v1/users/{id}/set-password/."""

    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value


# ── Class onboarding (used by /api/v1/users/onboard-class/) ─────────────────


class OnboardStudentSerializer(serializers.Serializer):
    """One student row in an onboarding request. Only the name is required;
    everything else (email, username, password) is generated server-side."""

    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    admission_number = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")


class GenerateCredentialsSerializer(serializers.Serializer):
    """Body for POST /api/v1/users/generate-credentials/ (MAIN_ADMIN only).

    The Super Admin picks a school and a count; we mint that many blank STUDENT
    logins (no names yet). `count` is bounded so a typo can't spin up thousands
    of accounts — the same ceiling lives in onboarding.MAX_GENERATE.
    """

    school = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(), pk_field=serializers.UUIDField()
    )
    count = serializers.IntegerField(min_value=1, max_value=500)


class AssignTeacherSerializer(serializers.Serializer):
    """Body for POST /api/v1/users/assign-teacher/ (MAIN_ADMIN only).

    Bulk-assign a teacher to a set of students. `teacher=null` unassigns. Every
    student must be a STUDENT in the SAME school as the teacher.
    """

    teacher = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.TEACHER),
        allow_null=True,
        pk_field=serializers.UUIDField(),
    )
    students = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.STUDENT),
        many=True,
        pk_field=serializers.UUIDField(),
    )

    def validate_students(self, value):
        if not value:
            raise serializers.ValidationError("Select at least one student.")
        return value

    def validate(self, attrs):
        teacher = attrs.get("teacher")
        if teacher is not None:
            bad = [str(s.id) for s in attrs["students"] if s.school_id != teacher.school_id]
            if bad:
                raise serializers.ValidationError(
                    {"students": "All students must be in the same school as the teacher."}
                )
        return attrs


class CompleteProfileSerializer(serializers.Serializer):
    """Body for POST /api/v1/auth/complete-profile/ — a student's one-time,
    first-login profile. The school is NEVER taken from the body; it is read
    from the authenticated user's account (see CompleteProfileView)."""

    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    admission_number = serializers.CharField(max_length=50)  # roll number
    grade = serializers.IntegerField(min_value=1, max_value=12)
    section = serializers.CharField(max_length=4)

    def validate_first_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Name is required.")
        return value.strip()

    def validate_admission_number(self, value):
        if not value.strip():
            raise serializers.ValidationError("Roll number is required.")
        return value.strip()

    def validate_section(self, value):
        section = value.strip().upper()
        if not section:
            raise serializers.ValidationError("Section is required.")
        return section


class OnboardClassSerializer(serializers.Serializer):
    """Body for POST /api/v1/users/onboard-class/ (MAIN_ADMIN only).

    Validates that the target class belongs to the chosen school (tenant
    safety) and resolves the optional course before any account is created.
    """

    school = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(), pk_field=serializers.UUIDField()
    )
    klass = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(), pk_field=serializers.UUIDField()
    )
    course_code = serializers.CharField(required=False, allow_blank=True, default="")
    students = OnboardStudentSerializer(many=True)

    def validate_students(self, value):
        if not value:
            raise serializers.ValidationError("Provide at least one student.")
        return value

    def validate(self, attrs):
        school = attrs["school"]
        klass = attrs["klass"]
        # Tenant guard: the class must live in the selected school.
        if klass.school_id != school.id:
            raise serializers.ValidationError(
                {"klass": "Class does not belong to the selected school."}
            )

        course = None
        code = (attrs.get("course_code") or "").strip().upper()
        if code:
            course = Course.objects.filter(school=school, code__iexact=code).first()
            if course is None:
                raise serializers.ValidationError(
                    {"course_code": f"No course {code!r} in this school."}
                )
        attrs["course"] = course
        return attrs


# ── Student roster (used by GET /api/v1/users/roster/) ──────────────────────


class StudentRosterSerializer(serializers.ModelSerializer):
    """A student row for the teacher / principal / admin roster. Class comes from
    the student's latest enrolment (prefetched as `recent_enrollments` by the
    view to avoid N+1); avg_score / quizzes_attempted come from a per-page stats
    dict passed in `context["stats"]` (also one query, computed in the view)."""

    roll_number = serializers.CharField(source="admission_number")
    grade = serializers.SerializerMethodField()
    section = serializers.SerializerMethodField()
    class_label = serializers.SerializerMethodField()
    assigned_teacher = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    assigned_teacher_name = serializers.SerializerMethodField()
    avg_score = serializers.SerializerMethodField()
    quizzes_attempted = serializers.SerializerMethodField()
    last_attempt_at = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "first_name", "last_name", "email", "roll_number",
            "is_active", "profile_completed", "grade", "section", "class_label",
            "assigned_teacher", "assigned_teacher_name", "avg_score", "quizzes_attempted",
            "last_attempt_at",
        ]

    @staticmethod
    def _klass(obj):
        enr = getattr(obj, "recent_enrollments", None)
        return enr[0].klass if enr else None

    def get_grade(self, obj):
        k = self._klass(obj)
        return k.grade if k else None

    def get_section(self, obj):
        k = self._klass(obj)
        return k.section if k else None

    def get_class_label(self, obj):
        k = self._klass(obj)
        return f"Grade {k.grade}-{k.section}" if k else None

    def get_assigned_teacher_name(self, obj):
        t = obj.assigned_teacher
        return (t.get_full_name() or t.username) if t else None

    def get_avg_score(self, obj):
        row = self.context.get("stats", {}).get(obj.id)
        return float(row["avg"]) if row and row.get("avg") is not None else None

    def get_quizzes_attempted(self, obj):
        row = self.context.get("stats", {}).get(obj.id)
        return row["quizzes"] if row else None

    def get_last_attempt_at(self, obj):
        row = self.context.get("stats", {}).get(obj.id)
        last = row.get("last") if row else None
        return last.isoformat() if last else None


class TeacherDirectorySerializer(serializers.ModelSerializer):
    """A read-only teacher row for the principal / sub-admin / admin directory.

    `student_count` (students assigned to this teacher) is annotated by the view
    so the list stays free of N+1s. Account creation/edits are NOT exposed here —
    those stay on the MAIN_ADMIN-only /users/ surface (CanManageUsers policy).
    """

    name = serializers.SerializerMethodField()
    student_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "name", "first_name", "last_name", "email", "phone",
            "is_active", "date_joined", "student_count",
        ]
        read_only_fields = fields

    def get_name(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full or obj.username or obj.email
