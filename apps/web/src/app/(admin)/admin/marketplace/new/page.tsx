"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";

// Backend team: POST /api/workshops with this payload:
// { title, category, duration, grade, price, description, image_url, published: false }
// Returns: { id, ...workshop }
// Then redirect to /admin/marketplace

type Category = "AI & ML" | "Robotics" | "Coding" | "Electronics" | "IoT";
const categories: Category[] = ["AI & ML", "Robotics", "Coding", "Electronics", "IoT"];
const durations = ["Under 2 hours", "Half day", "Full day", "2 days", "Multi-session"];

const categoryTint: Record<Category, string> = {
  "AI & ML":     "border-primary/30 bg-primary/5 text-primary",
  Robotics:      "border-violet-200 bg-violet-50 text-violet-700",
  Coding:        "border-sky-200 bg-sky-50 text-sky-700",
  Electronics:   "border-amber-200 bg-amber-50 text-amber-700",
  IoT:           "border-teal-200 bg-teal-50 text-teal-700",
};

interface FormValues {
  title: string;
  category: Category;
  duration: string;
  gradeMin: string;
  gradeMax: string;
  price: string;
  description: string;
  imageUrl: string;
}

const initial: FormValues = {
  title: "", category: "Coding", duration: "Half day",
  gradeMin: "6", gradeMax: "8", price: "", description: "", imageUrl: "",
};

type MarketplaceErrors = Partial<Record<keyof FormValues | "gradeRange", string>>;

function validateWorkshop(v: FormValues): MarketplaceErrors {
  const err: MarketplaceErrors = {};
  if (!v.title.trim()) err.title = "Workshop title is required";
  else if (v.title.trim().length < 3) err.title = "Title must be at least 3 characters";
  if (!v.price.trim()) err.price = "Price is required";
  else if (Number(v.price) < 0) err.price = "Price cannot be negative";
  if (!v.description.trim()) err.description = "Description is required";
  else if (v.description.trim().length < 20) err.description = "Description must be at least 20 characters";
  const min = Number(v.gradeMin);
  const max = Number(v.gradeMax);
  if (v.gradeMin && v.gradeMax && min > max) {
    err.gradeRange = "Grade 'From' must be less than or equal to 'To'";
  }
  return err;
}

export default function AddWorkshopPage() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<MarketplaceErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set(key: keyof FormValues, val: string) {
    setValues((p) => ({ ...p, [key]: val }));
    if (errors[key as keyof MarketplaceErrors]) setErrors((e) => ({ ...e, [key]: undefined }));
    if (key === "gradeMin" || key === "gradeMax") setErrors((e) => ({ ...e, gradeRange: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateWorkshop(values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    // TODO (backend): replace with POST /api/workshops
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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="mt-5 text-xl font-bold text-[var(--foreground)]">Workshop Added!</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--foreground)]">{values.title}</span> saved as unpublished. Connect the backend to persist and publish to marketplace.
          </p>
          <div className="mt-7 flex gap-3">
            <button
              onClick={() => { setSubmitted(false); setValues(initial); }}
              className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
            >
              Add Another
            </button>
            <button
              onClick={() => router.push("/admin/marketplace")}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
            >
              View Marketplace
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Workshop"
        subtitle="Create a new marketplace workshop listing"
        action={
          <Link
            href="/admin/marketplace"
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
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" /><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" />
                </svg>
              </div>
              <div>
                <p className="text-base font-bold text-[var(--foreground)]">Workshop Details</p>
                <p className="text-xs text-[var(--muted-foreground)]">Saved as unpublished — publish from the marketplace table</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Title */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Workshop Title</label>
                <input type="text" placeholder="e.g. AI Vision Lab" value={values.title} onChange={(e) => set("title", e.target.value)} aria-describedby={errors.title ? "mkt-title-err" : undefined} aria-invalid={!!errors.title} className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:ring-4 ${errors.title ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-[var(--border)] focus:border-primary focus:ring-primary/10"}`} />
                {errors.title && <p id="mkt-title-err" role="alert" className="text-[11px] font-medium text-red-500">{errors.title}</p>}
              </motion.div>

              {/* Category */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="grid gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("category", c)}
                      className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                        values.category === c
                          ? categoryTint[c] + " ring-2 ring-offset-1"
                          : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-primary/30"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Duration */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="grid gap-1.5">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Duration</label>
                <select value={values.duration} onChange={(e) => set("duration", e.target.value)} className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
                  {durations.map((d) => <option key={d}>{d}</option>)}
                </select>
              </motion.div>

              {/* Price */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="grid gap-1.5">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Price (₹)</label>
                <input type="number" placeholder="e.g. 2499" value={values.price} onChange={(e) => set("price", e.target.value)} min="0" aria-describedby={errors.price ? "mkt-price-err" : undefined} aria-invalid={!!errors.price} className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:ring-4 ${errors.price ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-[var(--border)] focus:border-primary focus:ring-primary/10"}`} />
                {errors.price && <p id="mkt-price-err" role="alert" className="text-[11px] font-medium text-red-500">{errors.price}</p>}
              </motion.div>

              {/* Grade range */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="grid gap-1.5">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Grade Range</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="From" min="1" max="12" value={values.gradeMin} onChange={(e) => set("gradeMin", e.target.value)} className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:ring-4 ${errors.gradeRange ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-[var(--border)] focus:border-primary focus:ring-primary/10"}`} />
                  <span className="text-xs text-[var(--muted-foreground)]">to</span>
                  <input type="number" placeholder="To" min="1" max="12" value={values.gradeMax} onChange={(e) => set("gradeMax", e.target.value)} className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:ring-4 ${errors.gradeRange ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-[var(--border)] focus:border-primary focus:ring-primary/10"}`} />
                </div>
                {errors.gradeRange && <p className="text-[11px] font-medium text-red-500">{errors.gradeRange}</p>}
              </motion.div>

              {/* Image URL */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Image URL <span className="font-normal">(optional — upload via backend/CDN)</span></label>
                <input type="url" placeholder="https://cdn.skillship.in/workshops/..." value={values.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </motion.div>

              {/* Description */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }} className="grid gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Description</label>
                <textarea rows={4} placeholder="What will students learn? What materials are included?" value={values.description} onChange={(e) => set("description", e.target.value)} aria-describedby={errors.description ? "mkt-desc-err" : undefined} aria-invalid={!!errors.description} className={`w-full rounded-lg border bg-white px-3 py-2 text-sm resize-none outline-none focus:ring-4 ${errors.description ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-[var(--border)] focus:border-primary focus:ring-primary/10"}`} />
                {errors.description && <p id="mkt-desc-err" role="alert" className="text-[11px] font-medium text-red-500">{errors.description}</p>}
              </motion.div>
            </div>

            {/* Backend notice */}
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-[var(--muted)]/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
              <p className="text-xs text-[var(--muted-foreground)]">
                Backend: connect <code className="rounded bg-[var(--muted)] px-1 text-[10px]">POST /api/workshops</code>. Image upload needs <code className="rounded bg-[var(--muted)] px-1 text-[10px]">POST /api/uploads</code> returning a CDN URL.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-7 py-4 md:px-9">
            <Link href="/admin/marketplace" className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">
              Cancel
            </Link>
            <button type="submit" disabled={isLoading} className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {isLoading ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" /><path d="M5 12h14" />
                </svg>
              )}
              {isLoading ? "Saving…" : "Add Workshop"}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
