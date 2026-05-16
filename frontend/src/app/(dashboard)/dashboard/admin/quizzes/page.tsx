"use client";

// Admin Global Quiz Management — quizzes fetched from real API.
// No hardcoded quiz data.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PaginatedResponse } from "@/types";
import { API_BASE, getToken } from "@/lib/auth";

async function apiFetch<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API error ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────
interface Quiz {
  id: string | number;
  title: string;
  subject?: string;
  grade?: string;
  grade_level?: string;
  questions_count?: number;
  question_count?: number;
  total_attempts?: number;
  avg_score?: number | string | null;
  status?: "Published" | "Draft" | "Review" | string;
  updated_at?: string;
  created_at?: string;
}

// ── UI helpers ─────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  Published: "bg-primary/10 text-primary border-primary/20",
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Review: "bg-amber-50 text-amber-700 border-amber-200",
};

const subjectTint: Record<string, string> = {
  Biology: "from-teal-500 to-primary",
  Mathematics: "from-primary to-accent",
  History: "from-amber-500 to-orange-400",
  Physics: "from-violet-500 to-fuchsia-400",
  Chemistry: "from-rose-500 to-red-400",
  English: "from-sky-500 to-cyan-400",
};

function formatAttempts(q: Quiz): string {
  if (q.total_attempts == null) return "—";
  return Number(q.total_attempts).toLocaleString("en-IN");
}

function formatScore(q: Quiz): string {
  if (q.avg_score == null) return "—";
  const n = typeof q.avg_score === "number" ? q.avg_score : parseFloat(q.avg_score as string);
  if (isNaN(n)) return "—";
  return `${Math.round(n)}%`;
}

function formatUpdated(q: Quiz): string {
  const raw = q.updated_at ?? q.created_at;
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return raw;
  }
}

function getQuizStatus(q: Quiz): string {
  return q.status ?? "Draft";
}

function getGrade(q: Quiz): string {
  return q.grade ?? q.grade_level ?? "";
}

function getQuestionCount(q: Quiz): number {
  return q.questions_count ?? q.question_count ?? 0;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="h-3 w-20 rounded bg-slate-200 mb-2" />
      <div className="h-5 w-3/4 rounded bg-slate-200 mb-1" />
      <div className="h-3 w-1/2 rounded bg-slate-200" />
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4">
        <div className="h-8 rounded bg-slate-200" />
        <div className="h-8 rounded bg-slate-200" />
      </div>
    </div>
  );
}

// ── Filter option constants — extended dynamically from quizzes payload ──
const STATIC_SUBJECTS = ["Mathematics", "Biology", "History", "Physics", "Chemistry", "English"];
const STATIC_GRADES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const statuses = ["All Status", "Published", "Review", "Draft"];

// ── Page ───────────────────────────────────────────────────────
export default function GlobalQuizPage() {
  const toast = useToast();
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null); // null = loading
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All Subjects");
  const [grade, setGrade] = useState("All Grades");
  const [status, setStatus] = useState("All Status");

  useEffect(() => {
    document.title = "Quiz Management — Skillship";
  }, []);

  useEffect(() => {
    apiFetch<PaginatedResponse<Quiz> | Quiz[]>("/quizzes/")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        setQuizzes(list);
      })
      .catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to load quizzes:", err);
        }
        setQuizzes([]);
        toast("Failed to load quizzes. Please try again.", "error");
      });
  }, []);

  const subjects = useMemo(() => {
    const set = new Set<string>(STATIC_SUBJECTS);
    (quizzes ?? []).forEach((q) => { if (q.subject) set.add(q.subject); });
    return ["All Subjects", ...Array.from(set).sort()];
  }, [quizzes]);

  const grades = useMemo(() => {
    const set = new Set<string>(STATIC_GRADES);
    (quizzes ?? []).forEach((q) => { const g = getGrade(q); if (g) set.add(g); });
    return ["All Grades", ...Array.from(set).sort((a, b) => {
      const an = parseInt(a.replace(/\D/g, ""), 10) || 0;
      const bn = parseInt(b.replace(/\D/g, ""), 10) || 0;
      return an - bn;
    })];
  }, [quizzes]);

  const filtered = (quizzes ?? []).filter((q) => {
    const q2 = search.toLowerCase();
    const matchSearch = !q2 || q.title.toLowerCase().includes(q2) || (q.subject ?? "").toLowerCase().includes(q2);
    const matchSubject = subject === "All Subjects" || q.subject === subject;
    const matchGrade = grade === "All Grades" || getGrade(q) === grade;
    const matchStatus = status === "All Status" || getQuizStatus(q) === status;
    return matchSearch && matchSubject && matchGrade && matchStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Quiz Management"
        subtitle="All quizzes across subjects, grades and schools"
        action={
          <button
            onClick={() => router.push("/dashboard/admin/quizzes/new")}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            New Quiz
          </button>
        }
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 md:flex-row md:items-center"
      >
        <div className="relative flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes by title or subject…"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 pl-9 pr-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
          {subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={grade} onChange={(e) => setGrade(e.target.value)} className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
          {grades.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
          {statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
      </motion.div>

      {/* Quiz grid */}
      {quizzes === null ? (
        // Loading state — skeleton cards
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={quizzes.length === 0 ? "No quizzes yet" : "No quizzes match"}
          description={quizzes.length === 0 ? "Once teachers and sub-admins publish quizzes, they'll appear here for global review." : "Try adjusting subject, grade, status, or search."}
          action={quizzes.length === 0 ? { label: "Create Quiz", href: "/dashboard/admin/quizzes/new" } : { label: "Reset filters", onClick: () => { setSearch(""); setSubject("All Subjects"); setGrade("All Grades"); setStatus("All Status"); } }}
          icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
                className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_20px_40px_-20px_rgba(5,150,105,0.25)]"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${subjectTint[q.subject ?? ""] ?? "from-primary to-accent"}`} />

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{q.subject ?? "—"}</p>
                    <h3 className="mt-1 text-base font-bold leading-snug text-[var(--foreground)]">{q.title}</h3>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {getGrade(q) ? `${getGrade(q)} · ` : ""}{getQuestionCount(q)} questions
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor[getQuizStatus(q)] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {getQuizStatus(q)}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Attempts</p>
                    <p className="mt-0.5 text-sm font-bold text-[var(--foreground)]">{formatAttempts(q)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Avg score</p>
                    <p className="mt-0.5 text-sm font-bold text-primary">{formatScore(q)}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">Updated {formatUpdated(q)}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push(`/dashboard/admin/quizzes/${q.id}`)}
                      className="min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 font-semibold text-primary transition-colors hover:bg-primary/5"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/admin/quizzes/${q.id}`)}
                      className="min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-primary"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
