"use client";

import { motion } from "framer-motion";

const benefitGroups = [
  {
    title: "Platform access",
    items: [
      "Free 30-day trial for your entire school",
      "AI-powered quiz generation for all subjects",
      "AI Career Pilot for every student (Class 6–12)",
      "Bulk student onboarding via CSV upload",
    ],
  },
  {
    title: "People & support",
    items: [
      "Dedicated SubAdmin to manage your account",
      "Real-time performance analytics dashboards",
      "Workshop marketplace with 200+ courses",
      "Priority support during school hours",
    ],
  },
];

const trustStats = [
  { value: "50+", label: "Schools" },
  { value: "10,000+", label: "Students" },
  { value: "5,000+", label: "Live Hours" },
];

export function DemoBenefits() {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4"
    >
      {/* Benefits block */}
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(5,150,105,0.2)] md:p-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          What you get
        </div>

        <h2 className="mt-3 text-xl font-bold tracking-tight text-[var(--foreground)] md:text-2xl">
          Everything your school needs to start
        </h2>

        <div className="mt-6 space-y-6">
          {benefitGroups.map((group, gi) => (
            <div key={group.title}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                {group.title}
              </p>
              <ul className="mt-3 space-y-2.5">
                {group.items.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + gi * 0.15 + i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span className="text-sm leading-6 text-[var(--foreground)]">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Trust block */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primary-700 via-primary to-primary-500 p-6 text-white shadow-[0_20px_50px_-25px_rgba(5,150,105,0.5)]">
        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
            50+ schools already onboard
          </p>
          <h3 className="mt-2 text-xl font-bold tracking-tight">
            Trusted across India
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/85">
            From CBSE schools in Delhi to ICSE schools in Chennai — Skillship
            powers AI education at every scale.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {trustStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur-sm"
              >
                <p className="text-xl font-bold tracking-tight">{stat.value}</p>
                <p className="mt-0.5 text-[11px] text-white/80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
      </div>
    </motion.aside>
  );
}
