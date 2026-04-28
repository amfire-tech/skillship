"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types";

const ROLE_PREFIX_MAP: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/dashboard/admin", role: "MAIN_ADMIN" },
  { prefix: "/dashboard/sub-admin", role: "SUB_ADMIN" },
  { prefix: "/dashboard/principal", role: "PRINCIPAL" },
  { prefix: "/dashboard/teacher", role: "TEACHER" },
  { prefix: "/dashboard/student", role: "STUDENT" },
];

const ADMIN_SHELL_ROLES: UserRole[] = ["MAIN_ADMIN", "SUB_ADMIN"];

function getRoleForPath(pathname: string): UserRole | null {
  const match = ROLE_PREFIX_MAP.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
  return match?.role ?? null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const roleForPath = getRoleForPath(pathname);

  if (roleForPath && ADMIN_SHELL_ROLES.includes(roleForPath)) {
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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="p-6 lg:p-8">{children}</main>
    </div>
  );
}
