"use client";

// Admin Global Analytics — owner-wide platform analytics.
// Every figure is real, served by GET /api/v1/analytics/platform/ (computed from
// live schools / users / quizzes / quiz attempts). No mock or fabricated data:
// where the data model has no source (e.g. website pageviews / dashboard session
// time) we surface the real equivalent (quiz attempts, avg attempt duration)
// instead of inventing a number.

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { LineChartCard } from "@/components/admin/LineChartCard";
import { BarChartCard } from "@/components/admin/BarChartCard";
import { API_BASE, getToken } from "@/lib/auth";
import { inr } from "@/components/billing/BillingPanel";

// ── Types (match the /analytics/platform/ payload) ─────────────────────────
interface MonthPoint { month: string; label: string; count: number }
interface AttemptPoint extends MonthPoint { avg_score: number }
interface Kpis {
  schools: number;
  students: number;
  teachers: number;
  quizzes: number;
  total_attempts: number;
  avg_score: number;
  pass_rate: number;
  active_students_30d: number;
  avg_quiz_minutes: number;
}
interface PlatformAnalytics {
  kpis: Kpis;
  schools_per_month: MonthPoint[];
  students_per_month: MonthPoint[];
  teachers_per_month: MonthPoint[];
  quizzes_per_month: MonthPoint[];
  attempts_per_month: AttemptPoint[];
  quiz_status: { label: string; count: number }[];
  score_distribution: { bucket: string; count: number }[];
  avg_score_by_subject: { subject: string; avg: number; attempts: number }[];
  regional: { state: string; schools: number; students: number }[];
  engagement: { active_7d: number; active_30d: number; avg_quiz_minutes: number };
}

// ── Revenue types (match the /billing/revenue/ payload) ────────────────────
interface RevenuePerSchool {
  school: string;
  name: string;
  city: string;
  plan: string;
  total_charged: string;
  total_paid: string;
  remaining: string;
}
interface RevenueData {
  totals: {
    total_charged: string;
    total_paid: string;
    total_outstanding: string;
    collected_this_year: string;
    collected_this_month: string;
    school_count: number;
  };
  per_school: RevenuePerSchool[];
  monthly: { month: string; collected: string }[];
  yearly: { year: string; collected: string }[];
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

async function apiFetch<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API error ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number | null | undefined) =>
  typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("en-IN") : "—";

// Real month-over-month delta for the headline cards: the change in new
// onboards this month vs the previous month.
function momDelta(series: MonthPoint[]): { value: string; positive: boolean } {
  const last = series[series.length - 1]?.count ?? 0;
  const prev = series[series.length - 2]?.count ?? 0;
  const diff = last - prev;
  return { value: `${diff >= 0 ? "+" : ""}${diff}`, positive: diff >= 0 };
}

const ICONS = {
  school: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /></svg>,
  student: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  teacher: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>,
  quiz: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12 11 14 15 10" /><circle cx="12" cy="12" r="10" /></svg>,
};

// Small secondary KPI tile (performance / engagement metrics).
function MiniStat({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "emerald" | "amber" | "violet" }) {
  const text = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : tone === "violet" ? "text-violet-600" : "text-[var(--foreground)]";
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${text}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{hint}</p>}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function GlobalAnalyticsPage() {
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rev, setRev] = useState<RevenueData | null>(null);

  useEffect(() => { document.title = "Analytics — Skillship"; }, []);

  useEffect(() => {
    apiFetch<PlatformAnalytics>("/analytics/platform/")
      .then(setData)
      .catch(() => setError("Couldn't load analytics. Check that the backend is running on port 8000."));
    // Revenue is a separate concern (billing app) — fetch it independently so a
    // billing hiccup never blanks the rest of the analytics page.
    apiFetch<RevenueData>("/billing/revenue/").then(setRev).catch(() => setRev(null));
  }, []);

  const k = data?.kpis;

  const seriesData = (s?: MonthPoint[]) => (s ?? []).map((d) => ({ label: d.label, value: d.count }));

  const avgScoreTrend = useMemo(
    () => (data?.attempts_per_month ?? []).map((d) => ({ label: d.label, value: d.avg_score })),
    [data],
  );

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Global Analytics" subtitle="Platform-wide engagement, performance and regional distribution" />
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Analytics"
        subtitle="Platform-wide growth, performance and regional distribution — last 12 months"
      />

      {/* Headline KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Schools" value={fmt(k?.schools)} tint="primary" delay={0.05} icon={ICONS.school}
          delta={data ? momDelta(data.schools_per_month) : { value: "" }} />
        <StatCard label="Total Students" value={fmt(k?.students)} tint="accent" delay={0.1} icon={ICONS.student}
          delta={data ? momDelta(data.students_per_month) : { value: "" }} />
        <StatCard label="Total Teachers" value={fmt(k?.teachers)} tint="violet" delay={0.15} icon={ICONS.teacher}
          delta={data ? momDelta(data.teachers_per_month) : { value: "" }} />
        <StatCard label="Total Quizzes" value={fmt(k?.quizzes)} tint="amber" delay={0.2} icon={ICONS.quiz}
          delta={data ? momDelta(data.quizzes_per_month) : { value: "" }} />
      </div>

      {/* Performance + engagement KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <MiniStat label="Quiz Attempts" value={fmt(k?.total_attempts)} hint="submitted, all-time" />
        <MiniStat label="Average Score" value={k ? `${k.avg_score}%` : "—"} tone="emerald" hint="across all attempts" />
        <MiniStat label="Pass Rate" value={k ? `${k.pass_rate}%` : "—"} tone="amber" hint="met the quiz pass mark" />
        <MiniStat label="Active Students" value={fmt(k?.active_students_30d)} tone="violet" hint="attempted in last 30 days" />
        <MiniStat label="Avg Time / Quiz" value={k && k.avg_quiz_minutes > 0 ? `${k.avg_quiz_minutes} min` : "—"} hint="real attempt duration" />
      </div>

      {!data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[320px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30" />
          ))}
        </div>
      ) : (
        <>
      {/* Growth trends */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LineChartCard title="Schools Onboarded" subtitle="New schools per month" data={seriesData(data.schools_per_month)} />
        <LineChartCard title="Students Onboarded" subtitle="New student accounts per month" data={seriesData(data.students_per_month)} />
      </div>

      {/* Quiz activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BarChartCard title="Quizzes Created" subtitle="New quizzes authored per month" data={seriesData(data.quizzes_per_month)} />
        <LineChartCard title="Quiz Attempts" subtitle="Submitted attempts per month" data={seriesData(data.attempts_per_month)} />
      </div>

      {/* Performance analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LineChartCard title="Average Score Trend" subtitle="Mean score % of submitted attempts, per month" data={avgScoreTrend} yTicks={[0, 25, 50, 75, 100]} />
        <BarChartCard title="Score Distribution" subtitle="How submitted attempts are spread across score bands" data={data.score_distribution.map((d) => ({ label: d.bucket, value: d.count }))} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChartCard title="Average Score by Subject" subtitle="Mean score % per subject (top subjects by attempts)" data={data.avg_score_by_subject.map((d) => ({ label: d.subject, value: d.avg }))} />
        <BarChartCard title="Quizzes by Status" subtitle="Lifecycle state of every quiz on the platform" data={data.quiz_status.map((d) => ({ label: d.label, value: d.count }))} />
      </div>
        </>
      )}

      {/* ── Revenue analytics (money collected, the business backbone) ── */}
      <div className="pt-2">
        <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Revenue</h2>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
          Money actually collected from schools — total, annual, month-wise and per school. Outstanding is what is still owed to us.
        </p>
      </div>

      {!rev ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[92px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MiniStat label="Total Revenue" value={inr(rev.totals.total_paid)} tone="emerald" hint="collected all-time" />
            <MiniStat label="This Year" value={inr(rev.totals.collected_this_year)} tone="emerald" hint="collected in current year" />
            <MiniStat label="This Month" value={inr(rev.totals.collected_this_month)} hint="collected this month" />
            <MiniStat label="Outstanding" value={inr(rev.totals.total_outstanding)} tone="amber" hint="remaining payment owed to us" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BarChartCard
              title="Revenue by Month"
              subtitle="Payments collected per month (₹)"
              data={rev.monthly.map((m) => ({ label: monthLabel(m.month), value: Number(m.collected) }))}
            />
            <BarChartCard
              title="Revenue by Year"
              subtitle="Payments collected per calendar year (₹)"
              data={rev.yearly.map((y) => ({ label: y.year, value: Number(y.collected) }))}
            />
          </div>

          {/* Per-school revenue — collected vs remaining */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
            <div className="border-b border-[var(--border)] p-5">
              <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Revenue by School</h3>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">What each school has paid us and what is still due</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                    <th className="px-5 py-3">School</th>
                    <th className="px-5 py-3 text-right">Charged</th>
                    <th className="px-5 py-3 text-right">Collected</th>
                    <th className="px-5 py-3 text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {rev.per_school.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-[var(--muted-foreground)]">No billing recorded yet.</td></tr>
                  ) : (
                    [...rev.per_school]
                      .sort((a, b) => Number(b.total_paid) - Number(a.total_paid))
                      .map((s) => {
                        const due = Number(s.remaining);
                        return (
                          <tr key={s.school} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                            <td className="px-5 py-3.5 font-semibold text-[var(--foreground)]">{s.name}<span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">{s.city || ""}</span></td>
                            <td className="px-5 py-3.5 text-right text-[var(--muted-foreground)]">{inr(s.total_charged)}</td>
                            <td className="px-5 py-3.5 text-right font-medium text-emerald-600">{inr(s.total_paid)}</td>
                            <td className={`px-5 py-3.5 text-right font-semibold ${due > 0 ? "text-amber-600" : "text-emerald-600"}`}>{inr(s.remaining)}</td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Regional distribution */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      >
        <div className="border-b border-[var(--border)] p-5">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Regional Distribution</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Schools and students by state</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-5 py-3">State</th>
                <th className="px-5 py-3">Schools</th>
                <th className="px-5 py-3">Students</th>
              </tr>
            </thead>
            <tbody>
              {data === null ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                    {Array.from({ length: 3 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5"><div className="h-4 w-24 animate-pulse rounded bg-[var(--muted)]" /></td>
                    ))}
                  </tr>
                ))
              ) : data.regional.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-[var(--muted-foreground)]">No schools yet.</td></tr>
              ) : (
                data.regional.map((r) => (
                  <tr key={r.state} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                    <td className="px-5 py-3.5 font-semibold text-[var(--foreground)]">{r.state}</td>
                    <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{r.schools.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{r.students.toLocaleString("en-IN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
