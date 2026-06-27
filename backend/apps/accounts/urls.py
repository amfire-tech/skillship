"""
File:    backend/apps/accounts/urls.py
Purpose: URL routes for auth endpoints. Mounted at /api/v1/auth/ by config.urls.
Owner:   Prashant
"""

from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("login/", views.LoginView.as_view(), name="login"),
    path("refresh/", views.RefreshView.as_view(), name="refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path("complete-profile/", views.CompleteProfileView.as_view(), name="complete-profile"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("profile-photo/", views.UpdateProfilePhotoView.as_view(), name="profile-photo"),
]
