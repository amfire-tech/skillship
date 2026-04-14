"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";

interface SchoolRow {
  name: string;
  city: string;
  principal: string;
  students: string;
  plan: "Premium" | "Standard" | "Basic";
  status: "Active" | "Pending" | "Inactive";
}

const schools: SchoolRow[] = [
  { name: "Delhi Public School, Noida", city: "Noida", principal: "Dr. Meera Sharma", students: "2,100", plan: "Premium", status: "Active" },
  { name: "Kendriya Vidyalaya, Sector 21", city: "Chandigarh", principal: "Mr. Rajesh Verma", students: "1,240", plan: "Premium", status: "Active" },
  { name: "St. Xavier's High School", city: "Mumbai", principal: "Fr. Thomas D'Souza", students: "880", plan: "Standard", status: "Pending" },
  { name: "Vidya Niketan School", city: "Hyderabad", principal: "Mrs. Lakshmi Reddy", students: "650", plan: "Basic", status: "Active" },
  { name: "Sunrise Academy", city: "Jaipur", principal: "Mr. Anil Sharma", students: "420", plan: "Basic", status: "Pending" },
  { name: "St. Joseph's Convent School", city: "Bengaluru", principal: "Sr. Mary Fernandez", students: "1,560", plan: "Standard", status: "Active" },
  { name: "Army Public School", city: "Pune", principal: "Col. Arvind Kumar (Retd.)", students: "720", plan: "Standard", status: "Active" },
  { name: "GD Goenka Public School", city: "Gurugram", principal: "Mrs. Priya Kapoor", students: "1,830", plan: "Premium", status: "Active" },
  { name: "Tagore International School", city: "Delhi", principal: "Dr. S.K. Gupta", students: "940", plan: "Standard", status: "Inactive" },
  { name: "Maharishi Vidya Mandir", city: "Chennai", principal: "Mr. Krishnaswami", students: "1,100", plan: "Basic", status: "Active" },
];

const planClass: Record<SchoolRow["plan"], string> = {
  Premium: "bg-amber-50 text-amber-700 border-amber-200",
  Standard: "bg-violet-50 text-violet-700 border-violet-200",
  Basic: "bg-slate-50 text-slate-600 border-slate-200",
};

const statusClass: Record<SchoolRow["status"], string> = {
  Active: "bg-primary/10 text-primary border-primary/20",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Inactive: "bg-slate-100 text-slate-600 border-slate-200",
};

function initialsColor(name: string) {
  const palette = [
    "from-primary to-accent",
    "from-teal-500 to-primary",
    "from-emerald-500 to-teal-500",
    "from-primary-700 to-primary",
    "from-accent to-primary-500",
  ];
  const i = name.charCodeAt(0) % palette.length;
  return palette[i];
}

export default function SchoolsManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Schools Management"
        subtitle={`${schools.length} schools registered on the platform`}
        action={
          <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Add New School
          </button>
        }
      />

      {/* Filters bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 md:flex-row md:items-center"
      >
        <div className="relative flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search by school name or principal…"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <select className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
          <option>All Cities</option>
          <option>Delhi</option><option>Mumbai</option><option>Bengaluru</option><option>Chennai</option>
        </select>
        <select className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
          <option>All Status</option>
          <option>Active</option><option>Pending</option><option>Inactive</option>
        </select>
        <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {schools.length} of {schools.length} schools
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-5 py-3">School Name</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Principal</th>
                <th className="px-5 py-3">Students</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((s, i) => (
                <motion.tr
                  key={s.name}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.03 }}
                  className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/40"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${initialsColor(s.name)}`}>
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-[var(--foreground)]">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{s.city}</td>
                  <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{s.principal}</td>
                  <td className="px-5 py-3.5 text-[var(--foreground)]">{s.students}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${planClass[s.plan]}`}>
                      {s.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusClass[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3 text-xs">
                      <button className="font-semibold text-primary transition-colors hover:text-primary-700">View</button>
                      <button className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">Edit</button>
                      <button className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-red-500">Remove</button>
                    </div>
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
