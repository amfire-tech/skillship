"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface SchoolRow {
  name: string;
  date: string;
  city: string;
  students: string;
  plan: "Premium" | "Standard" | "Basic";
  status: "Active" | "Pending";
}

const rows: SchoolRow[] = [
  { name: "Kendriya Vidyalaya, Sector 21", date: "Mar 5, 2026", city: "Chandigarh", students: "1,240", plan: "Premium", status: "Active" },
  { name: "Delhi Public School, Noida", date: "Mar 4, 2026", city: "Noida", students: "2,100", plan: "Premium", status: "Active" },
  { name: "St. Xavier's High School", date: "Mar 3, 2026", city: "Mumbai", students: "880", plan: "Standard", status: "Pending" },
  { name: "Vidya Niketan School", date: "Mar 2, 2026", city: "Hyderabad", students: "650", plan: "Basic", status: "Active" },
  { name: "Sunrise Academy", date: "Mar 1, 2026", city: "Jaipur", students: "420", plan: "Basic", status: "Pending" },
];

const planClass: Record<SchoolRow["plan"], string> = {
  Premium: "bg-amber-50 text-amber-700 border-amber-200",
  Standard: "bg-violet-50 text-violet-700 border-violet-200",
  Basic: "bg-slate-50 text-slate-600 border-slate-200",
};

const statusClass: Record<SchoolRow["status"], string> = {
  Active: "bg-primary/10 text-primary border-primary/20",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
};

export function RecentSchoolsTable() {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-[var(--border)] bg-white p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Recently Joined Schools</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Latest schools onboarded to the platform</p>
        </div>
        <Link href="/admin/schools" className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-700">
          View all
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              <th className="py-3 pr-4">School name</th>
              <th className="py-3 pr-4">City</th>
              <th className="py-3 pr-4">Students</th>
              <th className="py-3 pr-4">Plan</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <motion.tr
                key={r.name}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.3 + i * 0.05 }}
                className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/40"
              >
                <td className="py-3 pr-4">
                  <p className="font-semibold text-[var(--foreground)]">{r.name}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">{r.date}</p>
                </td>
                <td className="py-3 pr-4 text-[var(--muted-foreground)]">{r.city}</td>
                <td className="py-3 pr-4 text-[var(--foreground)]">{r.students}</td>
                <td className="py-3 pr-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${planClass[r.plan]}`}>
                    {r.plan}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusClass[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-3 text-xs">
                    <button onClick={() => router.push("/admin/schools")} className="font-semibold text-primary transition-colors hover:text-primary-700">View</button>
                    <button onClick={() => router.push("/admin/schools")} className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">Edit</button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
