"""
File:    backend/apps/common/permissions.py
Purpose: Shared DRF permission classes for role-based access and tenant isolation.
Why:     Every view needs these — writing them once avoids bugs where one view forgets a check.
Owner:   Navanish
TODO:    - class Role: MAIN_ADMIN, SUB_ADMIN, PRINCIPAL, TEACHER, STUDENT (string constants).
         - IsMainAdmin, IsSubAdmin, IsPrincipal, IsTeacher, IsStudent (DRF BasePermission).
         - IsSchoolStaff (any of principal/teacher/sub_admin of SAME school).
         - IsSameSchool (object-level: obj.school_id == request.school_id).
         Always combine tenant + role, e.g. [IsAuthenticated, IsSameSchool, IsTeacher].
"""
