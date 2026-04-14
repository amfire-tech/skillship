"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const roles = [
  {
    value: "subadmin",
    label: "Sub Admin",
    description: "Manages a set of schools and their workflows.",
    href: "/admin/users/new/subadmin",
    tint: "bg-amber-50 text-amber-600",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    value: "teacher",
    label: "Teacher",
    description: "Creates quizzes, reviews submissions, runs workshops.",
    href: "/admin/users/new/teacher",
    tint: "bg-primary/10 text-primary",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    value: "principal",
    label: "Principal",
    description: "Oversees school performance and teacher activity.",
    href: "/admin/users/new/principal",
    tint: "bg-violet-50 text-violet-600",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
      </svg>
    ),
  },
  {
    value: "student",
    label: "Student",
    description: "Takes quizzes, accesses courses, views progress.",
    href: "/admin/users/new/student",
    tint: "bg-teal-50 text-teal-600",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
];

export default function CreateUserPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-white p-7 shadow-[0_30px_80px_-50px_rgba(5,150,105,0.3)] md:p-10"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

        {/* Avatar glyph */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-[0_16px_30px_-12px_rgba(5,150,105,0.5)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" /><path d="M5 12h14" />
              </svg>
            </span>
          </div>
        </div>

        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Create New User
        </h1>
        <p className="mt-1.5 text-center text-sm text-[var(--muted-foreground)]">
          Select a role to create a new user account.
        </p>

        {/* Role list */}
        <div className="mt-7 space-y-2.5">
          {roles.map((r, i) => (
            <motion.div
              key={r.value}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={r.href}
                className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-[0_16px_40px_-20px_rgba(5,150,105,0.3)]"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${r.tint} transition-all group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:text-white`}>
                  {r.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-[var(--foreground)]">{r.label}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{r.description}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)] transition-all group-hover:translate-x-0.5 group-hover:text-primary">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-[var(--muted)]/50 px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
          </svg>
          <p className="text-xs text-[var(--muted-foreground)]">
            The new user will receive an email with login credentials.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
