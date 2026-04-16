"use client";

// File:    frontend/src/app/(dashboard)/layout.tsx
// Purpose: Unified shell for ALL authenticated roles — wraps every protected page
//          with the correct sidebar + topbar. Role-specific access checks happen
//          here so individual pages stay clean.
// Why:     Main architecture uses a single (dashboard) group rather than per-role
//          groups. The sidebar/topbar components handle role-based nav filtering.
// Owner:   Pranav

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { getDefaultRouteForRole } from "@/lib/role-guard";
import type { UserRole } from "@/types";

// Map URL prefixes to the role that is allowed to access them.
const ROLE_PREFIX_MAP: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/admin", role: "admin" },
  { prefix: "/sub-admin", role: "subadmin" },
  { prefix: "/principal", role: "principal" },
  { prefix: "/teacher", role: "teacher" },
  { prefix: "/student", role: "student" },
];

function getRoleForPath(pathname: string): UserRole | null {
  const match = ROLE_PREFIX_MAP.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
  return match?.role ?? null;
}

// Roles that use the AdminSidebar + AdminTopbar shell.
const ADMIN_SHELL_ROLES: UserRole[] = ["admin", "subadmin"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    // Wrong role for this path → redirect to that user's own dashboard
    const requiredRole = getRoleForPath(pathname);
    if (requiredRole && user.role !== requiredRole) {
      router.replace(getDefaultRouteForRole(user.role));
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  // Spinner while auth is resolving
  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Admin and sub-admin: full admin shell (sidebar + topbar)
  if (ADMIN_SHELL_ROLES.includes(user.role)) {
    return (
      <div className="flex min-h-screen bg-[var(--muted)]/30">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </div>
    );
  }

  // Principal, teacher, student: minimal shell until role-specific sidebars are built.
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="p-6 lg:p-8">{children}</main>
    </div>
  );
}
