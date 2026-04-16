"""
File:    backend/apps/accounts/services.py
Purpose: Business-logic functions for accounts (create_user, invite_user, reset_password, assign_role).
Why:     Views stay thin; this file holds the rules (e.g. "only principal can create teachers in own school").
Owner:   Prashant
TODO:    - create_user(actor, school, role, email, ...) with role-hierarchy checks
         - invite_user_by_email(actor, ...)
         - reset_password(user, new_password)
         - assign_role(actor, target_user, new_role)
         All raise DomainError from common.exceptions on rule violations.
"""
