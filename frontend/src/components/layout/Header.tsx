/*
 * File:    frontend/src/components/layout/Header.tsx
 * Purpose: Reusable topbar for Principal, Teacher, and Student roles.
 *          Matches AdminTopbar design — breadcrumbs, theme toggle, profile chip.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import { displayName } from "@/types";
import { getDefaultRouteForRole } from "@/lib/role-guard";
import { NotificationsBell } from "@/components/layout/NotificationsBell";

interface HeaderProps {
  crumbMap?: Record<string, string>;
  onMenuClick?: () => void;
}

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" /><line x1="12" x2="12" y1="1" y2="3" /><line x1="12" x2="12" y1="21" y2="23" /><line x1="4.22" x2="5.64" y1="4.22" y2="5.64" /><line x1="18.36" x2="19.78" y1="18.36" y2="19.78" /><line x1="1" x2="3" y1="12" y2="12" /><line x1="21" x2="23" y1="12" y2="12" /><line x1="4.22" x2="5.64" y1="19.78" y2="18.36" /><line x1="18.36" x2="19.78" y1="5.64" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)]">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const DEFAULT_CRUMB_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  principal: "Principal",
  teacher: "Teacher",
  student: "Student",
  "sub-admin": "Sub Admin",
  academics: "Academics",
  quizzes: "My Quizzes",
  career: "Career Pilot",
  reports: "Reports",
  settings: "Settings",
  new: "New",
};

function buildCrumbs(pathname: string, crumbMap: Record<string, string>) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return [];

  const roleSegment = parts[1];
  const roleLabel = crumbMap[roleSegment] ?? roleSegment;
  const rootHref = `/dashboard/${roleSegment}`;

  const crumbs: { label: string; href: string }[] = [
    { label: roleLabel, href: rootHref },
  ];

  if (parts.length === 2) {
    crumbs.push({ label: "Dashboard", href: rootHref });
    return crumbs;
  }

  let acc = rootHref;
  for (let i = 2; i < parts.length; i++) {
    acc += `/${parts[i]}`;
    const label = crumbMap[parts[i]] ?? parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
    crumbs.push({ label, href: acc });
  }
  return crumbs;
}

export function Header({ crumbMap = {}, onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useTheme();
  const merged = { ...DEFAULT_CRUMB_MAP, ...crumbMap };
  const crumbs = buildCrumbs(pathname, merged);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMenuOpen(false); }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    logout();
    router.replace("/login");
  }

  const dashboardHref = user ? getDefaultRouteForRole(user.role) : "/";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-[var(--border)] bg-white/95 px-3 backdrop-blur-lg sm:px-4 md:gap-4 md:px-6 dark:bg-[var(--background)]/95">
      {/* Hamburger — mobile only */}
      {onMenuClick && (
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-primary md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" />
          </svg>
        </button>
      )}
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-sm">
        {crumbs.map((c, i) => (
          <div key={c.href + i} className="flex items-center gap-2">
            {i > 0 && <ChevronIcon />}
            {i === crumbs.length - 1 ? (
              <span className="truncate font-semibold text-[var(--foreground)]">{c.label}</span>
            ) : (
              <Link href={c.href} className="truncate text-[var(--muted-foreground)] transition-colors hover:text-primary">
                {c.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* ⌘K palette trigger */}
      <button
        type="button"
        aria-label="Open command palette"
        onClick={() => window.dispatchEvent(new CustomEvent("skillship:open-palette"))}
        className="hidden h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)]/40 px-3 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:border-primary/30 hover:text-primary md:inline-flex"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>Quick jump</span>
        <kbd className="rounded border border-[var(--border)] bg-white px-1 py-0.5 text-[10px] font-bold text-[var(--muted-foreground)] dark:bg-[var(--background)]">⌘K</kbd>
      </button>

      {/* Theme toggle */}
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-primary"
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Notifications */}
      <NotificationsBell />

      {/* Profile menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex shrink-0 items-center gap-2.5 rounded-full border border-[var(--border)] bg-white px-1 py-1 pr-2 shadow-sm transition-colors hover:border-primary/30 sm:pr-3 dark:bg-[var(--background)]"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
            {(user ? displayName(user) : "U").charAt(0).toUpperCase()}
          </div>
          <span className="hidden max-w-[140px] truncate whitespace-nowrap text-xs font-semibold text-[var(--foreground)] sm:inline">
            {user ? displayName(user) : "User"}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-[var(--muted-foreground)] transition-transform ${menuOpen ? "rotate-180" : ""}`}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {menuOpen && (
          <div role="menu" className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[0_24px_60px_-20px_rgba(5,150,105,0.25)] dark:bg-[var(--card)]">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">{user ? displayName(user) : "User"}</p>
              <p className="truncate text-xs text-[var(--muted-foreground)]">{user?.email ?? ""}</p>
            </div>
            <Link
              href={dashboardHref}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-primary/5 hover:text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
              Dashboard
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
