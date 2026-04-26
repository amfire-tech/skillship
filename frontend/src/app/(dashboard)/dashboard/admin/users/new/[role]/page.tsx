"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAuthStore } from "@/store/authStore";

const roleMeta: Record<string, { label: string; color: string; fields: string[] }> = {
  SUB_ADMIN: {
    label: "Sub Admin",
    color: "from-amber-400 to-orange-400",
    fields: ["first_name", "last_name", "email", "phone", "school", "password"],
  },
  TEACHER: {
    label: "Teacher",
    color: "from-primary to-accent",
    fields: ["first_name", "last_name", "email", "phone", "school", "password"],
  },
  PRINCIPAL: {
    label: "Principal",
    color: "from-violet-500 to-fuchsia-400",
    fields: ["first_name", "last_name", "email", "phone", "school", "password"],
  },
  STUDENT: {
    label: "Student",
    color: "from-teal-500 to-cyan-400",
    fields: ["first_name", "last_name", "email", "phone", "school", "admission_number", "password"],
  },
};

const fieldMeta: Record<string, { label: string; type: string; placeholder: string }> = {
  first_name:       { label: "First Name",        type: "text",     placeholder: "e.g. Vishal" },
  last_name:        { label: "Last Name",         type: "text",     placeholder: "e.g. Kumar" },
  email:            { label: "Email Address",     type: "email",    placeholder: "e.g. vishal@school.edu.in" },
  phone:            { label: "Phone Number",      type: "tel",      placeholder: "+91 98765 43210" },
  school:           { label: "School",            type: "select",   placeholder: "Select a school" },
  admission_number: { label: "Admission Number",  type: "text",     placeholder: "e.g. 2024/STD/001" },
  password:         { label: "Temporary Password", type: "password", placeholder: "Min. 8 characters" },
};

function validateFields(
  fields: string[],
  values: Record<string, string>,
): Record<string, string> {
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

export default function CreateUserRolePage() {
  const params = useParams();
  const router = useRouter();
  const role = (params?.role as string) ?? "";
  const meta = roleMeta[role];

  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState<{ name: string } | null>(null);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!meta?.fields.includes("school")) return;
    async function fetchSchools() {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/schools/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSchools(data.results ?? []);
        }
      } catch {
        // schools list stays empty; user sees empty dropdown
      }
    }
    fetchSchools();
  }, [meta]);

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-bold text-[var(--foreground)]">Unknown role: <span className="text-red-500">{role}</span></p>
        <Link href="/dashboard/admin/users/new" className="mt-4 text-sm text-primary underline">
          Go back
        </Link>
      </div>
    );
  }

  function handleChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateFields(meta.fields, values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsLoading(true);

    const token = await getToken();
    if (!token) {
      setErrors({ _global: "Session expired. Please log in again." });
      setIsLoading(false);
      return;
    }

    // Auto-generate username from email prefix
    const username = (values.email ?? "")
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");

    const body: Record<string, string | null> = {
      first_name: values.first_name ?? "",
      last_name: values.last_name ?? "",
      email: values.email ?? "",
      username,
      role,
      phone: values.phone ?? "",
      password: values.password ?? "",
      school: values.school || null,
      admission_number: values.admission_number ?? "",
    };

    try {
      const res = await fetch(`${API_BASE}/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const name = [values.first_name, values.last_name].filter(Boolean).join(" ") || "The new user";
        setSubmitted({ name });
        return;
      }

      const data = await res.json();
      const fieldErrors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(data)) {
        fieldErrors[key] = Array.isArray(msgs) ? (msgs as string[])[0] : String(msgs);
      }
      // If there's a username conflict, show it as a global message since username is hidden
      if (fieldErrors.username) {
        fieldErrors._global = `Username conflict: ${fieldErrors.username}. Try a different email prefix.`;
        delete fieldErrors.username;
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
            <span className="font-semibold text-[var(--foreground)]">{submitted.name}</span> has been added as a{" "}
            <span className="font-semibold text-primary">{meta.label}</span> and saved to the database.
          </p>
          <div className="mt-7 flex gap-3">
            <button
              onClick={() => { setSubmitted(null); setValues({}); setErrors({}); }}
              className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
            >
              Add Another
            </button>
            <button
              onClick={() => router.push("/dashboard/admin/users")}
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
            href="/dashboard/admin/users/new"
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
          <div className={`h-1.5 w-full bg-gradient-to-r ${meta.color}`} />

          <div className="p-7 md:p-9">
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

            {errors._global && (
              <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {errors._global}
              </div>
            )}

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

                    {f.type === "select" ? (
                      <select
                        id={fieldId}
                        value={values[key] ?? ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        aria-describedby={errors[key] ? errorId : undefined}
                        aria-invalid={!!errors[key]}
                        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:ring-4 ${
                          errors[key]
                            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                            : "border-[var(--border)] focus:border-primary focus:ring-primary/10"
                        }`}
                      >
                        <option value="">— Select a school —</option>
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    ) : (
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
                    )}

                    {errors[key] && (
                      <p id={errorId} role="alert" className="text-[11px] font-medium text-red-500">
                        {errors[key]}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-xl bg-[var(--muted)]/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
              <p className="text-xs text-[var(--muted-foreground)]">
                The user will be saved to the database immediately. Login credentials are the email and password you set.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-7 py-4 md:px-9">
            <Link
              href="/dashboard/admin/users/new"
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
