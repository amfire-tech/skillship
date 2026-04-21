"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";

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

const roleTabDefs: { label: string; value: Role }[] = [
  { label: "All", value: "all" },
  { label: "Super Admin", value: "admin" },
  { label: "Sub Admins", value: "subadmin" },
  { label: "Principals", value: "principal" },
  { label: "Teachers", value: "teacher" },
  { label: "Students", value: "student" },
];

export default function UserManagementPage() {
  const toast = useToast();
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<Role>("all");
  const [search, setSearch] = useState("");
  const [confirmSuspend, setConfirmSuspend] = useState<UserRow | null>(null);

  const tabs = roleTabDefs.map((t) => ({
    ...t,
    count: t.value === "all" ? users.length : users.filter((u) => u.role === t.value).length,
  }));

  const filtered = (activeRole === "all" ? users : users.filter((u) => u.role === activeRole)).filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.school.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="All Skillship users across every role and school"
        action={
          <Link
            href="/dashboard/admin/users/new"
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
              onClick={() => { setActiveRole(t.value); setSearch(""); }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                active
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)]"
                  : "text-[var(--muted-foreground)] hover:bg-primary/5 hover:text-primary"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/25" : "bg-[var(--muted)]"}`}>
                {t.count}
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => (
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
                        <button onClick={() => router.push(`/dashboard/admin/users/${i + 1}`)} className="font-semibold text-primary transition-colors hover:text-primary-700">View</button>
                        <button onClick={() => router.push(`/dashboard/admin/users/${i + 1}`)} className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">Edit</button>
                        <button onClick={() => setConfirmSuspend(u)} className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-red-500">Suspend</button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      {/* Suspend confirmation dialog */}
      <AnimatePresence>
        {confirmSuspend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="suspend-dialog-title"
              aria-describedby="suspend-dialog-desc"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 id="suspend-dialog-title" className="mt-4 text-base font-bold text-[var(--foreground)]">Suspend user?</h3>
              <p id="suspend-dialog-desc" className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                <span className="font-semibold text-[var(--foreground)]">{confirmSuspend.name}</span> will lose access to the platform immediately. You can reinstate them later.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => setConfirmSuspend(null)}
                  className="flex-1 h-10 rounded-full border border-[var(--border)] bg-white text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast(`${confirmSuspend.name} suspended`, "error");
                    setConfirmSuspend(null);
                  }}
                  className="flex-1 h-10 rounded-full bg-amber-500 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-amber-600"
                >
                  Suspend
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
