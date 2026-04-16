"""
File:    backend/apps/accounts/models.py
Purpose: Custom User model — identity + role + link to school.
Why:     Django's default User has no role and no tenant link. We need both because
         every login screen sends someone to a different dashboard based on role, and
         every query must be scoped to their school.
Owner:   Prashant
TODO:    class User(AbstractUser):
           - id = UUIDField(primary_key=True, default=uuid.uuid4)
           - role = CharField(choices=[MAIN_ADMIN, SUB_ADMIN, PRINCIPAL, TEACHER, STUDENT])
           - school = ForeignKey("schools.School", null=True, on_delete=PROTECT)
           - phone = CharField(blank=True)
           - admission_number = CharField(blank=True)    # students only
           - Meta.constraints:
               * CheckConstraint: if role == MAIN_ADMIN then school_id IS NULL
               * CheckConstraint: if role != MAIN_ADMIN then school_id IS NOT NULL
"""
