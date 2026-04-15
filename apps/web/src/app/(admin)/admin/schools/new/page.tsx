"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";

// Backend team: POST /api/schools with this payload:
// { name, principal, email, phone, city, address, students, board, plan }
// Returns: { id, ...school }
// Then redirect to /admin/schools

const boardOptions = ["CBSE", "ICSE", "State Board", "IB", "Cambridge", "Other"];
const planOptions = ["Basic", "Standard", "Premium"] as const;

type Plan = typeof planOptions[number];

const planMeta: Record<Plan, { color: string; desc: string }> = {
  Basic:    { color: "border-slate-200 bg-slate-50",   desc: "Up to 3 teachers, 500 students" },
  Standard: { color: "border-violet-200 bg-violet-50", desc: "Up to 10 teachers, 1,500 students" },
  Premium:  { color: "border-amber-200 bg-amber-50",   desc: "Unlimited teachers & students" },
};

interface FormValues {
  name: string;
  principal: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  students: string;
  board: string;
  plan: Plan;
}

const initial: FormValues = {
  name: "", principal: "", email: "", phone: "",
  city: "", address: "", students: "", board: "CBSE", plan: "Standard",
};

const fields: { key: keyof FormValues; label: string; type?: string; placeholder: string; wide?: boolean }[] = [
  { key: "name",      label: "School Name",      placeholder: "e.g. Delhi Public School, Noida", wide: true },
  { key: "principal", label: "Principal Name",    placeholder: "e.g. Dr. Priya Sharma" },
  { key: "email",     label: "Official Email",    type: "email", placeholder: "principal@school.edu.in" },
  { key: "phone",     label: "Contact Number",    type: "tel",   placeholder: "+91 98765 43210" },
  { key: "city",      label: "City",              placeholder: "e.g. Bengaluru" },
  { key: "students",  label: "No. of Students",   type: "number", placeholder: "e.g. 1200" },
  { key: "address",   label: "School Address",    placeholder: "Full postal address", wide: true },
];

type FormErrors = Partial<Record<keyof FormValues, string>>;

function validate(v: FormValues): FormErrors {
  const err: FormErrors = {};
  if (!v.name.trim()) err.name = "School name is required";
  if (!v.principal.trim()) err.principal = "Principal name is required";
  if (!v.email.trim()) err.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) err.email = "Enter a valid email address";
  if (!v.phone.trim()) err.phone = "Contact number is required";
  if (!v.city.trim()) err.city = "City is required";
  if (!v.students.trim()) err.students = "Number of students is required";
  else if (Number(v.students) < 1) err.students = "Must be at least 1";
  if (!v.address.trim()) err.address = "Address is required";
  return err;
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    // TODO (backend): replace with POST /api/schools
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); setSubmitted(true); }, 600);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center rounded-[28px] border border-[var(--border)] bg-white p-10 text-center shadow-[0_30px_80px_-50px_rgba(5,150,105,0.3)]"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-[0_16px_30px_-12px_rgba(5,150,105,0.5)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="mt-5 text-xl font-bold text-[var(--foreground)]">School Added!</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--foreground)]">{values.name}</span> has been registered. Connect the backend to persist and send onboarding emails.
          </p>
          <div className="mt-7 flex gap-3">
            <button
              onClick={() => { setSubmitted(false); setValues(initial); }}
              className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
            >
              Add Another
            </button>
            <button
              onClick={() => router.push("/admin/schools")}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
            >
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
        subtitle="Register a school and assign an onboarding plan"
        action={
          <Link
            href="/admin/schools"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </Link>
        }
      />

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl"
      >
        <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[0_20px_60px_-30px_rgba(5,150,105,0.2)]">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary to-accent" />

          <div className="p-7 md:p-9">
            {/* Icon + title */}
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.4)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
                </svg>
              </div>
              <div>
                <p className="text-base font-bold text-[var(--foreground)]">School Details</p>
                <p className="text-xs text-[var(--muted-foreground)]">All fields required unless marked optional</p>
              </div>
            </div>

            {/* Fields */}
            <div className="grid gap-5 md:grid-cols-2">
              {fields.map((f, i) => (
                <motion.div
                  key={f.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
                  className={`grid gap-1.5 ${f.wide ? "md:col-span-2" : ""}`}
                >
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">{f.label}</label>
                  <input
                    type={f.type ?? "text"}
                    id={`field-${f.key}`}
                    placeholder={f.placeholder}
                    value={values[f.key]}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    aria-describedby={errors[f.key] ? `err-${f.key}` : undefined}
                    aria-invalid={!!errors[f.key]}
                    className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:ring-4 ${
                      errors[f.key]
                        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                        : "border-[var(--border)] focus:border-primary focus:ring-primary/10"
                    }`}
                  />
                  {errors[f.key] && (
                    <p id={`err-${f.key}`} role="alert" className="text-[11px] font-medium text-red-500">{errors[f.key]}</p>
                  )}
                </motion.div>
              ))}

              {/* Board select */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.38 }}
                className="grid gap-1.5"
              >
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">School Board</label>
                <select
                  value={values.board}
                  onChange={(e) => handleChange("board", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  {boardOptions.map((b) => <option key={b}>{b}</option>)}
                </select>
              </motion.div>
            </div>

            {/* Plan picker */}
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold text-[var(--muted-foreground)]">Subscription Plan</p>
              <div className="grid gap-3 md:grid-cols-3">
                {planOptions.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleChange("plan", p)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      values.plan === p
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : planMeta[p].color
                    }`}
                  >
                    <p className="text-sm font-bold text-[var(--foreground)]">{p}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{planMeta[p].desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Backend notice */}
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-[var(--muted)]/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
              <p className="text-xs text-[var(--muted-foreground)]">
                Backend: connect <code className="rounded bg-[var(--muted)] px-1 text-[10px]">POST /api/schools</code> to persist and trigger onboarding email.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-7 py-4 md:px-9">
            <Link
              href="/admin/schools"
              className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
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
