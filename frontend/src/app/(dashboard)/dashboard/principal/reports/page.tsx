/*
 * File:    frontend/src/app/(dashboard)/dashboard/principal/reports/page.tsx
 * Purpose: Principal reports page — report type cards with phase-3 download notice.
 * Owner:   Pranav
 */

"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

interface ReportType {
  id: string;
  title: string;
  description: string;
  period: string;
  formats: ("PDF" | "Excel")[];
  icon: React.ReactNode;
}

const reportTypes: ReportType[] = [
  {
    id: "school-performance",
    title: "School Performance Summary",
    description: "Overall academic performance across classes, subjects, and assessment periods.",
    period: "Monthly",
    formats: ["PDF", "Excel"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    id: "teacher-activity",
    title: "Teacher Activity Report",
    description: "Quiz creation, content uploads, and class engagement metrics per teacher.",
    period: "Monthly",
    formats: ["PDF"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
  },
  {
    id: "student-progress",
    title: "Student Progress Report",
    description: "Individual and cohort-level progress tracking, quiz scores, and skill growth.",
    period: "Monthly",
    formats: ["PDF", "Excel"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "quiz-completion",
    title: "Quiz Completion Report",
    description: "Completion rates, average scores, and question-level analysis per quiz.",
    period: "Monthly",
    formats: ["Excel"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12 11 14 15 10" /><circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
];

const formatBadge: Record<string, string> = {
  PDF: "bg-red-50 text-red-600 border border-red-200",
  Excel: "bg-green-50 text-green-700 border border-green-200",
};

export default function PrincipalReportsPage() {
  const toast = useToast();

  useEffect(() => {
    document.title = "Reports — Skillship";
  }, []);

  function handleDownload(_reportId: string) {
    toast("Report generation available in Phase 3", "info");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Reports</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Download school performance and compliance reports
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <span className="font-semibold">Heads up —</span> report exports activate when the analytics export service ships in Phase 03. Cards below preview the report types that will be available.
      </div>

      {/* Report cards grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]"
          >
            {/* Icon + title */}
            <div className="mb-4 flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {report.icon}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{report.title}</h3>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{report.description}</p>
              </div>
            </div>

            {/* Period + format badges */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted-foreground)]">
                {report.period}
              </span>
              {report.formats.map((fmt) => (
                <span key={fmt} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${formatBadge[fmt]}`}>
                  {fmt}
                </span>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {report.formats.includes("PDF") && (
                <button
                  type="button"
                  disabled
                  title="PDF export ships in Phase 03"
                  onClick={() => handleDownload(report.id)}
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] opacity-80"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                  PDF — soon
                </button>
              )}
              {report.formats.includes("Excel") && (
                <button
                  type="button"
                  disabled
                  title="Excel export ships in Phase 03"
                  onClick={() => handleDownload(report.id)}
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] opacity-80"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                  Excel — soon
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
