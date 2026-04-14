"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";

interface QuizCard {
  title: string;
  subject: string;
  grade: string;
  questions: number;
  attempts: string;
  avgScore: string;
  status: "Published" | "Draft" | "Review";
  updated: string;
}

const quizzes: QuizCard[] = [
  { title: "Photosynthesis — Light Reactions", subject: "Biology", grade: "Class 10", questions: 20, attempts: "1,840", avgScore: "78%", status: "Published", updated: "2h ago" },
  { title: "Quadratic Equations Practice", subject: "Mathematics", grade: "Class 9", questions: 25, attempts: "2,210", avgScore: "64%", status: "Published", updated: "Yesterday" },
  { title: "Indian Freedom Struggle", subject: "History", grade: "Class 8", questions: 15, attempts: "960", avgScore: "81%", status: "Published", updated: "3d ago" },
  { title: "Newton's Laws — Conceptual", subject: "Physics", grade: "Class 11", questions: 18, attempts: "—", avgScore: "—", status: "Review", updated: "1h ago" },
  { title: "Carbon and its Compounds", subject: "Chemistry", grade: "Class 10", questions: 22, attempts: "—", avgScore: "—", status: "Draft", updated: "4h ago" },
  { title: "Reading Comprehension Set 4", subject: "English", grade: "Class 7", questions: 10, attempts: "1,120", avgScore: "72%", status: "Published", updated: "1w ago" },
];

const statusColor: Record<QuizCard["status"], string> = {
  Published: "bg-primary/10 text-primary border-primary/20",
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Review: "bg-amber-50 text-amber-700 border-amber-200",
};

const subjectTint: Record<string, string> = {
  Biology: "from-teal-500 to-primary",
  Mathematics: "from-primary to-accent",
  History: "from-amber-500 to-orange-400",
  Physics: "from-violet-500 to-fuchsia-400",
  Chemistry: "from-rose-500 to-red-400",
  English: "from-sky-500 to-cyan-400",
};

export default function GlobalQuizPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Quiz Management"
        subtitle="All quizzes across subjects, grades and schools"
        action={
          <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            New Quiz
          </button>
        }
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 md:flex-row md:items-center"
      >
        <div className="relative flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input type="search" placeholder="Search quizzes by title or subject…" className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 pl-9 pr-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10" />
        </div>
        <select className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
          <option>All Subjects</option><option>Mathematics</option><option>Biology</option><option>History</option>
        </select>
        <select className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
          <option>All Grades</option><option>Class 6</option><option>Class 9</option><option>Class 10</option>
        </select>
        <select className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
          <option>All Status</option><option>Published</option><option>Review</option><option>Draft</option>
        </select>
      </motion.div>

      {/* Quiz grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quizzes.map((q, i) => (
          <motion.div
            key={q.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
            className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_20px_40px_-20px_rgba(5,150,105,0.25)]"
          >
            {/* Subject stripe */}
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${subjectTint[q.subject] ?? "from-primary to-accent"}`} />

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{q.subject}</p>
                <h3 className="mt-1 text-base font-bold leading-snug text-[var(--foreground)]">{q.title}</h3>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{q.grade} · {q.questions} questions</p>
              </div>
              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusColor[q.status]}`}>
                {q.status}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Attempts</p>
                <p className="mt-0.5 text-sm font-bold text-[var(--foreground)]">{q.attempts}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Avg score</p>
                <p className="mt-0.5 text-sm font-bold text-primary">{q.avgScore}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">Updated {q.updated}</span>
              <div className="flex items-center gap-3">
                <button className="font-semibold text-primary transition-colors hover:text-primary-700">Open</button>
                <button className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">Edit</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
