"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface BarChartCardProps {
  title: string;
  subtitle: string;
  data: { label: string; value: number }[];
}

export function BarChartCard({ title, subtitle, data }: BarChartCardProps) {
  const max = Math.max(...data.map((d) => d.value));
  const ticks = [0, Math.round(max / 4), Math.round(max / 2), Math.round((3 * max) / 4), max];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-2xl border border-[var(--border)] bg-white p-5"
    >
      <div>
        <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">{title}</h3>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{subtitle}</p>
      </div>

      {/* Screen reader data table */}
      <table className="sr-only" aria-label={title}>
        <thead><tr><th>Label</th><th>Value</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.label}><td>{d.label}</td><td>{d.value}</td></tr>)}</tbody>
      </table>

      <div aria-hidden="true" className="mt-5 flex h-[220px] items-end gap-2">
        {/* Y ticks */}
        <div className="flex h-full flex-col justify-between py-1 text-[10px] text-[var(--muted-foreground)]">
          {ticks.slice().reverse().map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        <div className="relative flex h-full flex-1 items-end gap-3">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-1">
            {ticks.map((_, i) => (
              <div key={i} className="h-px w-full border-t border-dashed border-[var(--border)]" />
            ))}
          </div>

          {data.map((d, i) => {
            const h = (d.value / max) * 100;
            const isHovered = hoveredIndex === i;
            return (
              <div
                key={d.label}
                className="relative flex flex-1 flex-col items-center justify-end"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-[calc(100%+6px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--foreground)] px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg">
                    {d.label}: {d.value}
                    <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--foreground)]" />
                  </div>
                )}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-full rounded-t-lg bg-gradient-to-t from-primary to-accent transition-opacity ${isHovered ? "opacity-80" : "opacity-100"}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex items-end gap-3 pl-6">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[10px] text-[var(--muted-foreground)]">
            {d.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
