"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";

interface SubAdminRow {
  name: string;
  email: string;
  region: string;
  schools: number;
  lastActive: string;
  status: "Active" | "Inactive";
}

const subadmins: SubAdminRow[] = [
  { name: "Neha Verma", email: "neha.verma@skillship.in", region: "North India", schools: 48, lastActive: "2 hours ago", status: "Active" },
  { name: "Arjun Nair", email: "arjun.nair@skillship.in", region: "South India", schools: 62, lastActive: "15 min ago", status: "Active" },
  { name: "Divya Iyer", email: "divya.iyer@skillship.in", region: "West India", schools: 35, lastActive: "Yesterday", status: "Active" },
  { name: "Rohit Saha", email: "rohit.saha@skillship.in", region: "East India", schools: 28, lastActive: "3 days ago", status: "Inactive" },
  { name: "Meera Kulkarni", email: "meera.k@skillship.in", region: "Central India", schools: 19, lastActive: "1 hour ago", status: "Active" },
];

export default function SubAdminManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="SubAdmin Management"
        subtitle={`${subadmins.length} sub-admins managing schools across regions`}
        action={
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Create SubAdmin
          </Link>
        }
      />

      {/* Stat strip */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total SubAdmins", value: "12", tone: "text-primary" },
          { label: "Active Now", value: "8", tone: "text-teal-600" },
          { label: "Schools Under Mgmt.", value: "502", tone: "text-violet-600" },
          { label: "Pending Approvals", value: "14", tone: "text-amber-600" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
            className="rounded-2xl border border-[var(--border)] bg-white p-4"
          >
            <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
            <p className={`mt-1.5 text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Region</th>
                <th className="px-5 py-3">Schools Assigned</th>
                <th className="px-5 py-3">Last Active</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subadmins.map((s, i) => (
                <motion.tr
                  key={s.email}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 + i * 0.04 }}
                  className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/40"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                        {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{s.name}</p>
                        <p className="text-[11px] text-[var(--muted-foreground)]">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{s.region}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      {s.schools}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{s.lastActive}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                      s.status === "Active"
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.status === "Active" ? "bg-primary" : "bg-slate-400"}`} />
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3 text-xs">
                      <button className="font-semibold text-primary transition-colors hover:text-primary-700">View</button>
                      <button className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">Edit</button>
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
