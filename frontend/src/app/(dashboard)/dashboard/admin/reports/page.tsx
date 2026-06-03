/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/reports/page.tsx
 * Purpose: Reports console — pick a school, download PDF/XLSX, see auto-generated reports.
 * Owner:   Navanish (Phase 3 rewrite — was static-data placeholder)
 *
 * Wired to:
 *   - GET  /api/v1/schools/                         (school picker)
 *   - GET  /api/v1/analytics/reports/school/<id>/export/?fmt=pdf|xlsx&from=&to=
 *   - GET  /api/v1/content/items/?kind=PDF          (auto-generated PDFs from Phase 2.4)
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";

type Period = "7D" | "30D" | "90D" | "YTD";
type Fmt = "pdf" | "xlsx";

interface School {
  id: string;
  name: string;
  slug: string;
  city?: string;
  state?: string;
}

interface AutoReport {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
  file_url?: string;
  school?: string;
  school_name?: string;
}

const PERIODS: Period[] = ["7D", "30D", "90D", "YTD"];

function periodToRange(p: Period): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now);
  if (p === "7D") from.setDate(now.getDate() - 7);
  else if (p === "30D") from.setDate(now.getDate() - 30);
  else if (p === "90D") from.setDate(now.getDate() - 90);
  else from.setMonth(0, 1); // Jan 1 of current year
  return { from: from.toISOString().slice(0, 10), to };
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

export default function ReportsPage() {
  const toast = useToast();
  const [schools, setSchools] = useState<School[] | null>(null);
  const [schoolId, setSchoolId] = useState<string>("");
  const [reports, setReports] = useState<AutoReport[] | null>(null);
  const [activePeriod, setActivePeriod] = useState<Period>("30D");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [downloading, setDownloading] = useState<Fmt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { document.title = "Reports — Skillship"; }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [sRes, rRes] = await Promise.all([
        apiFetch(`/schools/`),
        apiFetch(`/content/items/?kind=PDF`),
      ]);
      const sList = sRes.ok ? asArray<School>(await sRes.json()) : [];
      setSchools(sList);
      if (sList[0] && !schoolId) setSchoolId(sList[0].id);
      const rList = rRes.ok ? asArray<AutoReport>(await rRes.json()) : [];
      // Auto-generated reports are titled "[Auto Report] ..." by the Celery task.
      setReports(rList.filter((r) => (r.title || "").startsWith("[Auto Report]")));
    } catch {
      setError("Network error. Check that the backend is running on port 8000.");
      setSchools([]); setReports([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedSchool = useMemo(
    () => schools?.find((s) => s.id === schoolId) ?? null,
    [schools, schoolId],
  );

  async function downloadSchoolReport(fmt: Fmt) {
    if (!schoolId) { toast("Pick a school first.", "error"); return; }
    setDownloading(fmt);
    try {
      const { from, to } = periodToRange(activePeriod);
      // Use raw fetch + Blob for binary; apiFetch is fine but we still need to read .blob().
      const token = await getToken();
      if (!token) { toast("Session expired.", "error"); return; }
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
      a.download = `school-${selectedSchool?.slug ?? schoolId}-${from}-${to}.${fmt}`;
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
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="School progress reports — auto-generated monthly + on-demand exports"
        action={
          <button
            onClick={() => setBuilderOpen(true)}
            disabled={!schoolId}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
            Custom Date Range
          </button>
        }
      />

      <CustomDateRangeModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        schoolName={selectedSchool?.name}
        onSubmit={async ({ from, to, fmt }) => {
          setBuilderOpen(false);
          if (!schoolId) return;
          setDownloading(fmt);
          try {
            const token = await getToken();
            if (!token) { toast("Session expired.", "error"); return; }
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
            a.download = `school-${selectedSchool?.slug ?? schoolId}-${from}-${to}.${fmt}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast("Report downloaded.", "success");
          } catch { toast("Network error.", "error"); }
          finally { setDownloading(null); }
        }}
      />

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* School + period picker */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm dark:bg-[var(--background)]">
        <div className="flex-1 min-w-[260px]">
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">School</label>
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            disabled={schools === null}
            className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]"
          >
            {schools === null ? <option>Loading…</option> :
              schools.length === 0 ? <option>No schools</option> :
              schools.map((s) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` · ${s.city}` : ""}</option>)
            }
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Period</label>
          <div className="mt-1 flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--muted)]/40 p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setActivePeriod(p)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${activePeriod === p ? "bg-gradient-to-r from-primary to-accent text-white" : "text-[var(--muted-foreground)] hover:text-primary"}`}
              >{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick export cards — live downloads */}
      <div className="grid gap-4 md:grid-cols-2">
        {([
          { fmt: "pdf"  as Fmt, label: "School Progress — PDF",   description: `${selectedSchool?.name ?? "Selected school"} · ${activePeriod}`,  tone: "from-primary to-accent" },
          { fmt: "xlsx" as Fmt, label: "School Progress — Excel", description: `Multi-sheet · ${activePeriod}`,                                  tone: "from-amber-400 to-amber-600" },
        ]).map((e) => (
          <button
            key={e.fmt}
            type="button"
            onClick={() => downloadSchoolReport(e.fmt)}
            disabled={!schoolId || downloading !== null}
            className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[var(--background)]"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${e.tone} text-white`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--foreground)]">{e.label}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{e.description}</p>
            </div>
            <span className="text-xs font-semibold text-primary">
              {downloading === e.fmt ? "Preparing…" : "Download →"}
            </span>
          </button>
        ))}
      </div>

      {/* Auto-generated reports list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white dark:bg-[var(--background)]"
      >
        <div className="flex flex-col items-start justify-between gap-3 border-b border-[var(--border)] p-5 md:flex-row md:items-center">
          <div>
            <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Auto-Generated Reports</h3>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Celery generates one PDF per school on the 1st of each month and on Jan 1 each year.
            </p>
          </div>
        </div>

        {reports === null ? (
          <ul className="divide-y divide-[var(--border)]/60">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 p-5">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-[var(--muted)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--muted)]" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--muted)]/60" />
                </div>
              </li>
            ))}
          </ul>
        ) : reports.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No auto-reports yet"
              description="Monthly reports generate on the 1st of each month. Use the Custom Date Range button above to grab one right now."
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>}
            />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <ul className="divide-y divide-[var(--border)]/60">
              {reports.map((r, i) => (
                <motion.li
                  layout
                  key={r.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 + i * 0.04 }}
                  className="flex flex-col gap-3 p-5 transition-colors hover:bg-[var(--muted)]/30 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--foreground)]">{r.title}</p>
                      {r.description && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{r.description}</p>}
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Generated {fmtDate(r.created_at)}</p>
                    </div>
                  </div>
                  {r.file_url ? (
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-4 text-xs font-semibold text-[var(--foreground)] hover:border-primary hover:text-primary dark:bg-[var(--background)]"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                      Download
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--muted-foreground)]">No file</span>
                  )}
                </motion.li>
              ))}
            </ul>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}

// ─── Custom date-range modal ─────────────────────────────────────────────────

function CustomDateRangeModal({
  open,
  onClose,
  onSubmit,
  schoolName,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { from: string; to: string; fmt: Fmt }) => void;
  schoolName?: string | null;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fmt, setFmt] = useState<Fmt>("pdf");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!from || !to) { setError("Pick a start and end date."); return; }
    if (new Date(from) > new Date(to)) { setError("Start date must be before end date."); return; }
    onSubmit({ from, to, fmt });
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label="Custom date range">
        <motion.div initial={{ scale: 0.96, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.22 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)] dark:bg-[var(--background)]">
          <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Custom date range</h3>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Generate a school progress report for {schoolName ?? "the selected school"} over a custom window.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">From</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">To</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Format</label>
              <div className="mt-1 flex gap-2">
                {(["pdf", "xlsx"] as Fmt[]).map((f) => (
                  <button key={f} type="button" onClick={() => setFmt(f)} className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${fmt === f ? "border-primary bg-primary text-white" : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-primary/30 hover:text-primary dark:bg-[var(--background)]"}`}>{f.toUpperCase()}</button>
                ))}
              </div>
            </div>
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
            <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
              <button type="button" onClick={onClose} className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary dark:bg-[var(--background)]">Cancel</button>
              <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)]">Download</button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
