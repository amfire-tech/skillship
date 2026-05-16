/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/marketplace/page.tsx
 * Purpose: Sub-admin marketplace listing — category filter, card grid with View links.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";
import { EmptyState } from "@/components/ui/EmptyState";

interface MarketplaceItem {
  id: string;
  title: string;
  category: string;
  price_inr: number;
  is_active: boolean;
}

const MarketplaceEmptyIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)]">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
      <div className="mb-3 h-5 w-16 animate-pulse rounded-full bg-[var(--muted)]" />
      <div className="mb-2 h-5 w-3/4 animate-pulse rounded-lg bg-[var(--muted)]" />
      <div className="mb-4 h-4 w-1/3 animate-pulse rounded-lg bg-[var(--muted)]" />
      <div className="flex items-center justify-between">
        <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--muted)]" />
        <div className="h-8 w-16 animate-pulse rounded-xl bg-[var(--muted)]" />
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[] | null>(null);
  const [error, setError] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) { setError(true); return; }
    try {
      const res = await fetch(`${API_BASE}/content/marketplace/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError(true); return; }
      const data = await res.json();
      setItems(data.results ?? []);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    document.title = "Marketplace — Skillship";
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo<string[]>(() => {
    if (!items) return [];
    const unique = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
    return unique.sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return null;
    if (categoryFilter === "ALL") return items;
    return items.filter((i) => i.category === categoryFilter);
  }, [items, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Marketplace</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Workshops and content available to your schools
        </p>
      </div>

      {/* Category filter */}
      {items !== null && items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`rounded-full border px-4 py-1 text-[13px] font-medium transition-colors ${
              categoryFilter === "ALL"
                ? "border-primary bg-primary text-white"
                : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-primary/40 hover:text-primary dark:bg-[var(--background)]"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full border px-4 py-1 text-[13px] font-medium transition-colors ${
                categoryFilter === cat
                  ? "border-primary bg-primary text-white"
                  : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-primary/40 hover:text-primary dark:bg-[var(--background)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center shadow-sm dark:bg-[var(--background)]">
          <p className="text-sm text-[var(--muted-foreground)]">
            Could not load marketplace items — check API connection.
          </p>
        </div>
      )}

      {/* Skeleton grid */}
      {!error && filtered === null && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!error && filtered !== null && filtered.length === 0 && (
        <EmptyState
          title={categoryFilter === "ALL" ? "No marketplace items" : `No items in "${categoryFilter}"`}
          description={categoryFilter === "ALL" ? "Items will appear once admins publish workshops to your territory." : "Try a different category or view all."}
          action={categoryFilter !== "ALL" ? { label: "Show all", onClick: () => setCategoryFilter("ALL") } : undefined}
          icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M9 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" /></svg>}
        />
      )}

      {/* Card grid */}
      {!error && filtered !== null && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]"
            >
              {/* Category badge */}
              <span className="inline-block rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted-foreground)]">
                {item.category || "Uncategorized"}
              </span>

              {/* Title */}
              <h3 className="mt-2 text-sm font-semibold leading-snug text-[var(--foreground)]">
                {item.title}
              </h3>

              {/* Price */}
              <p className="mt-1 text-sm font-medium text-primary">
                {item.price_inr > 0 ? `₹${item.price_inr.toLocaleString("en-IN")}` : "Free"}
              </p>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {item.is_active ? "Active" : "Inactive"}
                </span>
                <Link
                  href={`/dashboard/sub-admin/marketplace/${item.id}`}
                  className="rounded-xl border border-[var(--border)] px-3 py-1.5 text-[13px] font-medium text-[var(--foreground)] hover:border-primary/40 hover:text-primary dark:bg-[var(--background)]"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
