"use client";

import { motion } from "framer-motion";

interface LineChartCardProps {
  title: string;
  subtitle: string;
  data: { label: string; value: number }[];
  yTicks?: number[];
}

export function LineChartCard({ title, subtitle, data, yTicks }: LineChartCardProps) {
  const W = 640;
  const H = 220;
  const padL = 42;
  const padR = 12;
  const padT = 14;
  const padB = 28;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const xFor = (i: number) =>
    padL + (i * (W - padL - padR)) / Math.max(data.length - 1, 1);
  const yFor = (v: number) =>
    padT + (H - padT - padB) * (1 - (v - min) / range);

  const pathD = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(d.value)}`)
    .join(" ");

  const ticks = yTicks ?? [min, min + range / 3, min + (2 * range) / 3, max];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl border border-[var(--border)] bg-white p-5"
    >
      <div>
        <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">{title}</h3>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{subtitle}</p>
      </div>

      <div className="mt-4 overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[240px] w-full">
          <defs>
            <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(5,150,105)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="rgb(5,150,105)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineStroke" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgb(5,150,105)" />
              <stop offset="100%" stopColor="rgb(13,148,136)" />
            </linearGradient>
          </defs>

          {/* Y grid + labels */}
          {ticks.map((t, i) => {
            const y = yFor(t);
            return (
              <g key={i}>
                <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="rgb(226,232,240)" strokeDasharray="3 4" />
                <text x={padL - 8} y={y + 3} fontSize="10" textAnchor="end" fill="rgb(100,116,139)">
                  {Math.round(t)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            d={`${pathD} L ${xFor(data.length - 1)} ${H - padB} L ${xFor(0)} ${H - padB} Z`}
            fill="url(#lineFill)"
          />

          {/* Line */}
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
            d={pathD}
            fill="none"
            stroke="url(#lineStroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots */}
          {data.map((d, i) => (
            <motion.circle
              key={d.label}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.8 + i * 0.03 }}
              cx={xFor(i)}
              cy={yFor(d.value)}
              r="3.5"
              fill="white"
              stroke="rgb(5,150,105)"
              strokeWidth="2"
            />
          ))}

          {/* X labels */}
          {data.map((d, i) => (
            <text
              key={d.label + i}
              x={xFor(i)}
              y={H - 8}
              fontSize="10"
              textAnchor="middle"
              fill="rgb(100,116,139)"
            >
              {d.label}
            </text>
          ))}
        </svg>
      </div>
    </motion.div>
  );
}
