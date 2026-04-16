"""
File:    backend/apps/analytics/views.py
Purpose: Read-only dashboard endpoints (/dashboards/principal, /dashboards/teacher, /dashboards/student).
Owner:   Vishal
TODO:    - PrincipalDashboardView: IsSameSchool + IsPrincipal
         - TeacherDashboardView: IsSameSchool + IsTeacher
         - StudentDashboardView: IsSameSchool + IsStudent (own data only)
         - RiskSignalViewSet: list/acknowledge — IsSameSchool + IsSchoolStaff
"""
