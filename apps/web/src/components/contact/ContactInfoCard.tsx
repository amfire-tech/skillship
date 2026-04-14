"use client";

import { motion } from "framer-motion";

const contactItems = [
  {
    label: "Email",
    value: "noreply@amfire.in",
    note: "Partnership and onboarding queries",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
      </svg>
    ),
  },
  {
    label: "Phone",
    value: "+91 98765 43210",
    note: "Mon–Sat · school-hours support",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    label: "Office",
    value: "Bengaluru, Karnataka",
    note: "Serving schools across India",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: "Response",
    value: "Within 1 business day",
    note: "Typical turnaround · 9:30 AM – 6:30 PM IST",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
  },
];

export function ContactInfoCard() {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4"
    >
      {/* Main info block */}
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(5,150,105,0.25)] md:p-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Reach us
        </div>

        <h2 className="mt-3 text-xl font-bold tracking-tight text-[var(--foreground)] md:text-2xl">
          Speak with the Skillship team
        </h2>

        <div className="mt-6 space-y-3">
          {contactItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.2 + i * 0.08 }}
              className="group flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/60 p-3.5 transition-all hover:border-primary/20 hover:bg-white"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm transition-all group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:text-white">
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">
                  {item.value}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{item.note}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Location band */}
      <div className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary-50 via-white to-accent/10 p-6">
        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Serving schools in
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Bengaluru", "Pune", "Chennai", "Hyderabad", "Mumbai", "Delhi NCR", "+40 more"].map((city) => (
              <span
                key={city}
                className="rounded-full border border-primary/15 bg-white/70 px-3 py-1 text-xs font-medium text-[var(--foreground)] backdrop-blur-sm"
              >
                {city}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--muted-foreground)]">
            From Tier-1 metros to Tier-2 cities — Skillship works with CBSE, ICSE,
            State Board and international-curriculum schools.
          </p>
        </div>

        {/* Decorative pin */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-2xl" />
      </div>
    </motion.aside>
  );
}
