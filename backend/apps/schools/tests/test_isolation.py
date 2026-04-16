"""
File:    backend/apps/schools/tests/test_isolation.py
Purpose: The CRITICAL multi-tenant isolation test — school A must never see school B's data.
Why:     If this test ever fails, we have a privacy/data-leak bug. This test is non-negotiable.
Owner:   Prashant
TODO:    For every tenant-scoped model (User, Class, Quiz, ContentItem, etc.):
           1. Create two schools A and B, each with users + sample data
           2. Log in as school A user
           3. Hit list endpoint, assert only A's data appears
           4. Try to GET / PATCH / DELETE one of B's objects by id → expect 404
"""
