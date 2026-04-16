"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string;
  delta: { value: string; positive?: boolean };
  icon: React.ReactNode;
  tint?: "primary" | "accent" | "violet" | "amber";
  delay?: number;
}

const tintMap = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-teal-100 text-teal-600",
  violet: "bg-violet-100 text-violet-600",
  amber: "bg-amber-100 text-amber-600",
} as const;

export function StatCard({ label, value, delta, icon, tint = "primary", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_20px_40px_-20px_rgba(5,150,105,0.25)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
          <p className="mt-2 text-[26px] font-bold tracking-tight text-[var(--foreground)]">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tintMap[tint]}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-3 flex items-center gap-1 text-[11px] font-medium ${delta.positive === false ? "text-red-500" : "text-primary"}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={delta.positive === false ? "rotate-180" : ""}>
          <path d="m6 17 6-6 4 4 6-6" /><path d="M14 7h8v8" />
        </svg>
        {delta.value}
        <span className="font-normal text-[var(--muted-foreground)]">vs last month</span>
      </p>
    </motion.div>
  );
}
