"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";

type Period = "7D" | "30D" | "90D" | "YTD";
type ReportCategory = "Usage" | "Performance" | "Finance" | "Compliance";

interface Report {
  title: string;
  description: string;
  category: ReportCategory;
  updated: string;
  size: string;
  periods: Period[];
}

const reports: Report[] = [
  { title: "Monthly Platform Usage", description: "Active users, session length and feature adoption", category: "Usage", updated: "Mar 31, 2026", size: "2.4 MB", periods: ["30D", "90D", "YTD"] },
  { title: "Weekly Active Users", description: "DAU/WAU breakdown and drop-off analysis", category: "Usage", updated: "Apr 7, 2026", size: "1.2 MB", periods: ["7D", "30D"] },
  { title: "Student Performance Digest", description: "Score distribution, quiz attempts, improvement cohorts", category: "Performance", updated: "Mar 30, 2026", size: "5.1 MB", periods: ["30D", "90D", "YTD"] },
  { title: "School Revenue Breakdown", description: "Revenue by plan, region and school onboarding month", category: "Finance", updated: "Mar 30, 2026", size: "1.8 MB", periods: ["30D", "90D", "YTD"] },
  { title: "Workshop Booking Analytics", description: "Enrollment, completion rate and NPS per workshop", category: "Performance", updated: "Mar 28, 2026", size: "3.2 MB", periods: ["7D", "30D", "90D", "YTD"] },
  { title: "Data Retention Audit", description: "Records scheduled for deletion per DPDP policy", category: "Compliance", updated: "Mar 25, 2026", size: "760 KB", periods: ["30D", "90D", "YTD"] },
  { title: "SubAdmin Activity Log", description: "Approvals, school assignments and override actions", category: "Compliance", updated: "Mar 24, 2026", size: "1.1 MB", periods: ["7D", "30D", "90D", "YTD"] },
];

const periods: Period[] = ["7D", "30D", "90D", "YTD"];

const categoryColor: Record<ReportCategory, string> = {
  Usage: "bg-primary/10 text-primary border-primary/20",
  Performance: "bg-teal-50 text-teal-700 border-teal-200",
  Finance: "bg-amber-50 text-amber-700 border-amber-200",
  Compliance: "bg-violet-50 text-violet-700 border-violet-200",
};

export default function ReportsPage() {
  const toast = useToast();
  const [activePeriod, setActivePeriod] = useState<Period>("30D");
  const [builderOpen, setBuilderOpen] = useState(false);

  useEffect(() => {
    document.title = "Reports — Skillship";
  }, []);

  const filteredReports = reports.filter((r) => r.periods.includes(activePeriod));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generated reports and one-click exports for stakeholders"
        action={
          <button
            onClick={() => setBuilderOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Create Custom Report
          </button>
        }
      />

      <CustomReportBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSubmit={(payload) => {
          setBuilderOpen(false);
          toast(`Report "${payload.name}" queued — backend generation lands in Phase 03.`, "info");
        }}
      />

      {/* Quick export cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Export Users", description: "CSV · All roles", icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>) },
          { label: "Export Schools", description: "CSV · Active schools", icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /></svg>) },
          { label: "Export Revenue", description: "PDF · Last 12 months", icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12m-12 5 8.5 8" /><path d="M6 13h3a5 5 0 0 0 0-10" /></svg>) },
        ].map((e, i) => (
          <motion.button
            key={e.label}
            type="button"
            disabled
            title="Backend export pipeline ships in Phase 03"
            onClick={() => toast(`${e.label} export — Phase 03`, "info")}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
            className="group flex cursor-not-allowed items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 p-4 text-left opacity-80"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:text-white">
              {e.icon}
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--foreground)]">{e.label}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{e.description}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)] transition-colors group-hover:text-primary">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </motion.button>
        ))}
      </div>

      {/* Reports list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      >
        <div className="flex flex-col items-start justify-between gap-3 border-b border-[var(--border)] p-5 md:flex-row md:items-center">
          <div>
            <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Recent Reports</h3>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Automatically generated and archived · {filteredReports.length} reports</p>
          </div>
          {/* Time period selector */}
          <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--muted)]/40 p-1">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  activePeriod === p
                    ? "bg-gradient-to-r from-primary to-accent text-white"
                    : "text-[var(--muted-foreground)] hover:text-primary"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--muted-foreground)]">No reports available for this period.</p>
        ) : (
          <AnimatePresence mode="popLayout">
          <ul className="divide-y divide-[var(--border)]/60">
            {filteredReports.map((r, i) => (
              <motion.li
                layout
                key={r.title}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.35 + i * 0.04 }}
                className="flex flex-col gap-3 p-5 transition-colors hover:bg-[var(--muted)]/30 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[var(--foreground)]">{r.title}</p>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${categoryColor[r.category]}`}>
                        {r.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{r.description}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Updated {r.updated} · {r.size}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled
                    title="Preview ships in Phase 03"
                    onClick={() => toast(`Preview for "${r.title}" — Phase 03`, "info")}
                    className="h-9 cursor-not-allowed rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 text-xs font-semibold text-[var(--muted-foreground)] opacity-80"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Download enables when /analytics/exports/ ships"
                    onClick={() => toast(`Download for "${r.title}" — Phase 03`, "info")}
                    className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 text-xs font-semibold text-[var(--muted-foreground)] opacity-80"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    Soon
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}

// ── Custom Report Builder Modal ────────────────────────────────
type BuilderFormat = "PDF" | "Excel" | "CSV";
type BuilderColumn =
  | "schools"
  | "students"
  | "teachers"
  | "quizzes"
  | "revenue"
  | "engagement"
  | "regional";

interface BuilderPayload {
  name: string;
  category: ReportCategory;
  startDate: string;
  endDate: string;
  format: BuilderFormat;
  columns: BuilderColumn[];
}

const BUILDER_COLUMNS: { key: BuilderColumn; label: string }[] = [
  { key: "schools",    label: "Schools" },
  { key: "students",   label: "Students" },
  { key: "teachers",   label: "Teachers" },
  { key: "quizzes",    label: "Quizzes" },
  { key: "revenue",    label: "Revenue" },
  { key: "engagement", label: "Engagement" },
  { key: "regional",   label: "Regional split" },
];

function CustomReportBuilder({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: BuilderPayload) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ReportCategory>("Usage");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState<BuilderFormat>("PDF");
  const [columns, setColumns] = useState<BuilderColumn[]>(["schools", "students"]);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  function toggleColumn(c: BuilderColumn) {
    setColumns((cur) => cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Report name is required."); return; }
    if (!startDate || !endDate) { setError("Pick a start and end date."); return; }
    if (new Date(startDate) > new Date(endDate)) { setError("Start date must be before end date."); return; }
    if (columns.length === 0) { setError("Select at least one column."); return; }
    onSubmit({ name: name.trim(), category, startDate, endDate, format, columns });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Custom report builder"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)]"
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
          <form onSubmit={handleSubmit} className="space-y-5 p-6 md:p-7">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Custom report</h3>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Configure scope, columns, and format. Generation lands once the export pipeline ships.
              </p>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Report name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q1 Schools onboarding digest"
                className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReportCategory)}
                  className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]"
                >
                  <option>Usage</option>
                  <option>Performance</option>
                  <option>Finance</option>
                  <option>Compliance</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Format</label>
                <div className="flex gap-2">
                  {(["PDF", "Excel", "CSV"] as BuilderFormat[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                        format === f
                          ? "border-primary bg-primary text-white"
                          : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-primary/30 hover:text-primary dark:bg-[var(--background)]"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">End date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Columns</label>
              <div className="flex flex-wrap gap-2">
                {BUILDER_COLUMNS.map((c) => {
                  const active = columns.includes(c.key);
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => toggleColumn(c.key)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-primary/30 hover:text-primary dark:bg-[var(--background)]"
                      }`}
                    >
                      {active && "✓ "}{c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </p>
            )}

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
              Generation pipeline ships in <strong>Phase 03</strong>. Submit to queue this report definition; it&apos;ll run as soon as the export service goes live.
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
              >
                Queue report
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
