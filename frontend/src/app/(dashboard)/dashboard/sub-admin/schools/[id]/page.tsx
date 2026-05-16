/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/schools/[id]/page.tsx
 * Purpose: Sub-admin — school detail (read-only).
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";

interface School {
  id: string;
  name?: string;
  slug?: string;
  board?: string;
  city?: string;
  state?: string;
  address?: string;
  plan?: string;
  is_active?: boolean;
  subscription_expires_at?: string;
  created_at?: string;
}

const boardColor: Record<string, string> = {
  CBSE: "bg-blue-100 text-blue-700",
  ICSE: "bg-violet-100 text-violet-700",
  STATE: "bg-emerald-100 text-emerald-700",
};

const planColor: Record<string, string> = {
  CORE: "bg-primary/10 text-primary",
  AGENTIC: "bg-amber-100 text-amber-700",
};

function fmt(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return iso; }
}

export default function SubAdminSchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/schools/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed to load school (${res.status})`);
      setSchool(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load school.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { document.title = "School — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/sub-admin/schools" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          All Schools
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
          <div className="space-y-3">
            <div className="h-7 w-64 animate-pulse rounded bg-[var(--muted)]" />
            <div className="h-4 w-48 animate-pulse rounded bg-[var(--muted)]" />
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{school?.name ?? "Unnamed School"}</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{[school?.city, school?.state].filter(Boolean).join(", ") || "—"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {school?.board && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${boardColor[school.board] ?? "bg-gray-100 text-gray-500"}`}>
                    {school.board}
                  </span>
                )}
                {school?.plan && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${planColor[school.plan] ?? "bg-gray-100 text-gray-500"}`}>
                    {school.plan}
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${school?.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {school?.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-[var(--foreground)]">School Info</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-[var(--muted)]" />)}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Name" value={school?.name ?? "—"} />
            <Detail label="Slug" value={school?.slug ?? "—"} />
            <Detail label="Board" value={school?.board ?? "—"} />
            <Detail label="City" value={school?.city ?? "—"} />
            <Detail label="State" value={school?.state ?? "—"} />
            <Detail label="Plan" value={school?.plan ?? "—"} />
            <Detail label="Subscription Expires" value={fmt(school?.subscription_expires_at)} />
            <Detail label="Created" value={fmt(school?.created_at)} />
            {school?.address && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Detail label="Address" value={school.address} />
              </div>
            )}
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
