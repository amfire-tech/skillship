"""
File:    backend/apps/accounts/views.py
Purpose: Auth + user CRUD endpoints — login, refresh, logout, /me/, list/create/update users.
Why:     The entry point for every frontend screen; must be correct and well-tested.
Owner:   Prashant
TODO:    - LoginView = SimpleJWT's TokenObtainPairView (returns access + refresh)
         - RefreshView = TokenRefreshView
         - LogoutView: blacklist refresh token
         - MeView (GET /auth/me/): returns current user profile
         - UserViewSet (ModelViewSet): tenant-scoped via request.school_id, permission per action
"""
