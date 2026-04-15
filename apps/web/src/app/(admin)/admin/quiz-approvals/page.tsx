"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";

interface ApprovalItem {
  title: string;
  subject: string;
  grade: string;
  submittedBy: string;
  school: string;
  submittedAt: string;
  questions: number;
  priority: "High" | "Medium" | "Low";
}

const initialQueue: ApprovalItem[] = [
  { title: "Trigonometry — Heights and Distances", subject: "Mathematics", grade: "Class 10", submittedBy: "Rahul Iyer", school: "Kendriya Vidyalaya, Sector 21", submittedAt: "10 min ago", questions: 20, priority: "High" },
  { title: "Cell Division Practice Set", subject: "Biology", grade: "Class 9", submittedBy: "Dr. Priya Sharma", school: "Delhi Public School, Noida", submittedAt: "1h ago", questions: 15, priority: "High" },
  { title: "Mughal Empire — Fact Check", subject: "History", grade: "Class 7", submittedBy: "Sneha Bose", school: "St. Joseph's Convent School", submittedAt: "3h ago", questions: 12, priority: "Medium" },
  { title: "Ohm's Law Quick Test", subject: "Physics", grade: "Class 11", submittedBy: "Karthik Reddy", school: "Vidya Niketan School", submittedAt: "Yesterday", questions: 10, priority: "Medium" },
  { title: "Reading Comprehension — Fiction", subject: "English", grade: "Class 6", submittedBy: "Meher Kaur", school: "GD Goenka Public School", submittedAt: "2d ago", questions: 8, priority: "Low" },
];

const priorityColor: Record<ApprovalItem["priority"], string> = {
  High: "bg-red-50 text-red-600 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function QuizApprovalPage() {
  const toast = useToast();
  const [queue, setQueue] = useState<ApprovalItem[]>(initialQueue);
  const [approvedCount, setApprovedCount] = useState(28);
  const [rejectedCount, setRejectedCount] = useState(3);

  function approve(title: string) {
    setQueue((prev) => prev.filter((i) => i.title !== title));
    setApprovedCount((n) => n + 1);
    toast(`Quiz approved`, "success");
  }

  function reject(title: string) {
    setQueue((prev) => prev.filter((i) => i.title !== title));
    setRejectedCount((n) => n + 1);
    toast(`Quiz rejected`, "info");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz Approval Panel"
        subtitle={`${queue.length} ${queue.length === 1 ? "quiz" : "quizzes"} pending review from teachers and principals`}
      />

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Pending Review", value: queue.length.toString(), tone: "text-amber-600", icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          ) },
          { label: "Approved Today", value: approvedCount.toString(), tone: "text-primary", icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          ) },
          { label: "Rejected Today", value: rejectedCount.toString(), tone: "text-red-500", icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
          ) },
          { label: "Avg. Review Time", value: "6m 12s", tone: "text-violet-600", icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" /></svg>
          ) },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
            className="flex items-start justify-between rounded-2xl border border-[var(--border)] bg-white p-4"
          >
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
              <p className={`mt-1.5 text-2xl font-bold ${s.tone}`}>{s.value}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted)]/60 ${s.tone}`}>
              {s.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Queue */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {queue.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-white py-16 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">All caught up!</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">No quizzes pending review.</p>
            </motion.div>
          ) : (
            queue.map((item, i) => (
              <motion.div
                key={item.title}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40, scale: 0.97 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-4 transition-all hover:border-primary/30 md:p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-[var(--foreground)]">{item.title}</h3>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityColor[item.priority]}`}>
                          {item.priority}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--muted-foreground)]">
                        <span>{item.subject}</span>
                        <span className="h-1 w-1 rounded-full bg-[var(--muted-foreground)]" />
                        <span>{item.grade}</span>
                        <span className="h-1 w-1 rounded-full bg-[var(--muted-foreground)]" />
                        <span>{item.questions} questions</span>
                        <span className="h-1 w-1 rounded-full bg-[var(--muted-foreground)]" />
                        <span>Submitted {item.submittedAt}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                        <span className="font-semibold text-[var(--foreground)]">{item.submittedBy}</span> · {item.school}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => toast(`Previewing "${item.title}"`, "info")}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-4 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                      Preview
                    </button>
                    <button
                      onClick={() => reject(item.title)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => approve(item.title)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)] transition-all hover:-translate-y-0.5"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Approve
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
