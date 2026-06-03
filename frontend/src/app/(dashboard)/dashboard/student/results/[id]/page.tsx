/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/results/[id]/page.tsx
 * Purpose: Result detail — green pass banner, score donut, AI analysis,
 *          certificate row, question review with correct/wrong/explanation.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

interface Attempt {
  id: string;
  quiz_id?: string;
  quiz_title?: string;
  score?: number;
  correct?: number;
  wrong?: number;
  skipped?: number;
  total?: number;
  passed?: boolean;
  rank?: number;
  total_in_class?: number;
  class_name?: string;
  school_name?: string;
  attempted_at?: string;
  created_at?: string;
  certificate_url?: string;
  certificate_id?: string;
  ai_analysis?: string;
  weak_areas?: string[];
  practice_topics?: { title: string; href?: string }[];
  questions?: ResultQuestion[];
}

interface ResultQuestion {
  id: string;
  question_text?: string;
  text?: string;
  options?: string[];
  choices?: string[];
  student_answer?: string | number;
  student_answer_text?: string;
  correct_answer_index?: number;
  correct_answer?: string;
  explanation?: string;
  is_correct?: boolean;
  status?: "CORRECT" | "WRONG" | "SKIPPED";
}

function ordinal(n: number) { const s = ["th","st","nd","rd"], v = n % 100; return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]); }
function fmtDate(iso?: string) { if (!iso) return "—"; try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); } catch { return iso; } }

export default function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/attempts/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setAttempt(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load result.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { document.title = "Result — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const score = typeof attempt?.score === "number" ? Math.round(attempt.score) : null;
  const passed = attempt?.passed ?? (score != null && score >= 50);
  const correct = attempt?.correct ?? 0;
  const wrong = attempt?.wrong ?? 0;
  const skipped = attempt?.skipped ?? 0;
  const total = attempt?.total ?? (correct + wrong + skipped);

  async function shareCertificate() {
    if (!attempt?.certificate_url && !attempt?.certificate_id) {
      toast("No certificate available for this attempt.", "info");
      return;
    }
    const url = attempt.certificate_url ?? `${window.location.origin}/certificates/${attempt.certificate_id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      toast("Certificate link copied", "success");
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      toast("Couldn't copy — open the certificate manually.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/student/results" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <button type="button" onClick={shareCertificate} className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
            {shareCopied ? "Copied!" : "Share Certificate"}
          </button>
          {attempt?.quiz_id && (
            <Link href={`/dashboard/student/quizzes/${attempt.quiz_id}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] hover:border-primary/30 hover:text-primary dark:bg-[var(--background)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              Retry Quiz
            </Link>
          )}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Hero banner */}
      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-[var(--muted)]/60" />
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={`overflow-hidden rounded-2xl bg-gradient-to-br ${passed ? "from-emerald-500 to-emerald-600" : "from-amber-500 to-orange-500"} p-6 text-white shadow-[0_30px_60px_-20px_rgba(16,185,129,0.4)] md:p-7`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" /></svg>
                {passed ? "Quiz Passed!" : "Keep Going"}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Result for &ldquo;{attempt?.quiz_title ?? "Quiz"}&rdquo;</h1>
              <p className="mt-1.5 text-sm text-white/85">
                Attempted on {fmtDate(attempt?.attempted_at ?? attempt?.created_at)}
                {attempt?.class_name ? ` · ${attempt.class_name}` : ""}
                {attempt?.school_name ? ` · ${attempt.school_name}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold md:text-5xl">{score ?? "—"}/100</p>
              {attempt?.rank && <p className="mt-1 text-sm text-white/85">Rank: {ordinal(attempt.rank)}{attempt.total_in_class ? ` of ${attempt.total_in_class}` : ""}</p>}
            </div>
          </div>
        </motion.div>
      )}

      {/* Score breakdown + AI analysis */}
      <div className="grid gap-6 lg:grid-cols-[minmax(260px,1fr)_minmax(0,2fr)]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
          <h2 className="text-center text-base font-bold tracking-tight text-[var(--foreground)]">Score Breakdown</h2>
          <div className="mt-5 flex justify-center">
            <Donut percent={score ?? 0} passed={passed} loading={loading} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <Stat n={correct} label="Correct" tone="text-emerald-600" loading={loading} />
            <Stat n={wrong}   label="Wrong"   tone="text-red-500"     loading={loading} />
            <Stat n={skipped} label="Skipped" tone="text-[var(--muted-foreground)]" loading={loading} />
          </div>
          {total > 0 && <p className="mt-3 text-center text-xs text-[var(--muted-foreground)]">{total} questions total</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-white to-accent/5 dark:from-primary/10 dark:via-[var(--background)] dark:to-accent/10">
          <div className="flex items-center justify-between border-b border-primary/20 px-6 py-4">
            <div className="flex items-center gap-2">
              <span aria-hidden="true">✨</span>
              <span aria-hidden="true">🤖</span>
              <h2 className="text-base font-bold tracking-tight text-primary">AI Analysis of Your Performance</h2>
            </div>
            <span className="rounded-full border border-primary/30 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:bg-[var(--background)]">AI Powered</span>
          </div>
          <div className="space-y-4 p-6">
            {loading ? (
              <>
                <div className="h-4 w-[80%] animate-pulse rounded bg-[var(--muted)]" />
                <div className="h-4 w-[60%] animate-pulse rounded bg-[var(--muted)]" />
              </>
            ) : (
              <>
                {attempt?.ai_analysis ? (
                  <p className="text-sm leading-relaxed text-[var(--foreground)]">{attempt.ai_analysis}</p>
                ) : (
                  <p className="text-sm leading-relaxed text-[var(--foreground)]">
                    {wrong + skipped > 0
                      ? <>You answered <strong>{correct} of {total}</strong> correctly. Review the questions below to learn from the wrong answers.</>
                      : <>Strong attempt — every question correct. Try a harder difficulty next time.</>}
                  </p>
                )}
                {(attempt?.weak_areas?.length ?? 0) > 0 && (
                  <p className="text-sm text-[var(--foreground)]">
                    <span aria-hidden="true">📌</span> Practice topics to strengthen weak areas:
                  </p>
                )}
                {(attempt?.practice_topics?.length ?? 0) > 0 && (
                  <ol className="space-y-1.5">
                    {(attempt?.practice_topics ?? []).slice(0, 5).map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                        {t.href
                          ? <Link href={t.href} className="text-primary hover:underline">{t.title}</Link>
                          : <span className="text-primary">{t.title}</span>}
                      </li>
                    ))}
                  </ol>
                )}
                {(attempt?.certificate_id || attempt?.certificate_url) && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/30 dark:text-amber-300">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="6" /><path d="m9 14 -2 7 5 -3 5 3 -2 -7" /></svg>
                      </span>
                      <div>
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Certificate Earned!</p>
                        <p className="text-xs text-amber-800/80 dark:text-amber-200/80">You&apos;ve qualified for the {attempt?.quiz_title ?? "quiz"} completion certificate.</p>
                      </div>
                    </div>
                    {attempt?.certificate_url ? (
                      <a href={attempt.certificate_url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-amber-500 px-4 text-xs font-semibold text-white hover:bg-amber-600">
                        Download
                      </a>
                    ) : attempt?.certificate_id ? (
                      <Link href={`/dashboard/student/certificates`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-amber-500 px-4 text-xs font-semibold text-white hover:bg-amber-600">
                        View
                      </Link>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Question review */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="border-b border-[var(--border)] px-6 py-5">
          <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">Question Review</h2>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">See correct answers and explanations</p>
        </div>
        <div className="space-y-4 p-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-[var(--muted)]/40" />)
          ) : (attempt?.questions?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">Question-level review not available for this attempt.</p>
          ) : (
            (attempt?.questions ?? []).map((q, i) => {
              const correctText = q.correct_answer ?? (typeof q.correct_answer_index === "number" ? (q.options ?? q.choices ?? [])[q.correct_answer_index] : "");
              const isCorrect = q.is_correct ?? q.status === "CORRECT";
              const studentText = q.student_answer_text ?? (typeof q.student_answer === "number" ? (q.options ?? q.choices ?? [])[q.student_answer] : (typeof q.student_answer === "string" ? q.student_answer : "—"));
              return (
                <div key={q.id} className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isCorrect ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
                      {isCorrect
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>}
                    </span>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Q{i + 1}. {q.question_text ?? q.text ?? "—"}</p>
                  </div>
                  <div className="mt-3 space-y-2 pl-10">
                    <div className={`rounded-lg px-3 py-2 text-sm ${isCorrect ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-red-50 dark:bg-red-500/10"}`}>
                      <span className="font-semibold text-[var(--foreground)]">Your answer:</span>{" "}
                      <span className={isCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}>{studentText || "Skipped"}</span>
                    </div>
                    {!isCorrect && correctText && (
                      <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-500/10">
                        <span className="font-semibold text-[var(--foreground)]">Correct answer:</span>{" "}
                        <span className="text-emerald-700 dark:text-emerald-300">{correctText}</span>
                      </div>
                    )}
                    {q.explanation && (
                      <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm dark:bg-blue-500/10">
                        <span className="font-semibold text-[var(--foreground)]"><span aria-hidden="true">📘</span> Explanation:</span>{" "}
                        <span className="text-[var(--muted-foreground)]">{q.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Donut({ percent, passed, loading }: { percent: number; passed: boolean; loading: boolean }) {
  const r = 60, c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(100, percent));
  const off = c - (filled / 100) * c;
  return (
    <div className="relative h-44 w-44">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgb(248 113 113)" strokeWidth="14" />
        <circle cx="80" cy="80" r={r} fill="none" stroke={passed ? "rgb(16 185 129)" : "rgb(245 158 11)"} strokeWidth="14" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {loading
          ? <div className="h-8 w-16 animate-pulse rounded bg-[var(--muted)]" />
          : (
            <>
              <p className="text-3xl font-bold text-[var(--foreground)]">{percent}<span className="text-base">%</span></p>
              <p className={`text-xs font-bold uppercase tracking-wide ${passed ? "text-emerald-600" : "text-amber-600"}`}>{passed ? "Pass" : "Try Again"}</p>
            </>
          )}
      </div>
    </div>
  );
}

function Stat({ n, label, tone, loading }: { n: number; label: string; tone: string; loading: boolean }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${tone}`}>{loading ? <span className="inline-block h-6 w-8 animate-pulse rounded bg-[var(--muted)]" /> : n}</p>
      <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
    </div>
  );
}
