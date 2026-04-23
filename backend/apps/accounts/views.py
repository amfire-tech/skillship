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

from django.conf import settings
from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, UserSerializer

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
