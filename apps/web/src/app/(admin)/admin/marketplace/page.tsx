"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";

interface Workshop {
  title: string;
  category: "AI & ML" | "Robotics" | "Coding" | "Electronics" | "IoT";
  duration: string;
  grade: string;
  price: number;
  enrolled: number;
  rating: number;
  featured: boolean;
  published: boolean;
}

const initialWorkshops: Workshop[] = [
  { title: "AI Vision Lab", category: "AI & ML", duration: "Half day", grade: "Class 9–12", price: 2499, enrolled: 1840, rating: 4.8, featured: true, published: true },
  { title: "Robotics Sensor Studio", category: "Robotics", duration: "2 days", grade: "Class 6–8", price: 3999, enrolled: 1240, rating: 4.6, featured: true, published: true },
  { title: "Creative Coding Lab", category: "Coding", duration: "Under 2 hours", grade: "Class 3–5", price: 999, enrolled: 2960, rating: 4.9, featured: false, published: true },
  { title: "Intro to IoT — Smart Classrooms", category: "IoT", duration: "Multi-session", grade: "Class 9–12", price: 4499, enrolled: 620, rating: 4.5, featured: false, published: true },
  { title: "Electronics Starter Kit", category: "Electronics", duration: "Half day", grade: "Class 6–8", price: 1899, enrolled: 1080, rating: 4.7, featured: false, published: false },
  { title: "Python for Beginners", category: "Coding", duration: "Multi-session", grade: "Class 6–12", price: 2299, enrolled: 3210, rating: 4.9, featured: true, published: true },
];

const categoryTint: Record<Workshop["category"], string> = {
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
  const [workshops, setWorkshops] = useState(initialWorkshops);

  function toggleFeatured(index: number) {
    setWorkshops((prev) =>
      prev.map((w, i) => {
        if (i !== index) return w;
        const next = !w.featured;
        toast(`"${w.title}" ${next ? "featured" : "unfeatured"}`, "success");
        return { ...w, featured: next };
      })
    );
  }

  function togglePublished(index: number) {
    setWorkshops((prev) =>
      prev.map((w, i) => {
        if (i !== index) return w;
        const next = !w.published;
        toast(`"${w.title}" ${next ? "published" : "unpublished"}`, next ? "success" : "info");
        return { ...w, published: next };
      })
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Management"
        subtitle="Workshops, pricing, visibility and featured selection across the catalog"
        action={
          <button
            onClick={() => router.push("/admin/marketplace/new")}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Add Workshop
          </button>
        }
      />

      {/* Overview stat row */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Active Workshops", value: "200+", tone: "text-primary" },
          { label: "Total Enrollments", value: "18,420", tone: "text-teal-600" },
          { label: "Revenue (MTD)", value: "₹9,84,000", tone: "text-amber-600" },
          { label: "Avg. Rating", value: "4.7 / 5", tone: "text-violet-600" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
            className="rounded-2xl border border-[var(--border)] bg-white p-4"
          >
            <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
            <p className={`mt-1.5 text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Workshops table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-5 py-3">Workshop</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Grade</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Enrolled</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Featured</th>
                <th className="px-5 py-3">Published</th>
              </tr>
            </thead>
            <tbody>
              {workshops.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">
                    No workshops yet. Add one to get started.
                  </td>
                </tr>
              )}
              {workshops.map((w, i) => (
                <motion.tr
                  key={w.title}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 + i * 0.04 }}
                  className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/40"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white ${categoryTint[w.category]}`}>
                        {w.category.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{w.title}</p>
                        <p className="text-[11px] text-[var(--muted-foreground)]">{w.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{w.duration}</td>
                  <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{w.grade}</td>
                  <td className="px-5 py-3.5 font-semibold text-[var(--foreground)]">₹{w.price.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3.5 text-[var(--foreground)]">{w.enrolled.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" strokeWidth="0"><path d="M12 2 15 8.5l7 1-5.2 5 1.3 7.2L12 18.3l-6.1 3.4 1.3-7.2L2 9.5l7-1z" /></svg>
                      <span className="font-semibold text-[var(--foreground)]">{w.rating.toFixed(1)}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Toggle on={w.featured} onToggle={() => toggleFeatured(i)} />
                  </td>
                  <td className="px-5 py-3.5">
                    <Toggle on={w.published} onToggle={() => togglePublished(i)} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
