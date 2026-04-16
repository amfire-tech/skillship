"""
File:    backend/config/settings/prod.py
Purpose: Production overrides — DEBUG=False, HSTS, SSL redirect, JSON logging, SMTP email.
Why:     Must be secure and observable when real schools are using it.
Owner:   Navanish
TODO:    from .base import *; DEBUG=False; SECURE_HSTS_SECONDS; SECURE_SSL_REDIRECT;
         JSON logging to stdout; SENTRY_DSN wiring.
"""
