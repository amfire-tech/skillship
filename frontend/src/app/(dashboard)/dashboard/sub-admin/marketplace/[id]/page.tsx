/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/marketplace/[id]/page.tsx
 * Purpose: Sub-admin — marketplace item detail (read-only).
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";

interface MarketplaceItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  price_inr?: number;
  is_active?: boolean;
  duration?: string;
  thumbnail_url?: string;
  created_at?: string;
}

function fmt(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return iso; }
}

function formatPrice(p?: number) {
  if (p == null) return "—";
  return `₹${Number(p).toLocaleString("en-IN")}`;
}

export default function SubAdminMarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/content/marketplace/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed to load item (${res.status})`);
      setItem(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load item.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { document.title = "Marketplace — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/sub-admin/marketplace" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Marketplace
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={load} className="ml-3 text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
            {loading ? (
              <div className="aspect-[16/9] w-full animate-pulse bg-[var(--muted)]" />
            ) : item?.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.thumbnail_url} alt={item.title} className="aspect-[16/9] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-primary/40">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
            )}
          </div>

          {item?.description && (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-[var(--foreground)]">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted-foreground)]">{item.description}</p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            {loading ? (
              <div className="space-y-3">
                <div className="h-6 w-3/4 animate-pulse rounded bg-[var(--muted)]" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--muted)]" />
              </div>
            ) : (
              <>
                <h1 className="text-lg font-semibold text-[var(--foreground)]">{item?.title ?? "Untitled"}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item?.category && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{item.category}</span>}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item?.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {item?.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-5 text-3xl font-bold text-[var(--foreground)]">{formatPrice(item?.price_inr)}</p>
                {item?.duration && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{item.duration}</p>}
              </>
            )}
          </div>

          {!loading && (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Listing Info</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted-foreground)]">Listed</dt>
                  <dd className="font-medium text-[var(--foreground)]">{fmt(item?.created_at)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted-foreground)]">Category</dt>
                  <dd className="font-medium text-[var(--foreground)]">{item?.category ?? "—"}</dd>
                </div>
              </dl>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
