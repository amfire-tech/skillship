"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

const STUB = {
  title: "AI Vision Lab",
  category: "AI & ML",
  duration: "Half day",
  grade: "Class 9–12",
  price: 2499,
  enrolled: 1840,
  rating: 4.8,
  featured: true,
  published: true,
  description: "Hands-on AI computer vision workshop using cameras, Python and OpenCV. Students build face-detection and object-recognition apps.",
  instructor: "Skillship AI Team",
};

const categories = ["AI & ML", "Robotics", "Coding", "Electronics", "IoT"] as const;

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value || "—"}</p>
  </div>
);

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
  const [workshop, setWorkshop] = useState({ ...STUB });
  const [editing, setEditing] = useState(false);

  function save() {
    // TODO: PATCH /api/v1/marketplace/workshops/{id}/
    toast("Workshop updated", "success");
    setEditing(false);
  }

  function toggle(key: "featured" | "published") {
    setWorkshop((w) => {
      const next = !w[key];
      toast(`Workshop ${next ? key : `un${key}`}`, next ? "success" : "info");
      return { ...w, [key]: next };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">{workshop.title}</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Workshop ID: {id} · <Link href="/dashboard/admin/marketplace" className="text-primary hover:underline">Marketplace</Link></p>
        </div>
        <div className="ml-auto flex gap-2">
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]">Cancel</button>
              <button type="button" onClick={save}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">Save</button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">Edit Workshop</button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Enrolled", value: workshop.enrolled.toLocaleString("en-IN") },
          { label: "Rating", value: `${workshop.rating.toFixed(1)} / 5` },
          { label: "Price", value: `₹${workshop.price.toLocaleString("en-IN")}` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-white p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Details card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-[15px] font-semibold text-[var(--foreground)]">Workshop Details</h2>
        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(["title", "instructor", "grade", "duration"] as const).map((k) => (
              <div key={k} className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{k}</label>
                <input value={workshop[k]} onChange={(e) => setWorkshop((w) => ({ ...w, [k]: e.target.value }))}
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Category</label>
              <select value={workshop.category} onChange={(e) => setWorkshop((w) => ({ ...w, category: e.target.value as typeof workshop.category }))}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Price (₹)</label>
              <input type="number" value={workshop.price} onChange={(e) => setWorkshop((w) => ({ ...w, price: Number(e.target.value) }))}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Description</label>
              <textarea value={workshop.description} onChange={(e) => setWorkshop((w) => ({ ...w, description: e.target.value }))}
                rows={3} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none" />
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Category" value={workshop.category} />
            <Field label="Duration" value={workshop.duration} />
            <Field label="Grade Range" value={workshop.grade} />
            <Field label="Instructor" value={workshop.instructor} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Description" value={workshop.description} />
            </div>
          </div>
        )}
      </div>

      {/* Visibility toggles */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-[15px] font-semibold text-[var(--foreground)]">Visibility</h2>
        <Toggle on={workshop.featured} onToggle={() => toggle("featured")} label="Featured on homepage" />
        <Toggle on={workshop.published} onToggle={() => toggle("published")} label="Published in catalog" />
      </div>
    </div>
  );
}
