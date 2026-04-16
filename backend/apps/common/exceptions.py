"""
File:    backend/apps/common/exceptions.py
Purpose: Custom exception types for business-rule violations (e.g. "quiz already submitted").
Why:     Service layer throws these, views turn them into clean JSON errors with a code.
         Avoids scattering HTTP status codes and error messages across business logic.
Owner:   Navanish
TODO:    - class DomainError(Exception): code (str), message, status_code=400.
         - Subclasses: NotFoundError(404), PermissionDeniedError(403), ConflictError(409).
         - Custom DRF exception handler wired in settings.REST_FRAMEWORK to translate them.
"""
