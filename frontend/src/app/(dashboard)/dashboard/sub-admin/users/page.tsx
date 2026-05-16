/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/users/page.tsx
 * Purpose: Sub-admin users list — tab switcher for Teachers / Students, table with View links.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";
import { EmptyState } from "@/components/ui/EmptyState";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "TEACHER" | "STUDENT";
  is_active: boolean;
}

type Tab = "TEACHER" | "STUDENT";

const UsersEmptyIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)]">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

function SkeletonRow() {
  return (
    <tr>
      <td className="py-3 pr-4"><div className="h-4 w-36 animate-pulse rounded-lg bg-[var(--muted)]" /></td>
      <td className="py-3 pr-4"><div className="h-4 w-48 animate-pulse rounded-lg bg-[var(--muted)]" /></td>
      <td className="py-3 pr-4"><div className="h-5 w-20 animate-pulse rounded-full bg-[var(--muted)]" /></td>
      <td className="py-3 pr-4"><div className="h-5 w-16 animate-pulse rounded-full bg-[var(--muted)]" /></td>
      <td className="py-3"><div className="h-4 w-10 animate-pulse rounded-lg bg-[var(--muted)]" /></td>
    </tr>
  );
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("TEACHER");
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async (role: Tab) => {
    setUsers(null);
    setError(false);
    const token = await getToken();
    if (!token) { setError(true); return; }
    try {
      const res = await fetch(`${API_BASE}/users/?role=${role}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError(true); return; }
      const data = await res.json();
      setUsers(data.results ?? []);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    document.title = "Users — Skillship";
  }, []);

  useEffect(() => { load(activeTab); }, [load, activeTab]);

  const handleTabChange = (tab: Tab) => {
    if (tab !== activeTab) setActiveTab(tab);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "TEACHER", label: "Teachers" },
    { key: "STUDENT", label: "Students" },
  ];

  const roleBadge =
    activeTab === "TEACHER"
      ? "bg-blue-100 text-blue-700"
      : "bg-violet-100 text-violet-700";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Users</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Teachers and students across your schools
          </p>
        </div>
        <Link
          href={activeTab === "TEACHER" ? "/dashboard/sub-admin/users/new/teacher" : "/dashboard/sub-admin/users/new/principal"}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          {activeTab === "TEACHER" ? "Add Teacher" : "Add Principal"}
        </Link>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-white text-[var(--foreground)] shadow-sm dark:bg-[var(--background)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
        {error && (
          <p className="py-10 text-center text-sm text-[var(--muted-foreground)]">
            Could not load {activeTab === "TEACHER" ? "teachers" : "students"} — check API connection.
          </p>
        )}

        {!error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users === null ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="py-6">
                    <EmptyState
                      title={`No ${activeTab === "TEACHER" ? "teachers" : "students"} yet`}
                      description={activeTab === "TEACHER" ? "Add teachers to your assigned schools — they'll receive login credentials." : "Students are added by principals; coordinate with them to populate this list."}
                      action={activeTab === "TEACHER" ? { label: "Add Teacher", href: "/dashboard/sub-admin/users/new/teacher" } : undefined}
                      icon={<UsersEmptyIcon />}
                    />
                  </td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--muted)]/30">
                      <td className="py-3 pr-4 font-medium text-[var(--foreground)]">
                        {[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="py-3 pr-4 text-[var(--muted-foreground)]">{u.email}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadge}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/dashboard/sub-admin/users/${u.id}`}
                          className="text-[13px] font-medium text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
