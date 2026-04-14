"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const actions = [
  {
    label: "Add New School",
    href: "/admin/schools/new",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" /><path d="M5 12h14" />
      </svg>
    ),
  },
  {
    label: "Create SubAdmin",
    href: "/admin/users/new",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 11h-6" /><path d="M19 8v6" />
      </svg>
    ),
  },
  {
    label: "View Reports",
    href: "/admin/reports",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
      </svg>
    ),
  },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="rounded-2xl border border-[var(--border)] bg-white p-5"
    >
      <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Quick Actions</h3>

      <div className="mt-4 space-y-2.5">
        {actions.map((a, i) => (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.35 + i * 0.08 }}
          >
            <Link
              href={a.href}
              className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-[0_12px_30px_-15px_rgba(5,150,105,0.3)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:text-white">
                {a.icon}
              </span>
              <span className="flex-1 text-sm font-semibold text-[var(--foreground)]">{a.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)] transition-all group-hover:translate-x-0.5 group-hover:text-primary">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
