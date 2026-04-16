"""
File:    backend/apps/common/middleware.py
Purpose: TenantMiddleware — reads request.user.school_id and attaches it as request.school_id.
Why:     Every view needs to know which school this request belongs to WITHOUT each view
         repeating the logic. Middleware is the clean way to inject this once.
Owner:   Navanish
TODO:    class TenantMiddleware:
           - On each request: if user is authenticated, set request.school_id = user.school_id.
           - For MAIN_ADMIN or anonymous users: request.school_id = None.
         Must run AFTER AuthenticationMiddleware (order matters in base.py MIDDLEWARE list).
"""
