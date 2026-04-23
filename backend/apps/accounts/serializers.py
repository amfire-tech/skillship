"""
File:    backend/apps/accounts/serializers.py
Purpose: DRF serializers for auth + user profile.
Owner:   Prashant

Public types here must match the frontend `User` and `AuthResponse` types in
frontend/src/types/index.ts. If you change a field name or shape, run
`npm run gen:types` in the frontend to regenerate the OpenAPI types.
"""

from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Safe, read-centric user shape returned from /auth/me/ and the login body."""

    # Coerce the FK PK (a UUID) to its hyphenated string form so the
    # response shape matches the frontend `User.school: string | null` type.
    school = serializers.PrimaryKeyRelatedField(
        read_only=True,
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
        ]
        read_only_fields = fields  # never mutated through auth endpoints


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
