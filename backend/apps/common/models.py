"""
File:    backend/apps/common/models.py
Purpose: Abstract base models every other app inherits from — TimeStampedModel and TenantModel.
Why:     Guarantees every table has created_at/updated_at and a school FK (so multi-tenancy works).
         This is THE foundation of the whole project — every table belongs to exactly one school.
Owner:   Navanish
TODO:    - TimeStampedModel (abstract): created_at, updated_at
         - TenantQuerySet with .for_school(school_id) helper
         - TenantManager wrapping that QuerySet
         - TenantModel (abstract): UUID pk, school FK (on_delete=CASCADE, db_index=True),
           objects = TenantManager(), Meta: indexes = [(school, created_at)]
         Every tenant-scoped model (User rows belonging to a school, Class, Quiz, etc.)
         MUST inherit from TenantModel. Non-tenant models (School, MarketplaceListing) do not.
"""
