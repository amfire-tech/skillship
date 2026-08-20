/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/gallery/page.tsx
 * Purpose: Super Admin panel — upload/manage photos shown on the public /gallery page.
 * Owner:   Pranav
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/auth";

interface ApiGalleryImage {
  id: string;
  image: string;
  caption: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function GalleryManagementPage() {
  const toast = useToast();
  const [images, setImages] = useState<ApiGalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<ApiGalleryImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await apiFetch("/gallery/?page_size=100");
      if (!res.ok) { setFetchError("Failed to load gallery images."); setLoading(false); return; }
      const data = await res.json();
      setImages(data.results ?? []);
    } catch {
      setFetchError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Gallery Management — Skillship";
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      if (caption.trim()) form.append("caption", caption.trim());
      const res = await apiFetch("/gallery/", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err?.image?.[0] ?? err?.detail ?? "Failed to upload photo.", "error");
        return;
      }
      const created: ApiGalleryImage = await res.json();
      setImages((prev) => [created, ...prev]);
      setCaption("");
      toast("Photo uploaded and published", "success");
    } catch {
      toast("Network error — upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function toggleActive(img: ApiGalleryImage) {
    const next = !img.is_active;
    setImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, is_active: next } : i)));
    try {
      const res = await apiFetch(`/gallery/${img.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) throw new Error();
      toast(next ? "Photo published to gallery" : "Photo hidden from gallery", next ? "success" : "info");
    } catch {
      setImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, is_active: !next } : i)));
      toast("Failed to update photo", "error");
    }
  }

  async function handleRemove(img: ApiGalleryImage) {
    try {
      const res = await apiFetch(`/gallery/${img.id}/`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setImages((prev) => prev.filter((i) => i.id !== img.id));
        toast("Photo removed", "error");
      } else {
        toast("Failed to remove photo", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setConfirmRemove(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gallery Management"
        subtitle={loading ? "Loading…" : `${images.length} photo${images.length !== 1 ? "s" : ""} — visible on the public /gallery page`}
      />

      {/* Upload card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 sm:flex-row sm:items-center"
      >
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          className="h-10 flex-1 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          className="hidden"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {uploading ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}
          {uploading ? "Uploading…" : "Upload Photo"}
        </button>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-[var(--muted)]" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-white py-16">
          <p className="text-sm text-red-500">{fetchError}</p>
          <button onClick={load} className="text-xs font-semibold text-primary underline">Retry</button>
        </div>
      ) : images.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white py-10">
          <EmptyState
            title="No photos yet"
            description="Upload your first photo — it appears on the public Gallery page immediately."
            icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image} alt={img.caption || "Gallery photo"} className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-transparent to-transparent p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                <span className={`self-start rounded-full border px-2 py-0.5 text-[10px] font-semibold ${img.is_active ? "border-primary/30 bg-primary/20 text-white" : "border-white/30 bg-black/30 text-white/80"}`}>
                  {img.is_active ? "Published" : "Hidden"}
                </span>
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={() => toggleActive(img)}
                    className="rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-[var(--foreground)] transition-colors hover:bg-white"
                  >
                    {img.is_active ? "Hide" : "Publish"}
                  </button>
                  <button
                    onClick={() => setConfirmRemove(img)}
                    className="rounded-md bg-red-500/90 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {img.caption && (
                <p className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-2 py-1 text-[11px] font-medium text-white group-hover:opacity-0">
                  {img.caption}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirm Remove Dialog */}
      <AnimatePresence>
        {confirmRemove && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div
              role="alertdialog" aria-modal="true"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <path d="m3 6 1 14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2L21 6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-bold text-[var(--foreground)]">Remove photo?</h3>
              <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                This photo will be permanently deleted from the gallery.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button onClick={() => setConfirmRemove(null)}
                  className="flex-1 h-10 rounded-full border border-[var(--border)] bg-white text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">
                  Cancel
                </button>
                <button onClick={() => handleRemove(confirmRemove)}
                  className="flex-1 h-10 rounded-full bg-red-500 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-red-600">
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
