"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

// Stub data — replace with GET /api/v1/schools/{id}/ when Django lands
const STUB: Record<string, {
  name: string; plan: string; principal: string; email: string;
  phone: string; city: string; state: string; gstin: string;
  students: number; teachers: number; classes: number; status: string;
}> = {
  default: {
    name: "Delhi Public School, Noida", plan: "Plan 02 — Agentic AI",
    principal: "Dr. Anjali Mehta", email: "dps.noida@skillship.in",
    phone: "+91 98765 43210", city: "Noida", state: "Uttar Pradesh",
    gstin: "09AABCD1234E1Z5", students: 1240, teachers: 68, classes: 32, status: "Active",
  },
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value || "—"}</p>
  </div>
);

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const school = STUB[id] ?? STUB.default;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...school });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  function save() {
    // TODO: PATCH /api/v1/schools/{id}/
    toast("School updated — changes persist after backend connects", "success");
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">{school.name}</h1>
          <p className="text-xs text-[var(--muted-foreground)]">School ID: {id} · <Link href="/dashboard/admin/schools" className="text-primary hover:underline">All Schools</Link></p>
        </div>
        <div className="ml-auto flex gap-2">
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]">Cancel</button>
              <button type="button" onClick={save}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">Save Changes</button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">Edit School</button>
          )}
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Students", value: school.students },
          { label: "Teachers", value: school.teachers },
          { label: "Classes", value: school.classes },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-white p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Details card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-[15px] font-semibold text-[var(--foreground)]">School Details</h2>
        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(["name","plan","principal","email","phone","city","state","gstin"] as const).map((k) => (
              <div key={k} className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{k}</label>
                {k === "plan" ? (
                  <select value={form[k]} onChange={set(k)}
                    className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                    <option>Plan 01 — Standard</option>
                    <option>Plan 02 — Agentic AI</option>
                  </select>
                ) : (
                  <input value={form[k] as string} onChange={set(k)}
                    className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="School Name" value={form.name} />
            <Field label="Plan" value={form.plan} />
            <Field label="Principal" value={form.principal} />
            <Field label="Email" value={form.email} />
            <Field label="Phone" value={form.phone} />
            <Field label="City" value={form.city} />
            <Field label="State" value={form.state} />
            <Field label="GSTIN" value={form.gstin} />
            <Field label="Status" value={form.status} />
          </div>
        )}
      </div>
    </div>
  );
}
