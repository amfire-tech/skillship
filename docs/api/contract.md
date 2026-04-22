<!--
File:    docs/api/contract.md
Purpose: The four contract decisions between frontend and backend — locked before Week 2.
Owner:   Navanish
Status:  DRAFT v1 — pending Pranav ack on 2026-04-22
-->

# API contract — frontend ↔ backend

This doc exists because the frontend and backend evolved separately for a few days
and their types drifted. The four decisions below are the source of truth from now on.
Everything else (endpoint shapes, field lists) is generated from `drf-spectacular` and
consumed by the frontend via `npm run gen:types`.

If any decision here changes, it is a two-sided PR: backend model/serializer change +
frontend type regen + review by one person from each side.

---

## 1. Roles — uppercase enum constants

**Values** (match `apps.accounts.models.User.Role`):

```
MAIN_ADMIN  SUB_ADMIN  PRINCIPAL  TEACHER  STUDENT
```

Backend serializes `user.role` as the uppercase string. Frontend type:

```ts
export type UserRole = "MAIN_ADMIN" | "SUB_ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT";
```

**URL slugs stay lowercase** for human-readable routes. Mapping lives in one place
(`frontend/src/lib/role-guard.ts`):

```ts
export const ROLE_ROUTES: Record<UserRole, string> = {
  MAIN_ADMIN: "/dashboard/admin",
  SUB_ADMIN:  "/dashboard/sub-admin",
  PRINCIPAL:  "/dashboard/principal",
  TEACHER:    "/dashboard/teacher",
  STUDENT:    "/dashboard/student",
};
```

**Frontend migration** (Pranav, ~1 hour): rename enum values in `types/index.ts`,
update `role-guard.ts`, fix call sites. TypeScript will catch the rest.

---

## 2. User schema — backend fields, frontend derives `displayName`

Backend `User` response shape:

```json
{
  "id": "uuid",
  "email": "student@school.edu.in",
  "username": "roll2024001",
  "first_name": "Aarav",
  "last_name": "Sharma",
  "role": "STUDENT",
  "school": "uuid-of-school-or-null",
  "phone": "",
  "admission_number": "2024/STD/001"
}
```

The backend does **not** send a single `name` field — first/last live separately for
reports, PDF exports, and sorting. Frontend derives a display name client-side:

```ts
export const displayName = (u: User) =>
  [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username;
```

Frontend `User` type:

```ts
export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  school: string | null;   // uuid; null only for MAIN_ADMIN
  phone?: string;
  admission_number?: string;
}
```

---

## 3. School schema — no `plan` field in the API contract

Frontend type:

```ts
export interface School {
  id: string;
  name: string;
  slug: string;
  board: "CBSE" | "ICSE" | "STATE";
  city?: string;
  state?: string;
  address?: string;
  is_active: boolean;
  subscription_expires_at?: string; // ISO date
}
```

The `plan` column exists on the backend model for the Plan 01 / Plan 02 upgrade
path, but it is **not part of the API contract** — no serializer field, no frontend
type. Plan 01 UI does not branch on plan. The `"free" | "pro" | "enterprise"`
values currently in frontend `types/index.ts` get removed (not replaced).

When Plan 02 ships we add `plan` to the contract in a versioned change — not now.

---

## 4. Auth flow — HttpOnly refresh cookie (frontend approach wins)

### Login

`POST /api/v1/auth/login/` — body `{ "email", "password" }`

Response (200):
- body: `{ "user": <User>, "access": "<jwt>" }`
- `Set-Cookie: refresh=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=604800`

Frontend stores `access` in memory (Zustand state, not persisted). The cookie is
invisible to JS — which is the whole point.

### Refresh

`POST /api/v1/auth/refresh/` — **no body**, relies on the cookie.

Response (200):
- body: `{ "access": "<jwt>" }`
- optional rotated `refresh` cookie (we have `ROTATE_REFRESH_TOKENS=True`)

If the cookie is missing or expired → 401. Frontend's axios interceptor already
handles this (redirect to `/login`).

### Logout

`POST /api/v1/auth/logout/` — reads cookie, blacklists the refresh token, clears
the cookie (`Set-Cookie: refresh=; Max-Age=0`).

### Me

`GET /api/v1/auth/me/` — returns the current `User` object. Used by frontend on
app boot and after login to hydrate the auth store.

### Backend config changes (my work, ~2 hours)

In `config/settings/base.py`:

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_COOKIE": "refresh",
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_SAMESITE": "Lax",
    "AUTH_COOKIE_PATH": "/api/v1/auth",
    "AUTH_COOKIE_SECURE": not DEBUG,   # True in prod
}
```

CORS:

```python
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]  # prod domains added later
```

Custom login / refresh / logout views that read/write the cookie instead of returning
the refresh token in the body. Pattern: subclass `TokenObtainPairView` /
`TokenRefreshView` and override `finalize_response` to move the token into a cookie.

---

## 5. Error envelope

Every 4xx/5xx JSON response uses the same shape (already wired via
`apps.common.exceptions.api_exception_handler`):

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Email already in use.",
  "errors": { "email": ["already in use"] }   // optional, field-level
}
```

Frontend type:

```ts
export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}
```

---

## 6. Pagination

DRF `PageNumberPagination` via `apps.common.pagination.StandardPagination`.
Page size 20, max 100. Shape:

```json
{
  "count": 123,
  "next": "http://.../?page=3",
  "previous": "http://.../?page=1",
  "results": [ ... ]
}
```

Frontend `PaginatedResponse` type must match — rename existing `data/total/page/pageSize`
to `results/count/next/previous`.

---

## 7. How we stay in sync after today

1. Backend adds/changes an endpoint → `drf-spectacular` auto-updates `/api/schema/`.
2. Pranav runs `npm run gen:types` → fresh TypeScript types under `src/types/generated/`.
3. If a breaking change crosses the contract, the PR description lists it and the
   reviewer from the other side has to sign off.
4. Types in `src/types/index.ts` (hand-written) stay small and only wrap the generated
   ones for ergonomics — not redefine them.

---

## Sign-off

- Backend (Navanish): ☐ pending
- Frontend (Pranav): ☐ pending

Once both check this in, the four migrations above happen in one short PR per side,
same day. Then Week 2 starts clean.
