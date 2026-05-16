/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/page.tsx
 * Purpose: Sub-Admin command center — stats, action tasks, schools overview, quiz approvals.
 *          All data from real API. No hardcoded names or mock arrays.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, getToken } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

// ─── Types ───────────────────────────────────────────────────────────────
interface School {
  id: string;
  name: string;
  city?: string;
  state?: string;
  is_active: boolean;
  updated_at?: string;
  student_count?: number;
  principal_name?: string;
  active_at?: string;
}

interface Quiz {
  id: string;
  title: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  created_at: string;
  created_by_name?: string;
  school_name?: string;
}

interface Stats {
  schools: number | null;
  pendingTasks: number | null;
  approvalsPending: number | null;
  activeTeachers: number | null;
}

// ─── Icons ──────────────────────────────────────────────────────────────
const SchoolIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
  </svg>
);
const ClipboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);
const CheckSquareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
const TeachersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const ArrowUpRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="7 17 17 7" /><polyline points="7 7 17 7 17 17" />
  </svg>
);
const ArrowDownRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="7 7 17 17" /><polyline points="17 7 17 17 7 17" />
  </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────────
function relativeTime(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

// ─── Stat Card ───────────────────────────────────────────────────────────
type Tone = "primary" | "amber" | "rose" | "teal";

const toneClass: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: "bg-primary/10",     fg: "text-primary"      },
  amber:   { bg: "bg-amber-100",      fg: "text-amber-600"    },
  rose:    { bg: "bg-rose-100",       fg: "text-rose-600"     },
  teal:    { bg: "bg-teal-100",       fg: "text-teal-600"     },
};

function StatCard({
  label,
  value,
  tone,
  icon,
  delta,
  delay = 0,
}: {
  label: string;
  value: number | null;
  tone: Tone;
  icon: React.ReactNode;
  delta?: { value: string; positive: boolean } | null;
  delay?: number;
}) {
  const t = toneClass[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.bg} ${t.fg}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
        {value === null ? <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-[var(--muted)]" /> : value.toLocaleString("en-IN")}
      </p>
      {delta && (
        <p className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${delta.positive ? "text-emerald-600" : "text-red-500"}`}>
          {delta.positive ? <ArrowUpRight /> : <ArrowDownRight />}
          {delta.value}
        </p>
      )}
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────
export default function SubAdminDashboard() {
  const { displayName } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [schools, setSchools] = useState<School[] | null>(null);
  const [reviewQuizzes, setReviewQuizzes] = useState<Quiz[] | null>(null);
  const [stats, setStats] = useState<Stats>({
    schools: null, pendingTasks: null, approvalsPending: null, activeTeachers: null,
  });
  const TASK_CHECKS_KEY = "skillship-subadmin-task-checks";
  const [taskChecks, setTaskChecks] = useState<Record<string, boolean>>({});

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TASK_CHECKS_KEY);
      if (raw) setTaskChecks(JSON.parse(raw));
    } catch {
      // malformed — ignore
    }
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(TASK_CHECKS_KEY, JSON.stringify(taskChecks));
    } catch {
      // quota error — ignore
    }
  }, [taskChecks]);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [schoolsRes, teachersRes, reviewRes] = await Promise.all([
        fetch(`${API_BASE}/schools/`, { headers }),
        fetch(`${API_BASE}/users/?role=TEACHER`, { headers }),
        fetch(`${API_BASE}/quizzes/?status=REVIEW`, { headers }),
      ]);

      const schoolsData  = schoolsRes.ok  ? await schoolsRes.json()  : null;
      const teachersData = teachersRes.ok ? await teachersRes.json() : null;
      const reviewData   = reviewRes.ok   ? await reviewRes.json()   : null;

      const schoolsList: School[] = schoolsData?.results ?? [];
      const reviewList: Quiz[]    = reviewData?.results  ?? [];
      const teachersCount         = teachersData?.count ?? teachersData?.results?.length ?? 0;
      const approvalsCount        = reviewData?.count   ?? reviewList.length;

      setSchools(schoolsList);
      setReviewQuizzes(reviewList);
      setStats({
        schools:          schoolsData?.count ?? schoolsList.length,
        pendingTasks:     approvalsCount, // tasks = approvals + future task types
        approvalsPending: approvalsCount,
        activeTeachers:   teachersCount,
      });
    } catch {
      // leave loading state — page still shows skeletons
    }
  }, []);

  useEffect(() => {
    document.title = "Sub-Admin Dashboard — Skillship";
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derive tasks from real signals — no fake names.
  const tasks = useMemo(() => {
    if (reviewQuizzes === null || schools === null) return null;

    const list: { id: string; label: string; priority: "High" | "Medium" | "Low"; due: string; href: string }[] = [];

    if (reviewQuizzes.length > 0) {
      list.push({
        id: "task-approvals",
        label: `Review ${reviewQuizzes.length} quiz submission${reviewQuizzes.length === 1 ? "" : "s"}`,
        priority: "High",
        due: "Today",
        href: "/dashboard/sub-admin/quizzes",
      });
    }

    const inactive = schools.filter((s) => !s.is_active);
    if (inactive.length > 0) {
      list.push({
        id: "task-inactive",
        label: `Reactivate ${inactive.length} inactive school${inactive.length === 1 ? "" : "s"}`,
        priority: "Medium",
        due: "This week",
        href: "/dashboard/sub-admin/schools",
      });
    }

    if (schools.length === 0) {
      list.push({
        id: "task-onboard",
        label: "No schools assigned yet — coordinate with admin",
        priority: "High",
        due: "Today",
        href: "/dashboard/sub-admin/schools",
      });
    } else if (schools.length < 3) {
      list.push({
        id: "task-grow",
        label: "Onboard more schools to your territory",
        priority: "Low",
        due: "This month",
        href: "/dashboard/sub-admin/schools",
      });
    }

    if (list.length === 0) {
      list.push({
        id: "task-clear",
        label: "All caught up — no pending actions",
        priority: "Low",
        due: "—",
        href: "/dashboard/sub-admin",
      });
    }

    return list;
  }, [reviewQuizzes, schools]);

  async function decide(quizId: string, action: "approve" | "reject") {
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/${quizId}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "approve" ? "PUBLISHED" : "DRAFT" }),
      });
      if (!res.ok) { toast(`Failed to ${action} quiz`, "error"); return; }
      setReviewQuizzes((prev) => (prev ?? []).filter((q) => q.id !== quizId));
      setStats((s) => ({
        ...s,
        approvalsPending: s.approvalsPending != null ? Math.max(0, s.approvalsPending - 1) : 0,
        pendingTasks:     s.pendingTasks     != null ? Math.max(0, s.pendingTasks     - 1) : 0,
      }));
      toast(action === "approve" ? "Quiz approved" : "Quiz rejected", action === "approve" ? "success" : "info");
    } catch {
      toast("Network error", "error");
    }
  }

  const priorityStyle: Record<"High" | "Medium" | "Low", string> = {
    High:   "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
    Medium: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    Low:    "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  };

  return (
    <div className="space-y-6">
      {/* Greeting (lightweight, screenshot has no header text but page still benefits from one) */}
      <div>
        <h1 className="sr-only">Sub-Admin Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Welcome back, <span className="font-semibold text-[var(--foreground)]">{displayName ?? "Sub Admin"}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned Schools"      value={stats.schools}          tone="primary" icon={<SchoolIcon />}     delay={0.05} />
        <StatCard label="Pending Tasks"         value={stats.pendingTasks}     tone="amber"   icon={<ClipboardIcon />}  delay={0.10} />
        <StatCard label="Quiz Approvals Pending" value={stats.approvalsPending} tone="rose"    icon={<CheckSquareIcon />} delay={0.15} />
        <StatCard label="Active Teachers"        value={stats.activeTeachers}   tone="teal"    icon={<TeachersIcon />}    delay={0.20} />
      </div>

      {/* Tasks + Schools row */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Today's Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]"
        >
          <div className="border-b border-[var(--border)] px-6 py-5">
            <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">Today&apos;s Tasks</h2>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Pending &amp; upcoming actions</p>
          </div>
          <div className="p-4">
            {tasks === null ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-[var(--muted)]/40 p-3">
                    <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-[var(--muted)]" />
                    <div className="h-4 flex-1 animate-pulse rounded bg-[var(--muted)]" />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t) => {
                  const checked = !!taskChecks[t.id];
                  return (
                    <li key={t.id}>
                      <Link
                        href={t.href}
                        className="group flex items-start gap-3 rounded-xl bg-[var(--muted)]/30 px-3 py-3 transition-colors hover:bg-[var(--muted)]/60"
                      >
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setTaskChecks((p) => ({ ...p, [t.id]: !checked })); }}
                          aria-label={checked ? "Mark as not done" : "Mark as done"}
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                            checked
                              ? "border-primary bg-primary text-white"
                              : "border-[var(--border)] bg-white hover:border-primary"
                          }`}
                        >
                          {checked && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium leading-snug ${checked ? "text-[var(--muted-foreground)] line-through" : "text-[var(--foreground)]"}`}>
                            {t.label}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 text-xs">
                            <span className={`rounded-full px-2 py-0.5 font-semibold ${priorityStyle[t.priority]}`}>
                              {t.priority}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[var(--muted-foreground)]">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                              </svg>
                              {t.due}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.div>

        {/* Schools Under Management */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
            <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">Schools Under Management</h2>
            <Link href="/dashboard/sub-admin/schools" className="text-xs font-semibold text-primary hover:underline">View all</Link>
          </div>
          <div className="p-4">
            {schools === null ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-[var(--muted)]/30 p-4">
                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-[var(--muted)]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--muted)]" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--muted)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : schools.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <SchoolIcon />
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">No schools assigned</p>
                <p className="text-xs text-[var(--muted-foreground)]">Coordinate with the platform admin to receive your territory.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {schools.slice(0, 4).map((s) => (
                  <Link
                    key={s.id}
                    href={`/dashboard/sub-admin/schools/${s.id}`}
                    className="group flex items-start gap-3 rounded-xl bg-[var(--muted)]/30 p-4 transition-colors hover:bg-[var(--muted)]/60"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                      {initials(s.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)] group-hover:text-primary">{s.name}</p>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        {s.principal_name ?? ([s.city, s.state].filter(Boolean).join(", ") || "—")}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[var(--muted-foreground)]">
                        {s.student_count != null && <span>{s.student_count.toLocaleString("en-IN")} students</span>}
                        <span className="inline-flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${s.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                          Active {relativeTime(s.active_at ?? s.updated_at)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quiz Submissions Awaiting Approval */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
        className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">Quiz Submissions Awaiting Approval</h2>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Review and approve teacher quiz submissions</p>
          </div>
          {reviewQuizzes && reviewQuizzes.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {reviewQuizzes.length} pending
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-6 py-3">Quiz Title</th>
                <th className="px-6 py-3">Teacher</th>
                <th className="px-6 py-3">School</th>
                <th className="px-6 py-3">Submitted</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {reviewQuizzes === null ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`skel-${i}`} className="border-b border-[var(--border)]/60 last:border-0">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-6 py-3.5">
                          <div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : reviewQuizzes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <CheckSquareIcon />
                        </div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">All caught up</p>
                        <p className="text-xs text-[var(--muted-foreground)]">No quiz submissions waiting for review.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reviewQuizzes.slice(0, 5).map((q) => (
                    <motion.tr
                      key={q.id}
                      layout
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.25 }}
                      className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30"
                    >
                      <td className="px-6 py-3.5 font-medium text-[var(--foreground)]">{q.title}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{q.created_by_name ?? "—"}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{q.school_name ?? "—"}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{relativeTime(q.created_at)}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => decide(q.id, "approve")}
                            className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => decide(q.id, "reject")}
                            className="inline-flex h-8 items-center gap-1 rounded-full bg-red-50 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/15 dark:text-red-300"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(`/dashboard/sub-admin/quizzes/${q.id}`)}
                            aria-label="View quiz"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-primary"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
