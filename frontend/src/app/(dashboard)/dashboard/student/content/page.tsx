/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/content/page.tsx
 * Purpose: Student content library — browse learning materials by type.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";

type ContentType = "VIDEO" | "PDF" | "DOCUMENT";
type FilterOption = "ALL" | ContentType;

interface ContentItem {
  id: string;
  title: string;
  content_type: ContentType;
  subject: string;
  created_at: string;
}

const FILTERS: { label: string; value: FilterOption }[] = [
  { label: "All", value: "ALL" },
  { label: "Video", value: "VIDEO" },
  { label: "PDF", value: "PDF" },
  { label: "Document", value: "DOCUMENT" },
];

const typeBadge: Record<ContentType, string> = {
  VIDEO: "bg-violet-100 text-violet-700",
  PDF: "bg-red-100 text-red-600",
  DOCUMENT: "bg-blue-100 text-blue-700",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function ContentTypeIcon({ type }: { type: ContentType }) {
  if (type === "VIDEO") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    );
  }
  if (type === "PDF") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 15h1a2 2 0 0 0 0-4H9v6" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  );
}

function iconBg(type: ContentType): string {
  if (type === "VIDEO") return "bg-violet-100 text-violet-700";
  if (type === "PDF") return "bg-red-100 text-red-600";
  return "bg-blue-100 text-blue-700";
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-[var(--muted)]" />
        <div className="h-4 w-28 animate-pulse rounded bg-[var(--muted)]" />
      </div>
      <div className="mb-2 h-4 w-full animate-pulse rounded bg-[var(--muted)]" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--muted)]" />
      <div className="mt-5 flex items-center justify-between">
        <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--muted)]" />
        <div className="h-8 w-14 animate-pulse rounded-lg bg-[var(--muted)]" />
      </div>
    </div>
  );
}

export default function StudentContentPage() {
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("ALL");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) {
      setError("Session expired. Please log in again.");
      setItems([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/content/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load content: ${res.status}`);
      const data = await res.json();
      setItems(asArray<ContentItem>(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content library.");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    document.title = "Content Library — Skillship";
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items === null
    ? null
    : activeFilter === "ALL"
    ? items
    : items.filter((i) => i.content_type === activeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Content Library</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Browse learning materials uploaded by your teachers
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setActiveFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === f.value
                ? "bg-primary text-white"
                : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-primary/40 hover:text-[var(--foreground)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Card grid */}
      {filtered === null ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={activeFilter === "ALL" ? "No content uploaded yet" : `No ${activeFilter.toLowerCase()} files`}
          description={activeFilter === "ALL" ? "Your teachers haven't uploaded any materials yet — videos, PDFs and notes will appear here once they do." : "Try a different filter or check back soon."}
          action={activeFilter !== "ALL" ? { label: "Show all", onClick: () => setActiveFilter("ALL") } : undefined}
          icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-[var(--background)]"
            >
              {/* Icon + type */}
              <div className="mb-3 flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg(item.content_type)}`}>
                  <ContentTypeIcon type={item.content_type} />
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadge[item.content_type]}`}>
                  {item.content_type}
                </span>
              </div>

              {/* Title */}
              <h3 className="mb-1 text-sm font-semibold text-[var(--foreground)] leading-snug line-clamp-2">
                {item.title}
              </h3>

              {/* Subject + date */}
              <p className="text-xs text-[var(--muted-foreground)]">
                {item.subject && <span className="mr-2 font-medium">{item.subject}</span>}
                {formatDate(item.created_at)}
              </p>

              {/* View button */}
              <div className="mt-4 flex items-center justify-end">
                <Link
                  href={`/dashboard/student/content/${item.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
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
