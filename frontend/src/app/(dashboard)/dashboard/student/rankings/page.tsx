/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/rankings/page.tsx
 * Purpose: Student Rankings — class leaderboard, your row highlighted.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";

interface RankRow {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  class_name?: string;
  grade?: string;
  section?: string;
  quizzes_attempted?: number;
  avg_score?: number;
  rank?: number;
}

type Scope = "CLASS" | "SCHOOL";

function ordinal(n: number) { const s = ["th","st","nd","rd"], v = n % 100; return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]); }
function initials(name: string) { return (name || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join(""); }

export default function RankingsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<RankRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("CLASS");

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setRows([]); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/rankings/?scope=${scope}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 404) {
        // Fallback: pull /users/?role=STUDENT and sort by avg_score
        const fb = await fetch(`${API_BASE}/users/?role=STUDENT`, { headers: { Authorization: `Bearer ${token}` } });
        if (!fb.ok) { setRows([]); return; }
        const list = asArray<RankRow>(await fb.json())
          .filter((r) => typeof r.avg_score === "number")
          .sort((a, b) => (b.avg_score ?? 0) - (a.avg_score ?? 0))
          .map((r, i) => ({ ...r, rank: i + 1 }));
        setRows(list);
        return;
      }
      if (!res.ok) { setError(`Failed (${res.status})`); setRows([]); return; }
      const data = await res.json();
      setRows(asArray<RankRow>(data));
    } catch {
      setError("Network error.");
      setRows([]);
    }
  }, [scope]);

  useEffect(() => { document.title = "Rankings — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const myRank = useMemo(() => rows?.find((r) => r.id === user?.id), [rows, user?.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Rankings</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{scope === "CLASS" ? "Top students in your class" : "Top students across your school"}</p>
        </div>
        <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 p-1">
          {(["CLASS", "SCHOOL"] as Scope[]).map((s) => (
            <button key={s} type="button" onClick={() => setScope(s)} className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${scope === s ? "bg-white shadow-sm text-[var(--foreground)] dark:bg-[var(--background)]" : "text-[var(--muted-foreground)]"}`}>
              {s === "CLASS" ? "My Class" : "My School"}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* My rank highlight */}
      {myRank && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent p-5 text-white shadow-[0_30px_60px_-20px_rgba(5,150,105,0.4)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-extrabold backdrop-blur">
                {ordinal(myRank.rank ?? 0)}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">Your position</p>
                <p className="text-lg font-bold">{myRank.full_name ?? (`${myRank.first_name ?? ""} ${myRank.last_name ?? ""}`.trim() || "You")}</p>
                <p className="text-xs text-white/85">{myRank.class_name ?? myRank.grade ?? ""}{myRank.section ? ` · ${myRank.section}` : ""}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{typeof myRank.avg_score === "number" ? `${Math.round(myRank.avg_score)}%` : "—"}</p>
              <p className="text-xs text-white/85">{myRank.quizzes_attempted ?? "—"} quizzes</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Class</th>
                <th className="px-6 py-3">Quizzes</th>
                <th className="px-6 py-3">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                    {Array.from({ length: 5 }).map((__, j) => <td key={j} className="px-6 py-3.5"><div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} /></td>)}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8">
                  <EmptyState
                    title="No rankings yet"
                    description="Once classmates start attempting quizzes, the leaderboard will populate here."
                    action={{ label: "Browse quizzes", href: "/dashboard/student/quizzes" }}
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" /><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1-10 0z" /></svg>}
                  />
                </td></tr>
              ) : (
                rows.slice(0, 50).map((r, i) => {
                  const fullName = r.full_name ?? (`${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "—");
                  const isMe = r.id === user?.id;
                  const rank = r.rank ?? i + 1;
                  const rankBg = rank === 1 ? "bg-amber-400 text-white" : rank === 2 ? "bg-slate-400 text-white" : rank === 3 ? "bg-orange-700 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]";
                  return (
                    <tr key={r.id} className={`border-b border-[var(--border)]/60 last:border-0 ${isMe ? "bg-primary/5" : "hover:bg-[var(--muted)]/30"}`}>
                      <td className="px-6 py-3.5"><span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${rankBg}`}>{rank}</span></td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">{initials(fullName)}</div>
                          <div>
                            <p className="font-medium text-[var(--foreground)]">{fullName} {isMe && <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">You</span>}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{r.class_name ?? r.grade ?? "—"}{r.section ? ` · ${r.section}` : ""}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{r.quizzes_attempted ?? "—"}</td>
                      <td className="px-6 py-3.5 font-semibold text-emerald-600">{typeof r.avg_score === "number" ? `${Math.round(r.avg_score)}%` : "—"}</td>
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
