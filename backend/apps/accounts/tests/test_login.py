"""
File:    backend/apps/accounts/tests/test_login.py
Purpose: Tests for login, refresh, logout, /me/ — plus role-based access denials.
Why:     Login is the single most-used endpoint; a bug here breaks the whole app.
Owner:   Prashant
TODO:    - test_login_returns_access_and_refresh
         - test_refresh_rotates_token
         - test_wrong_password_returns_401
         - test_main_admin_login_has_no_school_id
         - test_cross_school_user_cannot_list_other_school_users
"""
