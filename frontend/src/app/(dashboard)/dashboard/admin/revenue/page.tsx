/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/revenue/page.tsx
 * Purpose: MAIN_ADMIN revenue analytics — platform-wide billed / collected /
 *          outstanding totals, a monthly collected-revenue chart, and a
 *          per-school table (highest dues first). Data from /billing/revenue/.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";
import { inr } from "@/components/billing/BillingPanel";

interface PerSchool {
  school: string;
  name: string;
  city: string;
  plan: string;
  is_active: boolean;
  total_charged: string;
  total_paid: string;
  remaining: string;
}

interface Revenue {
  totals: {
    total_charged: string;
    total_paid: string;
    total_outstanding: string;
    collected_this_year: string;
    collected_this_month: string;
    school_count: number;
  };
  per_school: PerSchool[];
  monthly: { month: string; collected: string }[];
  yearly: { year: string; collected: string }[];
}

const planLabel: Record<string, string> = { CORE: "Core", AGENTIC: "Agentic" };

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export default function RevenuePage() {
  const [data, setData] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/billing/revenue/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setError("Failed to load revenue."); setLoading(false); return; }
      setData(await res.json());
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="py-24 text-center text-sm text-[var(--muted-foreground)]">Loading revenue…</div>;
  }
  if (error || !data) {
    return <div className="py-24 text-center text-sm text-red-500">{error ?? "No data."}</div>;
  }

  const maxMonth = Math.max(1, ...data.monthly.map((m) => Number(m.collected)));
  const maxYear = Math.max(1, ...data.yearly.map((y) => Number(y.collected)));

  const cards = [
    { label: "Total Collected", value: data.totals.total_paid, tone: "text-emerald-600" },
    { label: "Collected This Year", value: data.totals.collected_this_year, tone: "text-emerald-600" },
    { label: "Collected This Month", value: data.totals.collected_this_month, tone: "text-[var(--foreground)]" },
    { label: "Total Billed", value: data.totals.total_charged, tone: "text-[var(--foreground)]" },
    { label: "Remaining Due (Total)", value: data.totals.total_outstanding, tone: Number(data.totals.total_outstanding) > 0 ? "text-red-500" : "text-emerald-600" },
    { label: "Schools Onboarded", value: String(data.totals.school_count), tone: "text-primary", raw: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">Revenue &amp; Collections</h1>
        <p className="text-xs text-[var(--muted-foreground)]">Billing across every onboarded school — what you charged, what you collected, what is still due.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.tone}`}>{c.raw ? c.value : inr(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Collected revenue — month-wise and annual */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
          <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">Collected Revenue by Month</h2>
          <p className="mb-5 text-xs text-[var(--muted-foreground)]">Payments received, bucketed by month.</p>
          {data.monthly.length === 0 ? (
            <p className="py-8 text-center text-xs text-[var(--muted-foreground)]">No payments recorded yet.</p>
          ) : (
            <div className="flex items-end gap-3 overflow-x-auto pb-2" style={{ minHeight: "11rem" }}>
              {data.monthly.map((m) => {
                const pct = Math.round((Number(m.collected) / maxMonth) * 100);
                return (
                  <div key={m.month} className="flex min-w-[44px] flex-1 flex-col items-center gap-2">
                    <span className="text-[10px] font-semibold text-[var(--muted-foreground)]">{inr(m.collected)}</span>
                    <div className="flex h-32 w-full items-end">
                      <div className="w-full rounded-t-lg bg-primary/80 transition-all" style={{ height: `${Math.max(pct, 2)}%` }} />
                    </div>
                    <span className="text-[10px] text-[var(--muted-foreground)]">{monthLabel(m.month)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
          <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">Collected Revenue by Year</h2>
          <p className="mb-5 text-xs text-[var(--muted-foreground)]">Total payments received each calendar year.</p>
          {data.yearly.length === 0 ? (
            <p className="py-8 text-center text-xs text-[var(--muted-foreground)]">No payments recorded yet.</p>
          ) : (
            <div className="flex items-end gap-4 overflow-x-auto pb-2" style={{ minHeight: "11rem" }}>
              {data.yearly.map((y) => {
                const pct = Math.round((Number(y.collected) / maxYear) * 100);
                return (
                  <div key={y.year} className="flex min-w-[56px] flex-1 flex-col items-center gap-2">
                    <span className="text-[10px] font-semibold text-[var(--muted-foreground)]">{inr(y.collected)}</span>
                    <div className="flex h-32 w-full items-end">
                      <div className="w-full rounded-t-lg bg-emerald-500/80 transition-all" style={{ height: `${Math.max(pct, 2)}%` }} />
                    </div>
                    <span className="text-[10px] text-[var(--muted-foreground)]">{y.year}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Per-school table */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
        <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">Per-School Billing</h2>
        <p className="mb-4 text-xs text-[var(--muted-foreground)]">Charged, collected and remaining payment per school — highest remaining first.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="py-2 pr-3 font-semibold">School</th>
                <th className="py-2 pr-3 font-semibold">Plan</th>
                <th className="py-2 pr-3 text-right font-semibold">Charged</th>
                <th className="py-2 pr-3 text-right font-semibold">Collected</th>
                <th className="py-2 pr-3 text-right font-semibold">Remaining</th>
                <th className="py-2 pl-3" />
              </tr>
            </thead>
            <tbody>
              {data.per_school.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-xs text-[var(--muted-foreground)]">No schools yet.</td></tr>
              )}
              {data.per_school.map((s) => {
                const due = Number(s.remaining);
                return (
                  <tr key={s.school} className="border-b border-[var(--border)]/60">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-[var(--foreground)]">{s.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{s.city || "—"}{!s.is_active && " · Inactive"}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--muted-foreground)]">{planLabel[s.plan] ?? s.plan}</td>
                    <td className="py-2.5 pr-3 text-right text-[var(--foreground)]">{inr(s.total_charged)}</td>
                    <td className="py-2.5 pr-3 text-right text-emerald-600">{inr(s.total_paid)}</td>
                    <td className={`py-2.5 pr-3 text-right font-semibold ${due > 0 ? "text-red-500" : "text-emerald-600"}`}>{inr(s.remaining)}</td>
                    <td className="py-2.5 pl-3 text-right">
                      <Link href={`/dashboard/admin/schools/${s.school}`} className="text-xs font-semibold text-primary hover:underline">Manage</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
