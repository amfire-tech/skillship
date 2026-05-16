/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/marketplace/page.tsx
 * Purpose: Marketplace management — list workshops from real API, toggle featured/published.
 * Owner:   Pranav
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { API_BASE, getToken } from "@/lib/auth";

interface Workshop {
  id: string;
  title: string;
  category: string;
  duration: string;
  grade: string;
  price: number;
  enrolled?: number;
  rating?: number;
  featured: boolean;
  published: boolean;
}

const categoryTint: Record<string, string> = {
  "AI & ML": "from-primary to-accent",
  Robotics: "from-violet-500 to-fuchsia-400",
  Coding: "from-sky-500 to-cyan-400",
  Electronics: "from-amber-500 to-orange-400",
  IoT: "from-teal-500 to-emerald-500",
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-gradient-to-r from-primary to-accent" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function MarketplaceManagementPage() {
  const toast = useToast();
  const router = useRouter();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Marketplace — Skillship";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const token = await getToken();
    if (!token) { setFetchError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/content/marketplace/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setFetchError("Failed to load marketplace."); setLoading(false); return; }
      const data = await res.json();
      setWorkshops(data.results ?? []);
    } catch {
      setFetchError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function patchWorkshop(id: string, patch: Partial<Workshop>) {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/content/marketplace/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        toast("Failed to update workshop", "error");
        return;
      }
      const updated: Workshop = await res.json();
      setWorkshops((prev) => prev.map((w) => w.id === id ? { ...w, ...updated } : w));
    } catch {
      toast("Network error", "error");
    }
  }

  function toggleFeatured(workshop: Workshop) {
    const next = !workshop.featured;
    toast(`"${workshop.title}" ${next ? "featured" : "unfeatured"}`, "success");
    setWorkshops((prev) => prev.map((w) => w.id === workshop.id ? { ...w, featured: next } : w));
    patchWorkshop(workshop.id, { featured: next });
  }

  function togglePublished(workshop: Workshop) {
    const next = !workshop.published;
    toast(`"${workshop.title}" ${next ? "published" : "unpublished"}`, next ? "success" : "info");
    setWorkshops((prev) => prev.map((w) => w.id === workshop.id ? { ...w, published: next } : w));
    patchWorkshop(workshop.id, { published: next });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Management"
        subtitle="Workshops, pricing, visibility and featured selection across the catalog"
        action={
          <button
            onClick={() => router.push("/dashboard/admin/marketplace/new")}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Add Workshop
          </button>
        }
      />

      {/* Workshops table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[var(--muted-foreground)]">
            <svg className="mr-2 animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Loading marketplace…
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-red-500">{fetchError}</p>
            <button onClick={load} className="text-xs font-semibold text-primary underline">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  <th className="px-5 py-3">Workshop</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Grade</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Enrolled</th>
                  <th className="px-5 py-3">Rating</th>
                  <th className="px-5 py-3">Featured</th>
                  <th className="px-5 py-3">Published</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workshops.length === 0 && (
                  <tr><td colSpan={9} className="px-5 py-8">
                    <EmptyState
                      title="No workshops yet"
                      description="Publish workshops to the marketplace — schools can subscribe, enrolling teachers and students into curated tracks."
                      action={{ label: "Add Workshop", href: "/dashboard/admin/marketplace/new" }}
                      icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M9 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" /></svg>}
                    />
                  </td></tr>
                )}
                {workshops.map((w, i) => (
                  <motion.tr
                    key={w.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 + i * 0.04 }}
                    className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/40"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white ${categoryTint[w.category] ?? "from-primary to-accent"}`}>
                          {w.category.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">{w.title}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{w.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{w.duration || "—"}</td>
                    <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{w.grade || "—"}</td>
                    <td className="px-5 py-3.5 font-semibold text-[var(--foreground)]">₹{w.price.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5 text-[var(--foreground)]">{w.enrolled != null ? w.enrolled.toLocaleString("en-IN") : "—"}</td>
                    <td className="px-5 py-3.5">
                      {w.rating != null ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" strokeWidth="0"><path d="M12 2 15 8.5l7 1-5.2 5 1.3 7.2L12 18.3l-6.1 3.4 1.3-7.2L2 9.5l7-1z" /></svg>
                          <span className="font-semibold text-[var(--foreground)]">{w.rating.toFixed(1)}</span>
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Toggle on={w.featured} onToggle={() => toggleFeatured(w)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <Toggle on={w.published} onToggle={() => togglePublished(w)} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => router.push(`/dashboard/admin/marketplace/${w.id}`)}
                        className="text-xs font-semibold text-primary transition-colors hover:text-primary/70">Edit</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
