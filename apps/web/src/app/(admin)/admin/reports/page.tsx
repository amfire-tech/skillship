"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";

interface Report {
  title: string;
  description: string;
  category: "Usage" | "Performance" | "Finance" | "Compliance";
  updated: string;
  size: string;
}

const reports: Report[] = [
  { title: "Monthly Platform Usage", description: "Active users, session length and feature adoption", category: "Usage", updated: "Mar 31, 2026", size: "2.4 MB" },
  { title: "Student Performance Digest", description: "Score distribution, quiz attempts, improvement cohorts", category: "Performance", updated: "Mar 30, 2026", size: "5.1 MB" },
  { title: "School Revenue Breakdown", description: "Revenue by plan, region and school onboarding month", category: "Finance", updated: "Mar 30, 2026", size: "1.8 MB" },
  { title: "Workshop Booking Analytics", description: "Enrollment, completion rate and NPS per workshop", category: "Performance", updated: "Mar 28, 2026", size: "3.2 MB" },
  { title: "Data Retention Audit", description: "Records scheduled for deletion per GDPR / DPDP policy", category: "Compliance", updated: "Mar 25, 2026", size: "760 KB" },
  { title: "SubAdmin Activity Log", description: "Approvals, school assignments and override actions", category: "Compliance", updated: "Mar 24, 2026", size: "1.1 MB" },
];

const categoryColor: Record<Report["category"], string> = {
  Usage: "bg-primary/10 text-primary border-primary/20",
  Performance: "bg-teal-50 text-teal-700 border-teal-200",
  Finance: "bg-amber-50 text-amber-700 border-amber-200",
  Compliance: "bg-violet-50 text-violet-700 border-violet-200",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generated reports and one-click exports for stakeholders"
        action={
          <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Create Custom Report
          </button>
        }
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
            className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_40px_-20px_rgba(5,150,105,0.3)]"
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
        <div className="border-b border-[var(--border)] p-5">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Recent Reports</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Automatically generated and archived</p>
        </div>

        <ul className="divide-y divide-[var(--border)]/60">
          {reports.map((r, i) => (
            <motion.li
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
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${categoryColor[r.category]}`}>
                      {r.category}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{r.description}</p>
                  <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                    Updated {r.updated} · {r.size}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button className="h-9 rounded-full border border-[var(--border)] bg-white px-4 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:border-primary/30 hover:text-primary">
                  Preview
                </button>
                <button className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)] transition-all hover:-translate-y-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                  Download
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
