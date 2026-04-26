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

    def get_school_name(self, obj):
        return obj.school.name if obj.school_id else None

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
            "is_active",
            "date_joined",
        ]
        read_only_fields = [
            "id", "email", "username", "first_name", "last_name",
            "role", "school", "phone", "admission_number",
            "is_active", "date_joined",
        ]


class LoginSerializer(serializers.Serializer):
    """Email + password → validated user + issued token pair.

    We do the lookup + password check ourselves (rather than subclassing
    SimpleJWT's TokenObtainPairSerializer) because:
      - SimpleJWT keys on USERNAME_FIELD, which is "username" here.
      - We want email-based login without flipping USERNAME_FIELD globally
        (that would cascade into admin, management commands, and fixtures).
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        password = attrs["password"]

        user = User.objects.filter(email__iexact=email).first()
        if user is None or not user.check_password(password):
            raise AuthenticationFailed("Invalid email or password", code="invalid_credentials")
        if not user.is_active:
            raise AuthenticationFailed("Account is disabled", code="account_disabled")

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
        actor = self.context["request"].user
        target_role = attrs.get("role")
        target_school = attrs.get("school")

        if actor.role == Role.PRINCIPAL:
            # Principals create only TEACHER / STUDENT, only in their own school —
            # we override school here so a stray body field can't break tenancy.
            if target_role not in {User.Role.TEACHER, User.Role.STUDENT}:
                raise serializers.ValidationError(
                    {"role": f"PRINCIPAL may only create TEACHER or STUDENT, not {target_role}."}
                )
            attrs["school"] = actor.school
            target_school = actor.school

        # Final invariant — applies to every actor (defence in depth alongside
        # the DB CheckConstraint).
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


class PasswordSetSerializer(serializers.Serializer):
    """Body for POST /api/v1/users/{id}/set-password/."""

    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value
