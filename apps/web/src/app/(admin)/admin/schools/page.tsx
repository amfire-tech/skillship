"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";

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
  const toast = useToast();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All Cities");
  const [status, setStatus] = useState("All Status");
  const [schoolList, setSchoolList] = useState(schools);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const filtered = schoolList.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.principal.toLowerCase().includes(q);
    const matchCity = city === "All Cities" || s.city === city;
    const matchStatus = status === "All Status" || s.status === status;
    return matchSearch && matchCity && matchStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schools Management"
        subtitle={`${schoolList.length} schools registered on the platform`}
        action={
          <button
            onClick={() => router.push("/admin/schools/new")}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
          >
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by school name or principal…"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          <option>All Cities</option>
          <option>Delhi</option><option>Mumbai</option><option>Bengaluru</option><option>Chennai</option>
          <option>Noida</option><option>Chandigarh</option><option>Hyderabad</option><option>Jaipur</option>
          <option>Pune</option><option>Gurugram</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          <option>All Status</option>
          <option>Active</option><option>Pending</option><option>Inactive</option>
        </select>
        <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {filtered.length} of {schoolList.length} schools
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">
                    No schools match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
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
                        <span className="max-w-[200px] truncate font-semibold text-[var(--foreground)]">{s.name}</span>
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
                        <button onClick={() => toast(`Viewing ${s.name}`, "info")} className="font-semibold text-primary transition-colors hover:text-primary-700">View</button>
                        <button onClick={() => toast(`Editing ${s.name}`, "info")} className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">Edit</button>
                        <button onClick={() => setConfirmRemove(s.name)} className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-red-500">Remove</button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Confirm Remove Dialog */}
      <AnimatePresence>
        {confirmRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="remove-dialog-title"
              aria-describedby="remove-dialog-desc"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <path d="m3 6 1 14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2L21 6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h3 id="remove-dialog-title" className="mt-4 text-base font-bold text-[var(--foreground)]">Remove school?</h3>
              <p id="remove-dialog-desc" className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                <span className="font-semibold text-[var(--foreground)]">{confirmRemove}</span> will be removed from the platform. This action cannot be undone.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => setConfirmRemove(null)}
                  className="flex-1 h-10 rounded-full border border-[var(--border)] bg-white text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSchoolList((prev) => prev.filter((s) => s.name !== confirmRemove));
                    toast(`${confirmRemove} removed`, "error");
                    setConfirmRemove(null);
                  }}
                  className="flex-1 h-10 rounded-full bg-red-500 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
