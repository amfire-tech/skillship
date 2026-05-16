/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/results/page.tsx
 * Purpose: Student My Results list — every attempt, score, rank, date.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";

interface Attempt {
  id: string;
  quiz_id?: string;
  quiz_title?: string;
  quiz_subject?: string;
  score?: number;
  correct?: number;
  wrong?: number;
  skipped?: number;
  total?: number;
  rank?: number;
  total_in_class?: number;
  attempted_at?: string;
  created_at?: string;
  passed?: boolean;
}

function ordinal(n: number) { const s = ["th","st","nd","rd"], v = n % 100; return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]); }
function fmtDate(iso?: string) { if (!iso) return "—"; try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return iso; } }

export default function MyResultsPage() {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PASS" | "FAIL">("ALL");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setAttempts([]); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/attempts/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setError(`Failed (${res.status})`); setAttempts([]); return; }
      const list = asArray<Attempt>(await res.json());
      list.sort((a, b) => new Date(b.attempted_at ?? b.created_at ?? "").getTime() - new Date(a.attempted_at ?? a.created_at ?? "").getTime());
      setAttempts(list);
    } catch {
      setError("Network error.");
      setAttempts([]);
    }
  }, []);

  useEffect(() => { document.title = "My Results — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!attempts) return null;
    const q = search.trim().toLowerCase();
    return attempts.filter((a) => {
      const passed = a.passed ?? (typeof a.score === "number" && a.score >= 50);
      const okF = filter === "ALL" || (filter === "PASS" ? passed : !passed);
      const okS = !q || (a.quiz_title ?? "").toLowerCase().includes(q) || (a.quiz_subject ?? "").toLowerCase().includes(q);
      return okF && okS;
    });
  }, [attempts, filter, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">My Results</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{attempts === null ? "Loading…" : `${attempts.length} quiz attempt${attempts.length === 1 ? "" : "s"}`}</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm dark:bg-[var(--background)]">
        <div className="relative min-w-[260px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </span>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by quiz title or subject…" className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:focus:bg-[var(--background)]" />
        </div>
        <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-1">
          {(["ALL", "PASS", "FAIL"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${filter === f ? "bg-white text-[var(--foreground)] shadow-sm dark:bg-[var(--background)]" : "text-[var(--muted-foreground)]"}`}>
              {f === "ALL" ? "All" : f === "PASS" ? "Passed" : "Needs review"}
            </button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-6 py-3">Quiz</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Correct / Wrong</th>
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered === null ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                    {Array.from({ length: 6 }).map((__, j) => <td key={j} className="px-6 py-3.5"><div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8">
                  <EmptyState
                    title={attempts?.length === 0 ? "No attempts yet" : "No results match"}
                    description={attempts?.length === 0 ? "Start with a quiz from the Upcoming Quizzes list — your results will appear here." : "Try clearing the search or switching the pass/fail filter."}
                    action={attempts?.length === 0 ? { label: "Browse quizzes", href: "/dashboard/student/quizzes" } : undefined}
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>}
                  />
                </td></tr>
              ) : (
                filtered.map((a) => {
                  const passed = a.passed ?? (typeof a.score === "number" && a.score >= 50);
                  return (
                    <tr key={a.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                      <td className="px-6 py-3.5">
                        <Link href={`/dashboard/student/results/${a.id}`} className="block font-medium text-[var(--foreground)] hover:text-primary">{a.quiz_title ?? "—"}</Link>
                        {a.quiz_subject && <p className="text-xs text-[var(--muted-foreground)]">{a.quiz_subject}</p>}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-bold ${passed ? "text-emerald-600" : "text-red-500"}`}>
                            {typeof a.score === "number" ? `${Math.round(a.score)}%` : "—"}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${passed ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300"}`}>{passed ? "PASS" : "FAIL"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[var(--muted-foreground)]">
                        <span className="font-semibold text-emerald-600">{a.correct ?? "—"}</span>
                        <span className="mx-1">·</span>
                        <span className="font-semibold text-red-500">{a.wrong ?? "—"}</span>
                        {typeof a.skipped === "number" && <><span className="mx-1">·</span><span className="font-semibold text-[var(--muted-foreground)]">{a.skipped} skipped</span></>}
                      </td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{a.rank ? `${ordinal(a.rank)}${a.total_in_class ? ` of ${a.total_in_class}` : ""}` : "—"}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{fmtDate(a.attempted_at ?? a.created_at)}</td>
                      <td className="px-6 py-3.5 text-right">
                        <Link href={`/dashboard/student/results/${a.id}`} className="text-xs font-semibold text-primary hover:underline">View →</Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
