"use client";

import { motion } from "framer-motion";

const metrics = [
  { label: "API Response Time", value: "142ms", tone: "text-primary" },
  { label: "Quiz Completion Rate", value: "87%", tone: "text-amber-600" },
  { label: "Pending Approvals", value: "14", tone: "text-red-500" },
  { label: "Active Sessions", value: "2,647", tone: "text-violet-600" },
];

export function PlatformHealth() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl border border-[var(--border)] bg-white p-5"
    >
      <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Platform Health</h3>

      <div className="mt-4 space-y-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.08 }}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-[var(--muted-foreground)]">{m.label}</span>
            <span className={`font-bold ${m.tone}`}>{m.value}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
