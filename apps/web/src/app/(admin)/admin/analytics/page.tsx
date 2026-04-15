"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { LineChartCard } from "@/components/admin/LineChartCard";
import { BarChartCard } from "@/components/admin/BarChartCard";

const timeRanges = ["7D", "30D", "90D", "1Y"] as const;
type TimeRange = typeof timeRanges[number];

// Engagement data keyed by time range
const engagementByRange: Record<TimeRange, { label: string; value: number }[]> = {
  "7D": [
    { label: "Mon", value: 81 },
    { label: "Tue", value: 84 },
    { label: "Wed", value: 79 },
    { label: "Thu", value: 86 },
    { label: "Fri", value: 88 },
    { label: "Sat", value: 72 },
    { label: "Sun", value: 68 },
  ],
  "30D": [
    { label: "W1", value: 64 },
    { label: "W2", value: 68 },
    { label: "W3", value: 72 },
    { label: "W4", value: 74 },
    { label: "W5", value: 78 },
    { label: "W6", value: 81 },
    { label: "W7", value: 83 },
    { label: "W8", value: 87 },
  ],
  "90D": [
    { label: "Jan", value: 58 },
    { label: "Feb", value: 63 },
    { label: "Mar", value: 71 },
    { label: "Apr", value: 75 },
    { label: "May", value: 80 },
    { label: "Jun", value: 87 },
  ],
  "1Y": [
    { label: "Jan", value: 48 },
    { label: "Feb", value: 52 },
    { label: "Mar", value: 55 },
    { label: "Apr", value: 61 },
    { label: "May", value: 65 },
    { label: "Jun", value: 70 },
    { label: "Jul", value: 74 },
    { label: "Aug", value: 78 },
    { label: "Sep", value: 81 },
    { label: "Oct", value: 84 },
    { label: "Nov", value: 86 },
    { label: "Dec", value: 87 },
  ],
};

// Subject performance (same across ranges — backend will vary)
const subjectPerf = [
  { label: "Math", value: 72 },
  { label: "Sci", value: 81 },
  { label: "Eng", value: 78 },
  { label: "Hist", value: 65 },
  { label: "Geo", value: 70 },
  { label: "Comp", value: 88 },
];

// KPI values keyed by time range
const kpiByRange: Record<TimeRange, { dau: string; quizzes: string; session: string; score: string }> = {
  "7D":  { dau: "39,420", quizzes: "4,280", session: "22m", score: "74%" },
  "30D": { dau: "42,180", quizzes: "18,940", session: "24m", score: "76%" },
  "90D": { dau: "44,600", quizzes: "58,100", session: "25m", score: "77%" },
  "1Y":  { dau: "46,200", quizzes: "2,14,000", session: "26m", score: "78%" },
};

const regionRows = [
  { region: "North India", schools: 158, students: "34,210", active: "82%" },
  { region: "South India", schools: 162, students: "38,600", active: "87%" },
  { region: "West India", schools: 98, students: "22,410", active: "79%" },
  { region: "East India", schools: 52, students: "9,100", active: "74%" },
  { region: "Central India", schools: 32, students: "5,480", active: "71%" },
];

export default function GlobalAnalyticsPage() {
  const [activeRange, setActiveRange] = useState<TimeRange>("30D");
  const kpi = kpiByRange[activeRange];
  const engagementData = engagementByRange[activeRange];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Analytics"
        subtitle="Platform-wide engagement, performance and regional distribution"
        action={
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white p-1">
            {timeRanges.map((r) => (
              <button
                key={r}
                onClick={() => setActiveRange(r)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeRange === r
                    ? "bg-gradient-to-r from-primary to-accent text-white"
                    : "text-[var(--muted-foreground)] hover:text-primary"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Daily Active Users"
          value={kpi.dau}
          delta={{ value: "+9.4%" }}
          tint="primary"
          delay={0.05}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
        />
        <StatCard
          label="Quizzes Attempted"
          value={kpi.quizzes}
          delta={{ value: "+12.1%" }}
          tint="accent"
          delay={0.1}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>}
        />
        <StatCard
          label="Avg. Session Time"
          value={kpi.session}
          delta={{ value: "+3m" }}
          tint="violet"
          delay={0.15}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
        />
        <StatCard
          label="Avg. Quiz Score"
          value={kpi.score}
          delta={{ value: "+1.8pp" }}
          tint="amber"
          delay={0.2}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12 11 14 15 10" /><circle cx="12" cy="12" r="10" /></svg>}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LineChartCard
          key={`engagement-${activeRange}`}
          title={`Student Engagement — ${activeRange}`}
          subtitle="Active rate across all schools"
          data={engagementData}
        />
        <BarChartCard
          title="Average Score by Subject"
          subtitle="Across all students, selected period"
          data={subjectPerf}
        />
      </div>

      {/* Region table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      >
        <div className="border-b border-[var(--border)] p-5">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Regional Distribution</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Schools and student activity across India</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-5 py-3">Region</th>
                <th className="px-5 py-3">Schools</th>
                <th className="px-5 py-3">Students</th>
                <th className="px-5 py-3">Active Rate</th>
                <th className="px-5 py-3">Trend</th>
              </tr>
            </thead>
            <AnimatePresence mode="popLayout">
            <tbody>
              {regionRows.map((r, i) => (
                <motion.tr
                  layout
                  key={r.region}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                  className="border-b border-[var(--border)]/60 last:border-0"
                >
                  <td className="px-5 py-3.5 font-semibold text-[var(--foreground)]">{r.region}</td>
                  <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{r.schools}</td>
                  <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{r.students}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--muted)]">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: r.active }} />
                      </div>
                      <span className="text-xs font-semibold text-primary">{r.active}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <svg width="48" height="20" viewBox="0 0 48 20" className="text-primary">
                      <polyline points="0,14 8,12 16,13 24,8 32,9 40,5 48,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </td>
                </motion.tr>
              ))}
            </tbody>
            </AnimatePresence>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
