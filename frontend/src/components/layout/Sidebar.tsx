/*
 * File:    frontend/src/components/layout/Sidebar.tsx
 * Purpose: Reusable sidebar shell for Principal, Teacher, and Student roles.
 *          Accepts nav config as props — matches AdminSidebar design exactly.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { SkillshipLockup } from "@/components/brand/SkillshipMark";
import { API_BASE, getToken } from "@/lib/auth";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  navItems: SidebarNavItem[];
  roleLabel: string;
  onClose?: () => void;
}

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export function Sidebar({ navItems, roleLabel, onClose }: SidebarProps) {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  // School branding (logo + name) is a /auth/me-only field, so fetch it once on
  // mount rather than relying on the persisted login user (which omits it).
  const [school, setSchool] = useState<{ name?: string | null; logo?: string | null }>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/auth/me/`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setSchool({ name: data.school_name, logo: data.school_logo });
      } catch {
        /* branding is non-critical — fall back to the plain Skillship lockup */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    logout();
    router.replace("/login");
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-[var(--border)] bg-white dark:bg-[var(--background)]">
      {/* Brand */}
      <div className="px-5 py-5">
        <SkillshipLockup badgeSize={40} wordmarkSize="md" subLabel={roleLabel} />
      </div>

      {/* School branding — shows this school's logo + name to its staff/students */}
      {(school.logo || school.name) && (
        <div className="mx-3 mb-2 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2.5">
          {school.logo ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={school.logo} alt={`${school.name ?? "School"} logo`} className="h-full w-full object-contain" />
            </span>
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
              {(school.name ?? "S").trim().charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">{school.name ?? "—"}</p>
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Your School</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isRoot = item.href.split("/").length === 3;
            const active = isRoot
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
                    active
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-[0_8px_20px_-10px_rgba(255,122,24,0.6)]"
                      : "text-[var(--muted-foreground)] hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? "text-white" : "text-[var(--muted-foreground)] group-hover:text-primary"}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {active && <ChevronIcon />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-[var(--border)] p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[var(--muted-foreground)] transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg">
            <LogoutIcon />
          </span>
          Logout
        </button>
      </div>
    </aside>
  );
}
