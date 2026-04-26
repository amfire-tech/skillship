"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/authStore";

const boardOptions = [
  { value: "CBSE", label: "CBSE" },
  { value: "ICSE", label: "ICSE" },
  { value: "STATE", label: "State Board" },
];

const planOptions = [
  { value: "CORE", label: "Core", desc: "Standard LMS features for growing schools" },
  { value: "AGENTIC", label: "Agentic", desc: "Full AI-powered learning with autonomous agents" },
] as const;

type Plan = typeof planOptions[number]["value"];

interface FormValues {
  name: string;
  board: string;
  city: string;
  state: string;
  address: string;
  plan: Plan;
}

const initial: FormValues = { name: "", board: "CBSE", city: "", state: "", address: "", plan: "CORE" };

type FormErrors = Partial<Record<keyof FormValues | "_global", string>>;

function validate(v: FormValues): FormErrors {
  const err: FormErrors = {};
  if (!v.name.trim()) err.name = "School name is required";
  if (!v.board) err.board = "Board is required";
  return err;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function getToken(): Promise<string | null> {
  let token = useAuthStore.getState().accessToken;
  if (!token) {
    const ok = await useAuthStore.getState().refreshAuth();
    if (!ok) return null;
    token = useAuthStore.getState().accessToken;
  }
  return token;
}

export default function AddSchoolPage() {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(key: keyof FormValues, val: string) {
    setValues((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setIsLoading(true);

    const token = await getToken();
    if (!token) { setErrors({ _global: "Session expired. Please log in again." }); setIsLoading(false); return; }

    try {
      const res = await fetch(`${API_BASE}/schools/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: values.name,
          board: values.board,
          city: values.city,
          state: values.state,
          address: values.address,
          plan: values.plan,
        }),
      });

      if (res.ok) { setSubmitted(true); return; }

      const data = await res.json();
      const fieldErrors: FormErrors = {};
      for (const [k, msgs] of Object.entries(data)) {
        fieldErrors[k as keyof FormErrors] = Array.isArray(msgs) ? (msgs as string[])[0] : String(msgs);
      }
      setErrors(fieldErrors);
    } catch {
      setErrors({ _global: "Network error. Is the server running?" });
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center rounded-[28px] border border-[var(--border)] bg-white p-10 text-center shadow-[0_30px_80px_-50px_rgba(5,150,105,0.3)]"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-[0_16px_30px_-12px_rgba(5,150,105,0.5)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <h2 className="mt-5 text-xl font-bold text-[var(--foreground)]">School Added!</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--foreground)]">{values.name}</span> has been registered and saved to the database.
          </p>
          <div className="mt-7 flex gap-3">
            <button onClick={() => { setSubmitted(false); setValues(initial); setErrors({}); }}
              className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">
              Add Another
            </button>
            <button onClick={() => router.push("/dashboard/admin/schools")}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5">
              View All Schools
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New School"
        subtitle="Register a school on the platform"
        action={
          <Link href="/dashboard/admin/schools"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Back
          </Link>
        }
      />

      <motion.form onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[0_20px_60px_-30px_rgba(5,150,105,0.2)]">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary to-accent" />
          <div className="p-7 md:p-9">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.4)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
                </svg>
              </div>
              <div>
                <p className="text-base font-bold text-[var(--foreground)]">School Details</p>
                <p className="text-xs text-[var(--muted-foreground)]">Name and board are required</p>
              </div>
            </div>

            {errors._global && (
              <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errors._global}</div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              {/* School Name — full width */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="grid gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">School Name <span className="text-red-400">*</span></label>
                <input type="text" placeholder="e.g. Delhi Public School, Noida" value={values.name}
                  onChange={(e) => handleChange("name", e.target.value)} aria-invalid={!!errors.name}
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:ring-4 ${errors.name ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-[var(--border)] focus:border-primary focus:ring-primary/10"}`} />
                {errors.name && <p role="alert" className="text-[11px] font-medium text-red-500">{errors.name}</p>}
              </motion.div>

              {/* Board */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.14 }} className="grid gap-1.5">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">School Board <span className="text-red-400">*</span></label>
                <select value={values.board} onChange={(e) => handleChange("board", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10">
                  {boardOptions.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </motion.div>

              {/* City */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.18 }} className="grid gap-1.5">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">City</label>
                <input type="text" placeholder="e.g. Bengaluru" value={values.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </motion.div>

              {/* State */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.22 }} className="grid gap-1.5">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">State</label>
                <input type="text" placeholder="e.g. Karnataka" value={values.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </motion.div>

              {/* Address — full width */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.26 }} className="grid gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">School Address</label>
                <input type="text" placeholder="Full postal address" value={values.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </motion.div>
            </div>

            {/* Plan picker */}
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold text-[var(--muted-foreground)]">Subscription Plan</p>
              <div className="grid gap-3 md:grid-cols-2">
                {planOptions.map((p) => (
                  <button key={p.value} type="button" onClick={() => handleChange("plan", p.value)}
                    className={`rounded-xl border p-3 text-left transition-all ${values.plan === p.value ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-[var(--border)] bg-[var(--muted)]/30 hover:border-primary/30"}`}>
                    <p className="text-sm font-bold text-[var(--foreground)]">{p.label}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-7 py-4 md:px-9">
            <Link href="/dashboard/admin/schools"
              className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">
              Cancel
            </Link>
            <button type="submit" disabled={isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {isLoading ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
                </svg>
              )}
              {isLoading ? "Saving…" : "Add School"}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
