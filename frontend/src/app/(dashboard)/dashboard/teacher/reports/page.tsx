/*
 * File:    frontend/src/app/(dashboard)/dashboard/teacher/reports/page.tsx
 * Purpose: Teacher class reports — class picker, PDF/XLSX export, quiz summary table.
 * Owner:   Navanish (Phase ship — replaces "Download — soon" placeholder)
 *
 * Wired to:
 *   - GET /api/v1/academics/classes/                                   (class picker)
 *   - GET /api/v1/quizzes/                                             (quiz summary table)
 *   - GET /api/v1/analytics/reports/class/<id>/export/?fmt=pdf|xlsx    (download)
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { getToken, API_BASE } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";

type Period = "7D" | "30D" | "90D" | "YTD";
type Fmt = "pdf" | "xlsx";

interface AcademicClass {
  id: string;
  class_name: string;
  subject: string;
}

interface Quiz {
  id: string;
  title: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  created_at: string;
}

const PERIODS: Period[] = ["7D", "30D", "90D", "YTD"];

const statusBadge: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-700",
  REVIEW: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

function periodToRange(p: Period): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now);
  if (p === "7D") from.setDate(now.getDate() - 7);
  else if (p === "30D") from.setDate(now.getDate() - 30);
  else if (p === "90D") from.setDate(now.getDate() - 90);
  else from.setMonth(0, 1);
  return { from: from.toISOString().slice(0, 10), to };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function TeacherReportsPage() {
  const toast = useToast();
  const [classes, setClasses] = useState<AcademicClass[] | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [activePeriod, setActivePeriod] = useState<Period>("30D");
  const [downloading, setDownloading] = useState<Fmt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) {
      setError("Session expired. Please log in again.");
      setClasses([]); setQuizzes([]);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [classRes, quizRes] = await Promise.all([
        fetch(`${API_BASE}/academics/classes/`, { headers }),
        fetch(`${API_BASE}/quizzes/`, { headers }),
      ]);
      if (!classRes.ok) throw new Error(`Classes fetch failed: ${classRes.status}`);
      if (!quizRes.ok) throw new Error(`Quizzes fetch failed: ${quizRes.status}`);

      const classData = asArray<AcademicClass>(await classRes.json());
      const quizData = asArray<Quiz>(await quizRes.json());
      setClasses(classData);
      setQuizzes(quizData);
      if (classData[0] && !selectedClass) setSelectedClass(classData[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report data.");
      setClasses([]); setQuizzes([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = "Class Reports — Skillship";
  }, []);

  useEffect(() => { load(); }, [load]);

  async function download(fmt: Fmt) {
    if (!selectedClass) {
      toast("Pick a class first.", "error");
      return;
    }
    setDownloading(fmt);
    try {
      const token = await getToken();
      if (!token) { toast("Session expired.", "error"); return; }
      const { from, to } = periodToRange(activePeriod);
      const res = await fetch(
        `${API_BASE}/analytics/reports/class/${selectedClass}/export/?fmt=${fmt}&from=${from}&to=${to}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(body?.detail ?? `Download failed (${res.status})`, "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const klass = classes?.find((c) => c.id === selectedClass);
      const safeName = (klass?.class_name ?? "class").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
      a.href = url;
      a.download = `class-${safeName}-${from}-${to}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast(`Downloaded ${fmt.toUpperCase()} report.`, "success");
    } catch {
      toast("Network error.", "error");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Class Reports</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Quiz performance and student progress for your classes
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Class selector + period + download */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="class-picker" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Class
            </label>
            {classes === null ? (
              <div className="h-9 w-48 animate-pulse rounded-xl bg-[var(--muted)]" />
            ) : classes.length === 0 ? (
              <select id="class-picker" disabled className="rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
                <option>No classes assigned</option>
              </select>
            ) : (
              <select
                id="class-picker"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:bg-[var(--background)]"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.class_name} — {c.subject}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Period</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActivePeriod(p)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    activePeriod === p
                      ? "bg-primary text-white"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/70"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!selectedClass || downloading !== null}
              onClick={() => download("pdf")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              {downloading === "pdf" ? "Generating PDF…" : "Download PDF"}
            </button>
            <button
              type="button"
              disabled={!selectedClass || downloading !== null}
              onClick={() => download("xlsx")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              {downloading === "xlsx" ? "Generating Excel…" : "Download Excel"}
            </button>
          </div>
        </div>
      </div>

      {/* No classes empty state */}
      {classes !== null && classes.length === 0 && (
        <EmptyState
          title="No classes assigned yet"
          description="Ask your principal to set up classes in Class Management — once assigned, you'll see per-class quiz summaries and exports here."
          icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /></svg>}
        />
      )}

      {/* Quiz summary table */}
      {(classes === null || classes.length > 0) && (
        <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
          <div className="border-b border-[var(--border)] p-5">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Quiz Summary</h2>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              All quizzes in your school. Use the report download above for per-class metrics.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {quizzes === null ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border)]/50">
                      <td className="px-5 py-3"><div className="h-4 w-44 animate-pulse rounded bg-[var(--muted)]" /></td>
                      <td className="px-5 py-3"><div className="h-5 w-20 animate-pulse rounded-full bg-[var(--muted)]" /></td>
                      <td className="px-5 py-3"><div className="h-4 w-24 animate-pulse rounded bg-[var(--muted)]" /></td>
                    </tr>
                  ))
                ) : quizzes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">
                      <div className="flex flex-col items-center gap-2">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                        </svg>
                        No quizzes available.
                      </div>
                    </td>
                  </tr>
                ) : (
                  quizzes.map((q) => (
                    <tr key={q.id} className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--muted)]/20">
                      <td className="px-5 py-3 font-medium text-[var(--foreground)]">{q.title}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[q.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[var(--muted-foreground)]">{formatDate(q.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
