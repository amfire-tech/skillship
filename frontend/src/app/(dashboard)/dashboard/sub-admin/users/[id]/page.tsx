/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/users/[id]/page.tsx
 * Purpose: Sub-admin — user detail (read-only).
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
  school?: string | null;
  date_joined?: string;
  last_login?: string;
  phone?: string;
}

const roleColor: Record<string, string> = {
  TEACHER: "bg-blue-100 text-blue-700",
  STUDENT: "bg-violet-100 text-violet-700",
  PRINCIPAL: "bg-emerald-100 text-emerald-700",
  SUB_ADMIN: "bg-amber-100 text-amber-700",
  MAIN_ADMIN: "bg-rose-100 text-rose-700",
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return iso; }
}

export default function SubAdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/users/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed to load user (${res.status})`);
      setUser(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { document.title = "User — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "—";
  const initials = (user?.first_name?.[0] ?? "") + (user?.last_name?.[0] ?? "");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/sub-admin/users" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          All Users
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={load} className="ml-3 text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm md:p-8">
        {loading ? (
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 animate-pulse rounded-2xl bg-[var(--muted)]" />
            <div className="space-y-2">
              <div className="h-5 w-48 animate-pulse rounded bg-[var(--muted)]" />
              <div className="h-4 w-32 animate-pulse rounded bg-[var(--muted)]" />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-lg font-bold uppercase text-white">
              {initials || "?"}
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-[var(--foreground)]">{fullName}</h1>
              <p className="text-sm text-[var(--muted-foreground)]">{user?.email ?? "—"}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {user?.role && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColor[user.role] ?? "bg-gray-100 text-gray-500"}`}>
                    {user.role.replace("_", " ")}
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${user?.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {user?.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-[var(--foreground)]">Account Details</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-[var(--muted)]" />)}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <Detail label="Email" value={user?.email ?? "—"} />
            <Detail label="Phone" value={user?.phone ?? "—"} />
            <Detail label="Role" value={user?.role ?? "—"} />
            <Detail label="Status" value={user?.is_active ? "Active" : "Inactive"} />
            <Detail label="Joined" value={fmtDate(user?.date_joined)} />
            <Detail label="Last Login" value={fmtDate(user?.last_login)} />
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value || "—"}</p>
    </div>
  );
}
