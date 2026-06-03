/*
 * File:    frontend/src/components/shared/CommandPalette.tsx
 * Purpose: Cmd/Ctrl+K palette for fast dashboard navigation across roles.
 *          Shows role-scoped routes; fuzzy filter; keyboard nav.
 * Owner:   Pranav
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";

interface PaletteItem {
  label: string;
  href: string;
  group: string;
}

const ROUTES: Record<UserRole, PaletteItem[]> = {
  MAIN_ADMIN: [
    { label: "Overview",         href: "/dashboard/admin",                  group: "Admin" },
    { label: "Schools",          href: "/dashboard/admin/schools",          group: "Admin" },
    { label: "New School",       href: "/dashboard/admin/schools/new",      group: "Admin" },
    { label: "Users",            href: "/dashboard/admin/users",            group: "Admin" },
    { label: "Sub-Admins",       href: "/dashboard/admin/sub-admins",       group: "Admin" },
    { label: "Quizzes",          href: "/dashboard/admin/quizzes",          group: "Quiz" },
    { label: "Quiz Approvals",   href: "/dashboard/admin/quiz-approvals",   group: "Quiz" },
    { label: "Marketplace",      href: "/dashboard/admin/marketplace",      group: "Content" },
    { label: "Reports",          href: "/dashboard/admin/reports",          group: "Insights" },
    { label: "Analytics",        href: "/dashboard/admin/analytics",        group: "Insights" },
    { label: "Settings",         href: "/dashboard/admin/settings",         group: "System" },
  ],
  SUB_ADMIN: [
    { label: "Assigned Tasks",   href: "/dashboard/sub-admin",                     group: "Tasks" },
    { label: "Schools",          href: "/dashboard/sub-admin/schools",             group: "Schools" },
    { label: "New Principal",    href: "/dashboard/sub-admin/users/new/principal", group: "Users" },
    { label: "New Teacher",      href: "/dashboard/sub-admin/users/new/teacher",   group: "Users" },
    { label: "Question Bank",    href: "/dashboard/sub-admin/question-bank",       group: "Quiz" },
    { label: "New Quiz",         href: "/dashboard/sub-admin/quizzes/new",         group: "Quiz" },
    { label: "Quiz Approvals",   href: "/dashboard/sub-admin/quizzes",             group: "Quiz" },
    { label: "Analytics",        href: "/dashboard/sub-admin/analytics",           group: "Insights" },
    { label: "Reports",          href: "/dashboard/sub-admin/reports",             group: "Insights" },
  ],
  PRINCIPAL: [
    { label: "School Overview",  href: "/dashboard/principal",            group: "School" },
    { label: "Teachers",         href: "/dashboard/principal/teachers",   group: "People" },
    { label: "Students",         href: "/dashboard/principal/students",   group: "People" },
    { label: "Classes",          href: "/dashboard/principal/classes",    group: "Academics" },
    { label: "Analytics",        href: "/dashboard/principal/analytics",  group: "Insights" },
    { label: "Reports",          href: "/dashboard/principal/reports",    group: "Insights" },
    { label: "AI Summary",       href: "/dashboard/principal/ai-summary", group: "Insights" },
  ],
  TEACHER: [
    { label: "My Classes",       href: "/dashboard/teacher",            group: "Teaching" },
    { label: "Quizzes",          href: "/dashboard/teacher/quizzes",    group: "Quiz" },
    { label: "New Quiz",         href: "/dashboard/teacher/quizzes/new", group: "Quiz" },
    { label: "Students",         href: "/dashboard/teacher/students",   group: "People" },
    { label: "Feedback",         href: "/dashboard/teacher/feedback",   group: "Feedback" },
    { label: "Analytics",        href: "/dashboard/teacher/analytics",  group: "Insights" },
    { label: "Reports",          href: "/dashboard/teacher/reports",    group: "Insights" },
    { label: "AI Tools",         href: "/dashboard/teacher/ai-tools",   group: "AI" },
  ],
  STUDENT: [
    { label: "My Learning",      href: "/dashboard/student",              group: "Learning" },
    { label: "Quizzes",          href: "/dashboard/student/quizzes",      group: "Quiz" },
    { label: "Results",          href: "/dashboard/student/results",      group: "Quiz" },
    { label: "Rankings",         href: "/dashboard/student/rankings",     group: "Insights" },
    { label: "Progress",         href: "/dashboard/student/progress",     group: "Insights" },
    { label: "Certificates",     href: "/dashboard/student/certificates", group: "Achievements" },
    { label: "Career Pilot",     href: "/dashboard/student/career",       group: "AI" },
    { label: "Exam Alerts",      href: "/dashboard/student/exam-alerts",  group: "Reminders" },
    { label: "Content Library",  href: "/dashboard/student/content",      group: "Library" },
  ],
};

function fuzzyMatch(query: string, label: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const l = label.toLowerCase();
  if (l.includes(q)) return true;
  let i = 0;
  for (const ch of l) {
    if (ch === q[i]) i++;
    if (i === q.length) return true;
  }
  return false;
}

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    if (!user) return [];
    return ROUTES[user.role] ?? [];
  }, [user]);

  const filtered = useMemo(
    () => items.filter((it) => fuzzyMatch(query, it.label) || fuzzyMatch(query, it.group)),
    [items, query]
  );

  // Reset highlight when query/list changes
  useEffect(() => { setActive(0); }, [query, open]);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Cmd/Ctrl+K toggle
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onTrigger() { setOpen(true); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("skillship:open-palette", onTrigger);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("skillship:open-palette", onTrigger);
    };
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const close = useCallback(() => { setOpen(false); setQuery(""); }, []);

  const select = useCallback(
    (item: PaletteItem) => {
      close();
      router.push(item.href);
    },
    [close, router]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { close(); return; }
    if (filtered.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % filtered.length); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setActive((i) => (i - 1 + filtered.length) % filtered.length); }
    else if (e.key === "Enter")     { e.preventDefault(); select(filtered[active]); }
  };

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    filtered.forEach((it) => {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Build flat-index lookup for highlight
  const flatIndex = (group: string, label: string) =>
    filtered.findIndex((it) => it.group === group && it.label === label);

  if (!user) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_30px_80px_-30px_rgba(5,150,105,0.35)] dark:bg-[var(--background)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)]">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Jump to…"
                className="h-12 flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
              />
              <kbd className="hidden rounded-md border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)] sm:inline-block">ESC</kbd>
            </div>

            <div className="max-h-[55vh] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">No matches.</p>
              ) : (
                grouped.map(([group, list]) => (
                  <div key={group} className="px-2">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{group}</p>
                    {list.map((it) => {
                      const idx = flatIndex(it.group, it.label);
                      const isActive = idx === active;
                      return (
                        <button
                          key={it.href}
                          type="button"
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => select(it)}
                          className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-[var(--foreground)] hover:bg-[var(--muted)]"}`}
                        >
                          <span className="font-medium">{it.label}</span>
                          {isActive && (
                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">↵ Open</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--muted)]/40 px-4 py-2 text-[11px] text-[var(--muted-foreground)]">
              <span className="flex items-center gap-2">
                <kbd className="rounded border border-[var(--border)] bg-white px-1.5 py-0.5 font-semibold dark:bg-[var(--background)]">↑↓</kbd> navigate
                <kbd className="rounded border border-[var(--border)] bg-white px-1.5 py-0.5 font-semibold dark:bg-[var(--background)]">↵</kbd> open
              </span>
              <span>
                <kbd className="rounded border border-[var(--border)] bg-white px-1.5 py-0.5 font-semibold dark:bg-[var(--background)]">⌘ K</kbd> toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
