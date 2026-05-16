/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/marketplace/[id]/page.tsx
 * Purpose: Admin marketplace workshop detail/edit page — loads real data from API.
 * Owner:   Pranav
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
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
  description?: string;
  instructor?: string;
}

type EditableWorkshop = Pick<Workshop, "title" | "category" | "duration" | "grade" | "price" | "description" | "instructor">;

const categories = ["AI & ML", "Robotics", "Coding", "Electronics", "IoT"] as const;

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value || "—"}</p>
  </div>
);

function Skeleton({ className }: { className?: string }) {
  return <span className={`inline-block animate-pulse rounded bg-slate-200 ${className ?? ""}`} />;
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      <button type="button" onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? "bg-gradient-to-r from-primary to-accent" : "bg-slate-200"}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export default function WorkshopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [form, setForm] = useState<EditableWorkshop>({
    title: "", category: "Coding", duration: "", grade: "", price: 0, description: "", instructor: "",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired. Please log in again."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/content/marketplace/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError(res.status === 404 ? "Workshop not found." : "Failed to load workshop.");
        setLoading(false);
        return;
      }
      const data: Workshop = await res.json();
      setWorkshop(data);
      setForm({
        title: data.title ?? "",
        category: data.category ?? "Coding",
        duration: data.duration ?? "",
        grade: data.grade ?? "",
        price: data.price ?? 0,
        description: data.description ?? "",
        instructor: data.instructor ?? "",
      });
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    document.title = "Workshop Detail — Skillship";
    load();
  }, [load]);

  async function save() {
    if (!workshop) return;
    setSaving(true);
    const token = await getToken();
    if (!token) { toast("Session expired.", "error"); setSaving(false); return; }
    try {
      const res = await fetch(`${API_BASE}/content/marketplace/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          duration: form.duration,
          grade: form.grade,
          price: form.price,
          description: form.description,
          instructor: form.instructor,
        }),
      });
      if (!res.ok) {
        toast("Failed to save workshop. Please try again.", "error");
        setSaving(false);
        return;
      }
      const updated: Workshop = await res.json();
      setWorkshop(updated);
      setForm({
        title: updated.title ?? "",
        category: updated.category ?? "Coding",
        duration: updated.duration ?? "",
        grade: updated.grade ?? "",
        price: updated.price ?? 0,
        description: updated.description ?? "",
        instructor: updated.instructor ?? "",
      });
      toast("Workshop updated", "success");
      setEditing(false);
    } catch {
      toast("Network error", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(key: "featured" | "published") {
    if (!workshop) return;
    const token = await getToken();
    if (!token) return;
    const next = !workshop[key];
    try {
      const res = await fetch(`${API_BASE}/content/marketplace/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [key]: next }),
      });
      if (res.ok) {
        setWorkshop((w) => w ? { ...w, [key]: next } : w);
        toast(`Workshop ${next ? key : `un${key}`}`, next ? "success" : "info");
      } else {
        toast(`Failed to update ${key}`, "error");
      }
    } catch {
      toast("Network error", "error");
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={load} className="text-xs font-semibold text-primary underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          {loading ? (
            <Skeleton className="h-6 w-64" />
          ) : (
            <h1 className="text-xl font-bold text-[var(--foreground)]">{workshop?.title}</h1>
          )}
          <p className="text-xs text-[var(--muted-foreground)]">Workshop ID: {id} · <Link href="/dashboard/admin/marketplace" className="text-primary hover:underline">Marketplace</Link></p>
        </div>
        <div className="ml-auto flex gap-2">
          {editing ? (
            <>
              <button type="button" onClick={() => { setEditing(false); }} disabled={saving}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-50">Cancel</button>
              <button type="button" onClick={save} disabled={saving}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} disabled={loading}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">Edit Workshop</button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Enrolled", value: loading ? null : (workshop?.enrolled != null ? workshop.enrolled.toLocaleString("en-IN") : "—") },
          { label: "Rating", value: loading ? null : (workshop?.rating != null ? `${workshop.rating.toFixed(1)} / 5` : "—") },
          { label: "Price", value: loading ? null : (workshop?.price != null ? `₹${workshop.price.toLocaleString("en-IN")}` : "—") },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-white p-5 text-center shadow-sm">
            {s.value === null ? (
              <Skeleton className="h-8 w-16 mx-auto" />
            ) : (
              <p className="text-2xl font-bold text-primary">{s.value}</p>
            )}
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Details card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-[var(--foreground)]">Workshop Details</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(["title", "instructor", "grade", "duration"] as const).map((k) => (
              <div key={k} className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{k}</label>
                <input value={form[k] as string} onChange={(e) => setForm((w) => ({ ...w, [k]: e.target.value }))}
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Category</label>
              <select value={form.category} onChange={(e) => setForm((w) => ({ ...w, category: e.target.value }))}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Price (₹)</label>
              <input type="number" value={form.price} onChange={(e) => setForm((w) => ({ ...w, price: Number(e.target.value) }))}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((w) => ({ ...w, description: e.target.value }))}
                rows={3} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none" />
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Category" value={workshop?.category ?? ""} />
            <Field label="Duration" value={workshop?.duration ?? ""} />
            <Field label="Grade Range" value={workshop?.grade ?? ""} />
            <Field label="Instructor" value={workshop?.instructor ?? ""} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Description" value={workshop?.description ?? ""} />
            </div>
          </div>
        )}
      </div>

      {/* Visibility toggles */}
      {!loading && workshop && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Visibility</h2>
          <Toggle on={workshop.featured} onToggle={() => toggle("featured")} label="Featured on homepage" />
          <Toggle on={workshop.published} onToggle={() => toggle("published")} label="Published in catalog" />
        </div>
      )}
    </div>
  );
}
