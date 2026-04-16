"""
File:    backend/apps/accounts/permissions.py
Purpose: Permission classes specific to user-management endpoints.
Why:     e.g. only PRINCIPAL of a school can list teachers of that school.
Owner:   Prashant
TODO:    CanManageUsersInSchool, CanViewSelfOnly, etc. (combine with common.permissions.IsSameSchool).
"""
