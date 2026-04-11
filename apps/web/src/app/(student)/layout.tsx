"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { isRoleAllowed } from "@/lib/role-guard";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (!isRoleAllowed(user?.role, "student")) {
        router.replace("/unauthorized");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (!isAuthenticated || !isRoleAllowed(user?.role, "student")) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--nav)] border-t-transparent" />
      </div>
    );
  }

  return <div className="student-layout">{children}</div>;
}
