// File:    frontend/src/app/(auth)/login/page.tsx
// Purpose: Login form — POST /api/v1/auth/login/, save access + refresh, redirect by role.
// Owner:   Pranav
// TODO:
//   - react-hook-form + zod schema {email, password}
//   - On success: store tokens (httpOnly cookie ideal), decode role, router.replace(`/dashboard/${role}`).
//   - Show inline error on 401.
