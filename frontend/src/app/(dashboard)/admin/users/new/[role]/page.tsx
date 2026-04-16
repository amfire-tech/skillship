"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

const roleMeta: Record<string, { label: string; color: string; fields: string[] }> = {
  subadmin: {
    label: "Sub Admin",
    color: "from-amber-400 to-orange-400",
    fields: ["full_name", "email", "phone", "region", "password"],
  },
  teacher: {
    label: "Teacher",
    color: "from-primary to-accent",
    fields: ["full_name", "email", "phone", "school", "subject", "password"],
  },
  principal: {
    label: "Principal",
    color: "from-violet-500 to-fuchsia-400",
    fields: ["full_name", "email", "phone", "school", "password"],
  },
  student: {
    label: "Student",
    color: "from-teal-500 to-cyan-400",
    fields: ["full_name", "email", "phone", "school", "class_grade", "password"],
  },
};

const fieldMeta: Record<string, { label: string; type: string; placeholder: string }> = {
  full_name:   { label: "Full Name",           type: "text",     placeholder: "e.g. Rahul Iyer" },
  email:       { label: "Email Address",        type: "email",    placeholder: "e.g. rahul@school.edu.in" },
  phone:       { label: "Phone Number",         type: "tel",      placeholder: "+91 98765 43210" },
  region:      { label: "Region",               type: "text",     placeholder: "e.g. North India" },
  school:      { label: "School Name",          type: "text",     placeholder: "e.g. Delhi Public School, Noida" },
  subject:     { label: "Primary Subject",      type: "text",     placeholder: "e.g. Mathematics" },
  class_grade: { label: "Class / Grade",        type: "text",     placeholder: "e.g. Class 9-A" },
  password:    { label: "Temporary Password",   type: "password", placeholder: "Min. 8 characters" },
};

function validateFields(fields: string[], values: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const key of fields) {
    const val = (values[key] ?? "").trim();
    if (!val) {
      errors[key] = `${fieldMeta[key]?.label ?? key} is required`;
      continue;
    }
    if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      errors[key] = "Enter a valid email address";
    }
    if (key === "phone" && !/^[+]?[\d\s\-()]{8,15}$/.test(val)) {
      errors[key] = "Enter a valid phone number";
    }
    if (key === "password" && val.length < 8) {
      errors[key] = "Password must be at least 8 characters";
    }
  }
  return errors;
}

export default function CreateUserRolePage() {
  const params = useParams();
  const router = useRouter();
  const role = (params?.role as string) ?? "";
  const meta = roleMeta[role];

  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-bold text-[var(--foreground)]">Unknown role: <span className="text-red-500">{role}</span></p>
        <Link href="/admin/users/new" className="mt-4 text-sm text-primary underline">
          Go back
        </Link>
      </div>
    );
  }

  function handleChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateFields(meta.fields, values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    // Backend team: replace with POST /api/users with { role, ...values }
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
          <h2 className="mt-5 text-xl font-bold text-[var(--foreground)]">User Created!</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--foreground)]">{values.full_name || "The new user"}</span> has been added as a{" "}
            <span className="font-semibold text-primary">{meta.label}</span>. Connect the backend to enable login and email delivery.
          </p>
          <div className="mt-7 flex gap-3">
            <button
              onClick={() => { setSubmitted(false); setValues({}); setErrors({}); }}
              className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
            >
              Add Another
            </button>
            <button
              onClick={() => router.push("/admin/users")}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
            >
              View All Users
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Create ${meta.label}`}
        subtitle={`Fill in the details to create a new ${meta.label.toLowerCase()} account`}
        action={
          <Link
            href="/admin/users/new"
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
          {/* Gradient header strip */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${meta.color}`} />

          <div className="p-7 md:p-9">
            {/* Role badge */}
            <div className="mb-7 flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white ${meta.color} shadow-[0_10px_24px_-10px_rgba(5,150,105,0.4)]`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <p className="text-base font-bold text-[var(--foreground)]">New {meta.label}</p>
                <p className="text-xs text-[var(--muted-foreground)]">All fields required unless marked optional</p>
              </div>
            </div>

            {/* Fields */}
            <div className="grid gap-5 md:grid-cols-2">
              {meta.fields.map((key, i) => {
                const f = fieldMeta[key];
                const isFullWidth = key === "school" || key === "password";
                const fieldId = `field-${key}`;
                const errorId = `error-${key}`;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
                    className={`grid gap-1.5 ${isFullWidth ? "md:col-span-2" : ""}`}
                  >
                    <label htmlFor={fieldId} className="text-xs font-semibold text-[var(--muted-foreground)]">
                      {f.label}
                    </label>
                    <input
                      id={fieldId}
                      type={f.type}
                      placeholder={f.placeholder}
                      value={values[key] ?? ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                      aria-describedby={errors[key] ? errorId : undefined}
                      aria-invalid={!!errors[key]}
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:ring-4 ${
                        errors[key]
                          ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                          : "border-[var(--border)] focus:border-primary focus:ring-primary/10"
                      }`}
                    />
                    {errors[key] && (
                      <p id={errorId} role="alert" className="text-[11px] font-medium text-red-500">
                        {errors[key]}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Notice */}
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-[var(--muted)]/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
              <p className="text-xs text-[var(--muted-foreground)]">
                Backend: connect <code className="rounded bg-[var(--muted)] px-1 text-[10px]">POST /api/users</code> with <code className="rounded bg-[var(--muted)] px-1 text-[10px]">{"{ role, ...fields }"}</code>. In production, login credentials are emailed automatically.
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-7 py-4 md:px-9">
            <Link
              href="/admin/users/new"
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  <path d="M16 11h6" /><path d="M19 8v6" />
                </svg>
              )}
              {isLoading ? "Saving…" : `Create ${meta.label}`}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
