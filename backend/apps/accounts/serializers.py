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
from django.utils import timezone
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
    school_logo = serializers.SerializerMethodField()
    profile_photo = serializers.SerializerMethodField()
    current_class = serializers.SerializerMethodField()
    # The class UUID (not just the label) so the admin edit form can preselect
    # the student's current class in the Class dropdown.
    current_class_id = serializers.SerializerMethodField()
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

    def get_school_logo(self, obj):
        # The logo can be a sizeable base64 data-URL, so only return it on the
        # self-profile call (/auth/me/) — never on the paginated user list where
        # it would be repeated per row. Every role's dashboard hydrates from /me.
        if not self.context.get("me") or not obj.school_id:
            return None
        return obj.school.logo or None

    def get_profile_photo(self, obj):
        # Same weight concern as school_logo above — only on the self-profile
        # call. Other surfaces that need a teacher's photo for someone ELSE
        # (e.g. a principal's "Today's Teacher" view) read it through a
        # dedicated, purpose-built serializer instead of this one.
        if not self.context.get("me"):
            return None
        return obj.profile_photo or None

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
            Enrollment.objects.filter(student=obj, withdrawn_on__isnull=True)
            .select_related("klass").order_by("-enrolled_on", "-created_at").first()
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
            Enrollment.objects.filter(student=obj, withdrawn_on__isnull=True)
            .select_related("klass").order_by("-enrolled_on", "-created_at").first()
        )
        return f"Grade {enr.klass.grade}-{enr.klass.section}" if enr and enr.klass_id else None

    def get_current_class_id(self, obj):
        """The student's active class UUID (latest non-withdrawn enrolment), for
        the admin edit form. Only on the single-user detail view to avoid N+1s."""
        view = self.context.get("view")
        if obj.role != User.Role.STUDENT or getattr(view, "action", None) != "retrieve":
            return None
        enr = (
            Enrollment.objects.filter(student=obj, withdrawn_on__isnull=True)
            .order_by("-enrolled_on", "-created_at").first()
        )
        return str(enr.klass_id) if enr and enr.klass_id else None

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
            "school_logo",
            "profile_photo",
            "teacher_type",
            "phone",
            "admission_number",
            "current_class",
            "current_class_id",
            "class_name",
            "roll_number",
            "rank_in_class",
            "class_size",
            "certificates_count",
            "assigned_teacher",
            "assigned_teacher_name",
            "profile_completed",
            "is_active",
            "ai_enabled",
            "date_joined",
        ]
        read_only_fields = [
            "id", "email", "username", "first_name", "last_name",
            "role", "school", "teacher_type", "phone", "admission_number",
            "current_class", "current_class_id", "class_name", "roll_number", "rank_in_class",
            "class_size", "certificates_count",
            "assigned_teacher", "assigned_teacher_name",
            "profile_completed", "is_active", "ai_enabled", "date_joined",
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


def _validate_role_school_invariant(role: str, school, teacher_type=None) -> None:
    """The same invariant the DB CheckConstraints enforce, raised early so the
    API user gets a friendly 400 instead of a bare IntegrityError.

    Exception: a Skillship teacher (role=TEACHER, teacher_type=SKILLSHIP) is
    school-less by design — they reach schools via SkillshipAssignment instead.
    """
    is_skillship = role == User.Role.TEACHER and teacher_type == User.TeacherType.SKILLSHIP
    if role == User.Role.MAIN_ADMIN and school is not None:
        raise serializers.ValidationError(
            {"school": "MAIN_ADMIN must not be attached to a school."}
        )
    if is_skillship and school is not None:
        raise serializers.ValidationError(
            {"school": "A Skillship teacher is not tied to one school — leave it empty."}
        )
    if role != User.Role.MAIN_ADMIN and not is_skillship and school is None:
        raise serializers.ValidationError(
            {"school": "This user must be attached to a school."}
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
            "teacher_type",
            "phone",
            "admission_number",
            "password",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "email": {"required": True},
            "username": {"required": True},
            "role": {"required": True},
            "teacher_type": {"required": False},
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
        target_teacher_type = attrs.get("teacher_type", User.TeacherType.SCHOOL)
        _validate_role_school_invariant(target_role, target_school, target_teacher_type)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


def _set_student_class(student, klass):
    """Move a student to `klass` (or withdraw them when klass is None) by managing
    their Enrollment rows. Bare class membership uses course=None; a withdrawn
    enrolment to the same class is reactivated rather than duplicated (the
    (student, klass) partial unique constraint forbids a second row)."""
    today = timezone.localdate()
    active = (
        Enrollment.objects.filter(student=student, withdrawn_on__isnull=True)
        .order_by("-enrolled_on").first()
    )
    if klass is None:
        if active:
            active.withdrawn_on = today
            active.save(update_fields=["withdrawn_on"])
        return
    if active and active.klass_id == klass.id:
        return  # already in this class — no-op
    # Withdraw any other active enrolments, then activate the target class.
    Enrollment.objects.filter(student=student, withdrawn_on__isnull=True).update(withdrawn_on=today)
    enr, created = Enrollment.objects.get_or_create(
        student=student, klass=klass, course=None,
        defaults={"school_id": student.school_id},
    )
    if not created and enr.withdrawn_on is not None:
        enr.withdrawn_on = None
        enr.save(update_fields=["withdrawn_on"])


class UserUpdateSerializer(serializers.ModelSerializer):
    """Update surface for /api/v1/users/{id}/.

    `role` and `school` are read-only on this path. Changing either is a
    privilege-escalation footgun; for those use cases either delete and
    recreate, or build a separate admin-only escalation endpoint with
    its own audit trail.

    Password changes go through the dedicated /set-password/ action so we
    can enforce password validators and (later) emit an auth-revocation event.
    """

    # `school` is writable here ONLY for teachers (MAIN_ADMIN moving a teacher
    # between schools / converting to Skillship). For other roles the change is
    # dropped in validate(). `role` stays read-only.
    school = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(), required=False, allow_null=True,
        pk_field=serializers.UUIDField(),
    )
    assigned_teacher = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.TEACHER),
        required=False,
        allow_null=True,
        pk_field=serializers.UUIDField(),
    )
    # Write-only: move a STUDENT to a different class (manages the Enrollment).
    # null = withdraw from their current class. Read the current value via
    # UserSerializer.current_class_id on the detail GET.
    klass = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
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
            "teacher_type",
            "phone",
            "admission_number",
            "assigned_teacher",
            "klass",
            "is_active",
            "ai_enabled",
        ]
        read_only_fields = ["id", "role"]

    def validate(self, attrs):
        # School / teacher_type may only be adjusted for TEACHER accounts, and
        # must satisfy the role/school invariant. Switching to a Skillship
        # teacher auto-clears the school (they aren't tied to one).
        instance = self.instance
        if instance is None:
            return attrs
        if instance.role != User.Role.TEACHER:
            attrs.pop("teacher_type", None)
            attrs.pop("school", None)
            return attrs
        new_type = attrs.get("teacher_type", instance.teacher_type)
        if new_type == User.TeacherType.SKILLSHIP:
            attrs["school"] = None
        new_school = attrs.get("school", instance.school)
        _validate_role_school_invariant(User.Role.TEACHER, new_school, new_type)
        return attrs

    def validate_klass(self, value):
        # The class must belong to the same school as the student being edited.
        if value is not None and self.instance is not None and value.school_id != self.instance.school_id:
            raise serializers.ValidationError("Class must belong to the same school as the student.")
        return value

    def update(self, instance, validated_data):
        # `klass` is not a User field — pop it and apply as an Enrollment move.
        klass_provided = "klass" in validated_data
        new_klass = validated_data.pop("klass", None)
        user = super().update(instance, validated_data)
        if klass_provided and user.role == User.Role.STUDENT:
            _set_student_class(user, new_klass)
        return user

    def validate_email(self, value):
        qs = User.objects.filter(email__iexact=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_assigned_teacher(self, value):
        # A student's teacher is either (a) a normal teacher in the SAME school,
        # or (b) a Skillship teacher with an ACTIVE assignment to that school.
        if value is None or self.instance is None:
            return value
        student_school_id = self.instance.school_id
        if getattr(value, "is_skillship_teacher", False):
            from apps.assignments.models import SkillshipAssignment

            assigned = SkillshipAssignment.objects.filter(
                teacher_id=value.id, school_id=student_school_id, is_active=True
            ).exists()
            if not assigned:
                raise serializers.ValidationError(
                    "This Skillship teacher isn't actively assigned to the student's school."
                )
            return value
        if value.school_id != student_school_id:
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


# Photos are tiny; cap the stored data-URL so a stray multi-MB image can't
# bloat the row (and every /auth/me/ payload). Mirrors schools.MAX_LOGO_CHARS.
MAX_PROFILE_PHOTO_CHARS = 700_000


class ProfilePhotoSerializer(serializers.Serializer):
    """Body for POST /api/v1/auth/profile-photo/ — self-service avatar upload."""

    photo = serializers.CharField(allow_blank=True, trim_whitespace=False)

    def validate_photo(self, value):
        if not value:
            return ""  # clears the photo
        if not value.startswith("data:image/"):
            raise serializers.ValidationError(
                "Photo must be an image data-URL (data:image/...)."
            )
        if len(value) > MAX_PROFILE_PHOTO_CHARS:
            raise serializers.ValidationError(
                "Photo is too large. Please upload an image under ~500 KB."
            )
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Body for POST /api/v1/auth/change-password/ — self-service password change.

    The caller proves the current password before we accept a new one; the new
    password is run through Django's configured validators.
    """

    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        user = self.context["request"].user
        try:
            validate_password(value, user)
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
    # Which kind of blank login to mint. STUDENT (default) accounts self-complete
    # on first login; TEACHER accounts are staff logins (name set later by admin).
    role = serializers.ChoiceField(
        choices=[User.Role.STUDENT, User.Role.TEACHER], default=User.Role.STUDENT,
    )


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
        if teacher is None:
            return attrs
        students = attrs["students"]
        # A Skillship teacher may be assigned students from any school they have
        # an ACTIVE assignment to; a normal teacher only their own school's.
        if getattr(teacher, "is_skillship_teacher", False):
            from apps.assignments.models import SkillshipAssignment

            assigned_schools = set(
                SkillshipAssignment.objects.filter(teacher_id=teacher.id, is_active=True)
                .values_list("school_id", flat=True)
            )
            bad = [str(s.id) for s in students if s.school_id not in assigned_schools]
            if bad:
                raise serializers.ValidationError(
                    {"students": "This Skillship teacher isn't actively assigned to all of those students' schools."}
                )
            return attrs
        bad = [str(s.id) for s in students if s.school_id != teacher.school_id]
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
    last_score = serializers.SerializerMethodField()
    last_quiz_title = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "first_name", "last_name", "email", "roll_number",
            "is_active", "profile_completed", "grade", "section", "class_label",
            "assigned_teacher", "assigned_teacher_name", "avg_score", "quizzes_attempted",
            "last_attempt_at", "last_score", "last_quiz_title",
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

    def get_last_score(self, obj):
        row = self.context.get("stats", {}).get(obj.id)
        val = row.get("last_score") if row else None
        return float(val) if val is not None else None

    def get_last_quiz_title(self, obj):
        row = self.context.get("stats", {}).get(obj.id)
        return row.get("last_quiz_title") if row else None


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
