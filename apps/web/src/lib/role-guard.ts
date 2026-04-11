import type { UserRole } from "@/types";

// ============================================================
// Role Guard — Shared utility for per-role route layouts.
// Each role layout calls checkAccess() and redirects if denied.
// ============================================================

export const ROLE_ROUTES: Record<UserRole, string> = {
  admin: "/admin",
  subadmin: "/subadmin",
  principal: "/principal",
  teacher: "/teacher",
  student: "/student",
};

export function getDefaultRouteForRole(role: UserRole): string {
  return ROLE_ROUTES[role] ?? "/";
}

export function isRoleAllowed(userRole: UserRole | undefined, allowedRole: UserRole): boolean {
  return userRole === allowedRole;
}
