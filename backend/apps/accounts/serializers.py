"""
File:    backend/apps/accounts/serializers.py
Purpose: DRF serializers for User — input validation + JSON output shape.
Why:     Never expose password; never let clients change role or school_id from the API.
Owner:   Prashant
TODO:    - UserSerializer: fields = [id, username, email, role, school, phone]
                           read_only = [id, role, school]  # role/school only editable by admin flows
         - UserCreateSerializer (for admin creating users): writeable role + school + password.
         - MeSerializer (for /auth/me/): current user's profile.
"""
