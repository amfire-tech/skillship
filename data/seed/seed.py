"""
File:    data/seed/seed.py
Purpose: Insert demo data — 2 schools, MAIN_ADMIN, principal + teacher + students per school,
         one course, one quiz, sample content. Used for dev + demo + CI smoke tests.
Why:     Every teammate can `python data/seed/seed.py` on day 1 and have something to click.
Owner:   Shared (lead: Prashant)
TODO:    Use Django management command or a standalone script that sets up DJANGO_SETTINGS_MODULE.
         Must be idempotent — running twice should not duplicate rows.
"""
