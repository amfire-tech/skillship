import type { UserRole } from "@/types";

// ============================================================
// Role Guard — Shared utility for per-role route layouts.
// Each role layout calls checkAccess() and redirects if denied.
// ============================================================

// URL paths match the (dashboard) route group structure in the main repo.
// Role constants are uppercase (backend contract); URL slugs stay lowercase.
export const ROLE_ROUTES: Record<UserRole, string> = {
  MAIN_ADMIN: "/dashboard/admin",
  SUB_ADMIN:  "/dashboard/sub-admin",
  PRINCIPAL:  "/dashboard/principal",
  TEACHER:    "/dashboard/teacher",
  STUDENT:    "/dashboard/student",
};

export function getDefaultRouteForRole(role: UserRole): string {
  return ROLE_ROUTES[role] ?? "/";
}

export function isRoleAllowed(userRole: UserRole | undefined, allowedRole: UserRole): boolean {
  // MAIN_ADMIN has platform-wide access — exempt from per-role route restrictions.
  if (userRole === "MAIN_ADMIN") return true;
  return userRole === allowedRole;
}
