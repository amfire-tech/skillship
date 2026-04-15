"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";

// Backend team: POST /api/quizzes with this payload:
// { title, subject, grade, duration_minutes, instructions, status: "Draft" }
// Returns: { id, ...quiz }
// Then redirect to /admin/quizzes/:id for question builder

const subjects = ["Mathematics", "Science", "Physics", "Chemistry", "Biology", "History", "Geography", "English", "Computer Science", "Hindi"];
const grades = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const durations = ["10 minutes", "15 minutes", "20 minutes", "30 minutes", "45 minutes", "60 minutes", "90 minutes"];

interface FormValues {
  title: string;
  subject: string;
  grade: string;
  duration: string;
  instructions: string;
}

const initial: FormValues = { title: "", subject: "Mathematics", grade: "Class 9", duration: "30 minutes", instructions: "" };

export default function NewQuizPage() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(initial);
  const [titleError, setTitleError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set(key: keyof FormValues, val: string) {
    setValues((p) => ({ ...p, [key]: val }));
    if (key === "title" && titleError) setTitleError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) {
      setTitleError("Quiz title is required");
      return;
    }
    if (values.title.trim().length < 5) {
      setTitleError("Title must be at least 5 characters");
      return;
    }
    // TODO (backend): replace with POST /api/quizzes → then navigate to question builder
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
          <h2 className="mt-5 text-xl font-bold text-[var(--foreground)]">Quiz Created!</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--foreground)]">{values.title}</span> saved as Draft. Connect the backend to build questions and publish.
          </p>
          <div className="mt-7 flex gap-3">
            <button
              onClick={() => { setSubmitted(false); setValues(initial); }}
              className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
            >
              Create Another
            </button>
            <button
              onClick={() => router.push("/admin/quizzes")}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
            >
              View All Quizzes
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Quiz"
        subtitle="Set up quiz metadata — add questions after backend is connected"
        action={
          <Link
            href="/admin/quizzes"
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
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </div>
              <div>
                <p className="text-base font-bold text-[var(--foreground)]">Quiz Metadata</p>
                <p className="text-xs text-[var(--muted-foreground)]">Questions are added in the question builder after creation</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Title */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Quiz Title</label>
                <input
                  type="text"
                  placeholder="e.g. Quadratic Equations Practice Set"
                  value={values.title}
                  onChange={(e) => set("title", e.target.value)}
                  aria-describedby={titleError ? "quiz-title-err" : undefined}
                  aria-invalid={!!titleError}
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:ring-4 ${
                    titleError
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-[var(--border)] focus:border-primary focus:ring-primary/10"
                  }`}
                />
                {titleError && <p id="quiz-title-err" role="alert" className="text-[11px] font-medium text-red-500">{titleError}</p>}
              </motion.div>

              {/* Subject */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="grid gap-1.5">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Subject</label>
                <select value={values.subject} onChange={(e) => set("subject", e.target.value)} className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
                  {subjects.map((s) => <option key={s}>{s}</option>)}
                </select>
              </motion.div>

              {/* Grade */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="grid gap-1.5">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Grade</label>
                <select value={values.grade} onChange={(e) => set("grade", e.target.value)} className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
                  {grades.map((g) => <option key={g}>{g}</option>)}
                </select>
              </motion.div>

              {/* Duration */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="grid gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Duration</label>
                <div className="flex flex-wrap gap-2">
                  {durations.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set("duration", d)}
                      className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                        values.duration === d
                          ? "border-primary bg-primary text-white"
                          : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-primary/30 hover:text-primary"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Instructions */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="grid gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Instructions <span className="font-normal">(optional)</span></label>
                <textarea
                  rows={3}
                  placeholder="e.g. Each question carries 1 mark. No negative marking."
                  value={values.instructions}
                  onChange={(e) => set("instructions", e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none resize-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </motion.div>
            </div>

            {/* Notice */}
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-600">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
              <p className="text-xs text-amber-700">
                Backend: connect <code className="rounded bg-amber-100 px-1 text-[10px]">POST /api/quizzes</code>. After creation, redirect to question builder at <code className="rounded bg-amber-100 px-1 text-[10px]">/admin/quizzes/:id/questions</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-7 py-4 md:px-9">
            <Link href="/admin/quizzes" className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">
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
                  <path d="M12 5v14" /><path d="M5 12h14" />
                </svg>
              )}
              {isLoading ? "Saving…" : "Create Quiz"}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
