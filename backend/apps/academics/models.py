"""
File:    backend/apps/academics/models.py
Purpose: Structural models — AcademicYear, Class, Course, Enrollment.
Why:     Every quiz / content / analytic ultimately rolls up to a Class and a Course.
Owner:   Prashant
TODO:    All inherit TenantModel.

         class AcademicYear(TenantModel):
           - name (e.g. "2025-26"), start_date, end_date, is_current

         class Class(TenantModel):
           - grade (1..12), section (A/B/C/...), academic_year FK, class_teacher FK(User)
           - Meta.unique_together = (school, academic_year, grade, section)

         class Course(TenantModel):
           - name, code, stream = CharField(choices=[AI, CODE, ROBOT, STEM])
           - grade_min, grade_max

         class Enrollment(TenantModel):
           - student FK(User), klass FK(Class), course FK(Course, null=True)
           - enrolled_at, status (ACTIVE/INACTIVE)
"""
