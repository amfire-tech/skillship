/*
 * File:    frontend/src/lib/__tests__/role-guard.test.ts
 * Purpose: Unit tests for role routing + access checks.
 * Owner:   Pranav
 */
import { ROLE_ROUTES, getDefaultRouteForRole, isRoleAllowed } from "@/lib/role-guard";

describe("lib/role-guard", () => {
  it("maps each role to its dashboard route", () => {
    expect(ROLE_ROUTES.MAIN_ADMIN).toBe("/dashboard/admin");
    expect(ROLE_ROUTES.SUB_ADMIN).toBe("/dashboard/sub-admin");
    expect(ROLE_ROUTES.PRINCIPAL).toBe("/dashboard/principal");
    expect(ROLE_ROUTES.TEACHER).toBe("/dashboard/teacher");
    expect(ROLE_ROUTES.STUDENT).toBe("/dashboard/student");
  });

  it("getDefaultRouteForRole returns mapped route", () => {
    expect(getDefaultRouteForRole("STUDENT")).toBe("/dashboard/student");
  });

  it("MAIN_ADMIN bypasses per-role restrictions", () => {
    expect(isRoleAllowed("MAIN_ADMIN", "STUDENT")).toBe(true);
    expect(isRoleAllowed("MAIN_ADMIN", "PRINCIPAL")).toBe(true);
  });

  it("non-admin role only allowed on its own route", () => {
    expect(isRoleAllowed("TEACHER", "TEACHER")).toBe(true);
    expect(isRoleAllowed("TEACHER", "STUDENT")).toBe(false);
  });

  it("undefined role denied", () => {
    expect(isRoleAllowed(undefined, "STUDENT")).toBe(false);
  });
});
