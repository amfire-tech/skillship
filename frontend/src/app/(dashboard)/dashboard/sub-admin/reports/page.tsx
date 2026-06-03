/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/reports/page.tsx
 * Purpose: Sub-admin report exports — school PDF/XLSX downloads + auto-report list.
 * Owner:   Navanish (Phase ship — replaces "Phase 03 — soon" placeholder)
 *
 * Wired to the same surface as principal/reports — sub-admins are school staff
 * with the same scope as principals for the export endpoints.
 *
 *   - GET /api/v1/auth/me/                                            (resolves school_id)
 *   - GET /api/v1/analytics/reports/school/<id>/export/?fmt=pdf|xlsx  (download)
 *   - GET /api/v1/content/items/?kind=PDF                             (auto-reports list)
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, API_BASE, getToken, getCurrentUser } from "@/lib/auth";
import { asArray } from "@/lib/api";

type Period = "7D" | "30D" | "90D" | "YTD";
type Fmt = "pdf" | "xlsx";

interface AutoReport {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
  file_url?: string;
}

const PERIODS: Period[] = ["7D", "30D", "90D", "YTD"];

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

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function SubAdminReportsPage() {
  const toast = useToast();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [reports, setReports] = useState<AutoReport[] | null>(null);
  const [activePeriod, setActivePeriod] = useState<Period>("30D");
  const [downloading, setDownloading] = useState<Fmt | null>(null);

  useEffect(() => {
    document.title = "Reports — Skillship";
    const user = getCurrentUser();
    setSchoolId(user?.school ?? null);
  }, []);

  const loadReports = useCallback(async () => {
    try {
      const res = await apiFetch(`/content/items/?kind=PDF`);
      const list = res.ok ? asArray<AutoReport>(await res.json()) : [];
      setReports(list.filter((r) => (r.title || "").startsWith("[Auto Report]")));
    } catch {
      setReports([]);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  async function download(fmt: Fmt) {
    if (!schoolId) {
      toast("Could not resolve your school. Try re-logging in.", "error");
      return;
    }
    setDownloading(fmt);
    try {
      const token = await getToken();
      if (!token) { toast("Session expired.", "error"); return; }
      const { from, to } = periodToRange(activePeriod);
      const res = await fetch(
        `${API_BASE}/analytics/reports/school/${schoolId}/export/?fmt=${fmt}&from=${from}&to=${to}`,
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
      a.href = url;
      a.download = `school-report-${from}-${to}.${fmt}`;
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
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Reports</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          School performance exports plus auto-generated monthly PDFs.
        </p>
      </div>

      {/* On-demand school report card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
              <line x1="2" y1="20" x2="22" y2="20" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Comprehensive School Report</h3>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Quiz performance, engagement, skill breakdowns, and at-risk signals across your school for the selected period.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Period</span>
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

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!schoolId || downloading !== null}
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
                disabled={!schoolId || downloading !== null}
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
      </div>

      {/* Auto-generated reports list */}
      <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="border-b border-[var(--border)] p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Auto-Generated Reports</h2>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            Monthly and yearly PDFs produced by the analytics service. New entries appear after the 1st of each month.
          </p>
        </div>
        <div className="divide-y divide-[var(--border)]/60">
          {reports === null ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="h-4 w-72 animate-pulse rounded bg-[var(--muted)]" />
                <div className="h-7 w-20 animate-pulse rounded-xl bg-[var(--muted)]" />
              </div>
            ))
          ) : reports.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">
              No auto-reports yet. The first one is generated on the 1st of next month.
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{r.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Generated {fmtDate(r.created_at)}</p>
                </div>
                {r.file_url ? (
                  <a
                    href={r.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]/40 dark:bg-[var(--background)]"
                  >
                    Open
                  </a>
                ) : (
                  <span className="text-xs text-[var(--muted-foreground)]">No file</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
