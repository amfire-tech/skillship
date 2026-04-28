"""Root URL configuration."""

from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # API v1
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/users/", include("apps.accounts.users_urls")),
    path("api/v1/schools/", include("apps.schools.urls")),
    path("api/v1/academics/", include("apps.academics.urls")),
    path("api/v1/quizzes/", include("apps.quizzes.urls")),
    path("api/v1/content/", include("apps.content.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/ai/", include("apps.ai_bridge.urls")),
    # Health check
    path("", include("apps.common.urls")),
    # OpenAPI schema + docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
