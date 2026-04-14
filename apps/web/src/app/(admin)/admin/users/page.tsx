"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";

type Role = "all" | "admin" | "subadmin" | "principal" | "teacher" | "student";

interface UserRow {
  name: string;
  email: string;
  role: Exclude<Role, "all">;
  school: string;
  joined: string;
  status: "Active" | "Suspended" | "Invited";
}

const users: UserRow[] = [
  { name: "Aryan Gupta", email: "aryan.gupta@skillship.in", role: "admin", school: "Skillship HQ", joined: "Feb 12, 2025", status: "Active" },
  { name: "Neha Verma", email: "neha.verma@skillship.in", role: "subadmin", school: "North India region", joined: "Mar 2, 2025", status: "Active" },
  { name: "Dr. Priya Sharma", email: "priya.sharma@dps.edu.in", role: "principal", school: "Delhi Public School, Noida", joined: "Jan 20, 2025", status: "Active" },
  { name: "Rahul Iyer", email: "rahul.iyer@kv21.edu.in", role: "teacher", school: "Kendriya Vidyalaya, Sector 21", joined: "Apr 5, 2025", status: "Active" },
  { name: "Ananya Kapoor", email: "ananya.k@student.edu.in", role: "student", school: "St. Xavier's High School", joined: "Jul 11, 2025", status: "Active" },
  { name: "Karthik Reddy", email: "karthik@vidyanikethan.edu.in", role: "teacher", school: "Vidya Niketan School", joined: "Jun 28, 2025", status: "Invited" },
  { name: "Sana Mehta", email: "sana.mehta@suns.edu.in", role: "student", school: "Sunrise Academy", joined: "Aug 9, 2025", status: "Suspended" },
];

const roleColor: Record<Exclude<Role, "all">, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  subadmin: "bg-teal-50 text-teal-700 border-teal-200",
  principal: "bg-violet-50 text-violet-700 border-violet-200",
  teacher: "bg-amber-50 text-amber-700 border-amber-200",
  student: "bg-slate-50 text-slate-600 border-slate-200",
};

const statusColor: Record<UserRow["status"], string> = {
  Active: "bg-primary/10 text-primary border-primary/20",
  Suspended: "bg-red-50 text-red-600 border-red-200",
  Invited: "bg-amber-50 text-amber-700 border-amber-200",
};

const tabs: { label: string; value: Role; count: number }[] = [
  { label: "All", value: "all", count: 1_04_320 + 3847 + 502 + 12 + 1 },
  { label: "Super Admin", value: "admin", count: 1 },
  { label: "Sub Admins", value: "subadmin", count: 12 },
  { label: "Principals", value: "principal", count: 502 },
  { label: "Teachers", value: "teacher", count: 3847 },
  { label: "Students", value: "student", count: 104320 },
];

export default function UserManagementPage() {
  const [activeRole, setActiveRole] = useState<Role>("all");

  const filtered = activeRole === "all" ? users : users.filter((u) => u.role === activeRole);

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="All Skillship users across every role and school"
        action={
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Create New User
          </Link>
        }
      />

      {/* Role tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-white p-2"
      >
        {tabs.map((t) => {
          const active = activeRole === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setActiveRole(t.value)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                active
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)]"
                  : "text-[var(--muted-foreground)] hover:bg-primary/5 hover:text-primary"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/25" : "bg-[var(--muted)]"}`}>
                {t.count.toLocaleString("en-IN")}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="relative"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Search by name, email, school…"
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-white pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">School / Scope</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <motion.tr
                  key={u.email}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 + i * 0.04 }}
                  className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/40"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                        {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{u.name}</p>
                        <p className="text-[11px] text-[var(--muted-foreground)]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${roleColor[u.role]}`}>
                      {u.role === "subadmin" ? "Sub Admin" : u.role === "admin" ? "Super Admin" : u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{u.school}</td>
                  <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{u.joined}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusColor[u.status]}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3 text-xs">
                      <button className="font-semibold text-primary transition-colors hover:text-primary-700">View</button>
                      <button className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">Edit</button>
                      <button className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-red-500">Suspend</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
