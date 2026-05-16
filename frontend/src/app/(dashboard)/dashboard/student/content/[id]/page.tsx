/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/content/[id]/page.tsx
 * Purpose: Student — content detail viewer (video, PDF, document).
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";

type ContentType = "VIDEO" | "PDF" | "DOCUMENT";

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  content_type: ContentType;
  subject?: string;
  url?: string;
  file_url?: string;
  thumbnail_url?: string;
  duration?: string;
  created_at?: string;
}

const typeBadge: Record<ContentType, string> = {
  VIDEO: "bg-violet-100 text-violet-700",
  PDF: "bg-red-100 text-red-600",
  DOCUMENT: "bg-blue-100 text-blue-700",
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return iso; }
}

export default function StudentContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/content/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed to load content (${res.status})`);
      setItem(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { document.title = "Content — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const url = item?.url ?? item?.file_url;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/student/content" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Content Library
          </Link>
          {loading ? (
            <div className="mt-2 h-7 w-72 animate-pulse rounded bg-[var(--muted)]" />
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{item?.title ?? "Untitled"}</h1>
              {item?.content_type && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadge[item.content_type] ?? "bg-gray-100 text-gray-500"}`}>
                  {item.content_type}
                </span>
              )}
            </div>
          )}
          {item?.subject && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.subject} · added {fmtDate(item.created_at)}</p>}
        </div>
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary">
            Open in new tab
          </a>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={load} className="ml-3 text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        {loading ? (
          <div className="aspect-video w-full animate-pulse bg-[var(--muted)]" />
        ) : item?.content_type === "VIDEO" && url ? (
          <div className="aspect-video w-full bg-black">
            <video src={url} controls className="h-full w-full" poster={item.thumbnail_url}>
              Your browser does not support the video tag.
            </video>
          </div>
        ) : item?.content_type === "PDF" && url ? (
          <iframe src={url} title={item.title} className="h-[70vh] w-full" />
        ) : url ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
              </svg>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">Preview unavailable for this file type.</p>
            <a href={url} target="_blank" rel="noreferrer" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90">Download / Open</a>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">No file attached to this resource.</p>
          </div>
        )}
      </div>

      {item?.description && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-[var(--foreground)]">About this content</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted-foreground)]">{item.description}</p>
        </div>
      )}
    </div>
  );
}
