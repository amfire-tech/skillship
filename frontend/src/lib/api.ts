// File:    frontend/src/lib/api.ts
// Purpose: Shared API client (axios or fetch wrapper) with JWT auth + refresh.
// Why:     One place handles headers, 401 retry-after-refresh, base URL.
// Owner:   Pranav
// TODO:
//   - api.get/post/patch/delete using NEXT_PUBLIC_API_BASE_URL + /api/v1
//   - Interceptor: on 401 -> call /auth/refresh/ -> retry once; else logout()
//   - Types come from ../types/generated/api.ts (auto-generated from Django OpenAPI)
