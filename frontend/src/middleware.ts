// File:    frontend/src/middleware.ts
// Purpose: Next.js middleware — redirects unauthenticated users to /login
//          and routes logged-in users to their role-specific dashboard.
// Why:     Server-side guard runs on every request BEFORE the page renders,
//          so protected pages never flash before redirecting.
// Owner:   Pranav
// TODO:
//   - Read JWT cookie
//   - If missing and path starts with /dashboard  -> NextResponse.redirect('/login')
//   - Else decode role and rewrite to /dashboard/{role}/...
//   - export const config = { matcher: ['/dashboard/:path*'] }
