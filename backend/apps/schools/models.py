"""
File:    backend/apps/schools/models.py
Purpose: School (the tenant root) and SchoolSettings (per-school feature flags).
Why:     Everything in the system belongs to exactly one School. This is the "tenant" in multi-tenant.
         School itself is NOT a TenantModel — it IS the tenant.
Owner:   Prashant
TODO:    class School(TimeStampedModel):
           - id = UUIDField(pk)
           - name, slug (unique), board = CharField(choices=[CBSE, ICSE, STATE])
           - city, state, address
           - plan = CharField(choices=[CORE, AGENTIC])       # maps to proposal plans 01 / 02
           - subscription_expires_at = DateTimeField
           - is_active = BooleanField(default=True)

         class SchoolSettings(TimeStampedModel):
           - school = OneToOneField(School)
           - ai_enabled = BooleanField(default=True)
           - custom_agent_config = JSONField(default=dict)    # per-school agent overrides
           - branding = JSONField(default=dict)               # logo URL, primary color
"""
