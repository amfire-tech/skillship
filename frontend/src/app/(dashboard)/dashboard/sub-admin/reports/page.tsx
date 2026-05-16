/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/reports/page.tsx
 * Purpose: Sub-admin reports panel — static report types, Download buttons with toast feedback.
 * Owner:   Pranav
 */

"use client";

import { useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

interface ReportType {
  id: string;
  title: string;
  description: string;
  formats: Array<"PDF" | "Excel">;
  cadence: string;
}

const REPORT_TYPES: ReportType[] = [
  {
    id: "school-performance",
    title: "School Performance Summary",
    description: "Overall academic performance across all schools in your territory, including quiz scores and engagement metrics.",
    formats: ["PDF", "Excel"],
    cadence: "Monthly",
  },
  {
    id: "user-activity",
    title: "User Activity Report",
    description: "Login frequency, quiz attempts, and platform engagement for teachers and students.",
    formats: ["PDF"],
    cadence: "Weekly / Monthly",
  },
  {
    id: "quiz-completion",
    title: "Quiz Completion Report",
    description: "Completion rates, average scores, and question-level analysis for all quizzes.",
    formats: ["Excel"],
    cadence: "Monthly",
  },
  {
    id: "marketplace-enrollment",
    title: "Marketplace Enrollment Report",
    description: "Workshop enrollments, purchase history, and content consumption across your schools.",
    formats: ["PDF"],
    cadence: "Monthly",
  },
];

const ChartBarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const ShoppingBagIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ICONS: Record<string, React.ReactNode> = {
  "school-performance":    <ChartBarIcon />,
  "user-activity":         <ActivityIcon />,
  "quiz-completion":       <ClipboardIcon />,
  "marketplace-enrollment":<ShoppingBagIcon />,
};

const FORMAT_BADGE: Record<string, string> = {
  PDF:   "bg-red-50 text-red-600",
  Excel: "bg-green-50 text-green-700",
};

export default function ReportsPage() {
  const toast = useToast();

  useEffect(() => {
    document.title = "Reports — Skillship";
  }, []);

  const handleDownload = useCallback((title: string) => {
    toast(`Report generation for "${title}" is coming in Phase 03`, "info");
  }, [toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Reports</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          School and performance reports for your territory
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-amber-600">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-[13px] text-amber-800">
          Report generation and downloads are scheduled for <strong>Phase 03</strong>. The report types below show what will be available.
        </p>
      </div>

      {/* Report cards — 2-col on md+ */}
      <div className="grid gap-4 md:grid-cols-2">
        {REPORT_TYPES.map((report) => (
          <div
            key={report.id}
            className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {ICONS[report.id]}
              </div>

              <div className="flex-1 min-w-0">
                {/* Title + cadence */}
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    {report.title}
                  </h3>
                  <span className="rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                    {report.cadence}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
                  {report.description}
                </p>

                {/* Format badges + download button */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-1.5">
                    {report.formats.map((fmt) => (
                      <span
                        key={fmt}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${FORMAT_BADGE[fmt]}`}
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled
                    title="Generation activates when the export service ships in Phase 03"
                    onClick={() => handleDownload(report.title)}
                    className="flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-1.5 text-[13px] font-medium text-[var(--muted-foreground)] opacity-80"
                  >
                    <DownloadIcon />
                    Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
