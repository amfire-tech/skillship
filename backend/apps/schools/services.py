"""
File:    backend/apps/schools/services.py
Purpose: Business logic for onboarding a new school (create School + PRINCIPAL user + SchoolSettings in one transaction).
Why:     Onboarding is a critical multi-step flow that must be atomic — no half-onboarded schools.
Owner:   Prashant
TODO:    - onboard_school(name, plan, principal_email, ...) -> (school, principal)
         - deactivate_school(school)
         - change_plan(school, new_plan)
"""
