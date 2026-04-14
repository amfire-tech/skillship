"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

const crumbMap: Record<string, string> = {
  admin: "Skillship Admin",
  schools: "Schools Management",
  subadmins: "SubAdmin Management",
  quizzes: "Global Quiz Management",
  "quiz-approvals": "Quiz Approval Panel",
  marketplace: "Marketplace Management",
  analytics: "Global Analytics",
  reports: "Reports",
  settings: "Settings",
  users: "Users",
  new: "Create New User",
};

function buildCrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0 || parts[0] !== "admin") return [];
  const crumbs: { label: string; href: string }[] = [
    { label: crumbMap.admin, href: "/admin" },
  ];
  let acc = "/admin";
  for (let i = 1; i < parts.length; i += 1) {
    acc += `/${parts[i]}`;
    crumbs.push({
      label: crumbMap[parts[i]] ?? parts[i].charAt(0).toUpperCase() + parts[i].slice(1),
      href: acc,
    });
  }
  // If we're at /admin, second crumb is "Dashboard"
  if (parts.length === 1) {
    crumbs.push({ label: "Dashboard", href: "/admin" });
  }
  return crumbs;
}

export function AdminTopbar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const crumbs = buildCrumbs(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[var(--border)] bg-white/80 px-6 backdrop-blur-lg">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
        {crumbs.map((c, i) => (
          <div key={c.href + i} className="flex items-center gap-2">
            {i > 0 && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)]">
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
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

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden min-w-[280px] max-w-sm md:block">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Search schools, students, quizzes…"
          className="h-9 w-full rounded-full border border-[var(--border)] bg-[var(--muted)]/40 pl-9 pr-3 text-xs text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
        />
      </div>

      {/* Theme stub */}
      <button
        type="button"
        aria-label="Toggle theme"
        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>

      {/* Notifications */}
      <button
        type="button"
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          7
        </span>
      </button>

      {/* Profile */}
      <div className="flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-white px-1 py-1 pr-3 shadow-sm">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
          {(user?.name ?? "A").charAt(0).toUpperCase()}
        </div>
        <span className="text-xs font-semibold text-[var(--foreground)]">
          {user?.name ?? "Aryan Gupta"}
        </span>
      </div>
    </header>
  );
}
