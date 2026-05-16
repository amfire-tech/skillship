/*
 * File:    frontend/src/components/admin/RecentSchoolsTable.tsx
 * Purpose: Recently joined schools table on the MAIN_ADMIN dashboard.
 *          Fetches latest 5 schools from the real API. No hardcoded data.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";

interface School {
  id: string;
  name: string;
  board: "CBSE" | "ICSE" | "STATE" | string;
  city: string;
  state: string;
  is_active: boolean;
  created_at?: string;
}

interface PaginatedSchools {
  results?: School[];
}

const boardClass: Record<string, string> = {
  CBSE:  "bg-blue-50 text-blue-700 border-blue-200",
  ICSE:  "bg-violet-50 text-violet-700 border-violet-200",
  STATE: "bg-amber-50 text-amber-700 border-amber-200",
};

const statusClass = (active: boolean): string =>
  active
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-amber-50 text-amber-700 border-amber-200";

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--border)]/60 last:border-0">
      <td className="py-3 pr-4"><div className="h-4 w-48 animate-pulse rounded bg-[var(--muted)]" /></td>
      <td className="py-3 pr-4"><div className="h-4 w-24 animate-pulse rounded bg-[var(--muted)]" /></td>
      <td className="py-3 pr-4"><div className="h-5 w-14 animate-pulse rounded-full bg-[var(--muted)]" /></td>
      <td className="py-3 pr-4"><div className="h-5 w-16 animate-pulse rounded-full bg-[var(--muted)]" /></td>
      <td className="py-3"><div className="h-4 w-16 animate-pulse rounded bg-[var(--muted)]" /></td>
    </tr>
  );
}

export function RecentSchoolsTable() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[] | null>(null); // null = loading
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) { setError(true); setSchools([]); return; }
    try {
      const res = await fetch(`${API_BASE}/schools/?ordering=-created_at&page_size=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError(true); setSchools([]); return; }
      const data: PaginatedSchools = await res.json();
      setSchools((data.results ?? []).slice(0, 5));
    } catch {
      setError(true);
      setSchools([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-[var(--border)] bg-white p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Recently Joined Schools</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Latest schools onboarded to the platform</p>
        </div>
        <Link href="/dashboard/admin/schools" className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-700">
          View all
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              <th className="py-3 pr-4">School name</th>
              <th className="py-3 pr-4">City</th>
              <th className="py-3 pr-4">Board</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools === null ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : error ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-[var(--muted-foreground)]">
                  Could not load schools — check API connection.
                </td>
              </tr>
            ) : schools.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-[var(--muted-foreground)]">
                  No schools yet
                </td>
              </tr>
            ) : (
              schools.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.3 + i * 0.05 }}
                  className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/40"
                >
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-[var(--foreground)]">{s.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatDate(s.created_at)}</p>
                  </td>
                  <td className="py-3 pr-4 text-[var(--muted-foreground)]">
                    {[s.city, s.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${boardClass[s.board] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      {s.board}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass(s.is_active)}`}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3 text-xs">
                      <button onClick={() => router.push(`/dashboard/admin/schools/${s.id}`)} className="font-semibold text-primary transition-colors hover:text-primary-700">View</button>
                      <button onClick={() => router.push(`/dashboard/admin/schools/${s.id}`)} className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">Edit</button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
