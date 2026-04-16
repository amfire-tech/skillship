"""
File:    backend/config/settings/dev.py
Purpose: Development overrides — DEBUG=True, permissive CORS, console email backend.
Why:     Keeps local development fast without exposing production secrets.
Owner:   Navanish
TODO:    from .base import *; DEBUG=True; ALLOWED_HOSTS=['*']; CORS_ALLOW_ALL=True; EMAIL_BACKEND=console.
"""
