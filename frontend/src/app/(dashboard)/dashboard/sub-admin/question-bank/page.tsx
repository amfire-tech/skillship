/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/question-bank/page.tsx
 * Purpose: Question Bank — subject sidebar, difficulty pills, search, table.
 *          Real API. Add Question + Bulk Upload CSV both wired.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE, apiFetch, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type DifficultyFilter = "ALL" | Difficulty;

interface Question {
  id: string;
  text?: string;
  question_text?: string;
  subject?: string;
  difficulty?: Difficulty | string;
  grade?: string;
  grade_level?: string;
  class_level?: string;
  created_by_name?: string;
  created_by?: string;
  options?: string[];
  choices?: string[];
  correct_answer_index?: number;
  correct_index?: number;
}

const QUIZ_DRAFT_KEY = "skillship-quiz-draft-questions";

const SUBJECT_ICON: Record<string, string> = {
  Robotics: "🤖",
  AI: "🧠",
  "Artificial Intelligence": "🧠",
  Coding: "💻",
  "Coding & Programming": "💻",
  Programming: "💻",
  Electronics: "⚡",
  Sensors: "📡",
  "Sensors & IoT": "📡",
  IoT: "📡",
  Mathematics: "➗",
  Math: "➗",
  Science: "🔬",
  Physics: "🔭",
  Chemistry: "⚗️",
  Biology: "🧬",
  English: "📖",
  Hindi: "📖",
  History: "🏛️",
  Geography: "🌍",
};

const difficultyPill: Record<string, string> = {
  EASY:   "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  MEDIUM: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  HARD:   "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
};

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>;
}
function UploadIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>;
}
function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
}

export default function QuestionBankPage() {
  const toast = useToast();
  const router = useRouter();
  function addToWizard(q: Question) {
    const opts = q.options ?? q.choices ?? [];
    if (opts.length < 2) {
      toast("This question has no options stored — open it in the bank first.", "error");
      return;
    }
    const draft = {
      text: q.text ?? q.question_text ?? "",
      subject: q.subject,
      difficulty: (q.difficulty ?? "MEDIUM").toString().toUpperCase() as Difficulty,
      options: opts,
      correct_answer_index: q.correct_answer_index ?? q.correct_index ?? 0,
    };
    try {
      const existing = JSON.parse(sessionStorage.getItem(QUIZ_DRAFT_KEY) ?? "[]");
      sessionStorage.setItem(QUIZ_DRAFT_KEY, JSON.stringify([...existing, draft]));
    } catch {
      sessionStorage.setItem(QUIZ_DRAFT_KEY, JSON.stringify([draft]));
    }
    toast("Question added to quiz draft", "success");
    router.push("/dashboard/sub-admin/quizzes/new");
  }

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string>("ALL");
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyFilter>("ALL");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [createBankOpen, setCreateBankOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setQuestions([]); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/questions/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        if (res.status === 404) { setQuestions([]); return; }
        throw new Error(`Failed to load questions (${res.status})`);
      }
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions.");
      setQuestions([]);
    }
  }, []);

  useEffect(() => { document.title = "Question Bank — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const subjects = useMemo(() => {
    if (!questions) return [];
    const counts = new Map<string, number>();
    questions.forEach((q) => {
      const s = q.subject ?? "Uncategorised";
      counts.set(s, (counts.get(s) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [questions]);

  const filtered = useMemo(() => {
    if (!questions) return null;
    const q = search.trim().toLowerCase();
    return questions.filter((qq) => {
      const text = (qq.text ?? qq.question_text ?? "").toLowerCase();
      const author = (qq.created_by_name ?? "").toLowerCase();
      const matchSearch = !q || text.includes(q) || author.includes(q);
      const matchSubj = activeSubject === "ALL" || qq.subject === activeSubject;
      const matchDiff = activeDifficulty === "ALL" || (qq.difficulty ?? "").toString().toUpperCase() === activeDifficulty;
      return matchSearch && matchSubj && matchDiff;
    });
  }, [questions, search, activeSubject, activeDifficulty]);

  // Bank-scoped CSV upload — backend endpoint is /quizzes/banks/{id}/import-csv/.
  async function uploadCsvToBank(bankId: string, file: File): Promise<{ created: number; errors: { row: number; message: string }[]; total_rows: number } | null> {
    setUploading(true);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setUploading(false); return null; }
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/quizzes/banks/${bankId}/import-csv/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        toast(errBody?.detail ?? `Upload failed (${res.status})`, "error");
        return null;
      }
      const data = await res.json();
      const errs = (data?.errors ?? []) as { row: number; message: string }[];
      // A row-0 error with zero parsed rows means the WHOLE file was rejected
      // (wrong/missing columns, empty, not a question CSV at all) — surface it
      // as an error, not a "row skipped". Only when some rows actually parsed do
      // we report a partial per-row outcome.
      const fileLevel = (data?.total_rows ?? 0) === 0 && errs.length > 0;
      if (fileLevel) {
        toast(errs[0]?.message ?? "That file couldn't be read as a question CSV.", "error");
      } else {
        if (data?.created > 0) toast(`Imported ${data.created} question${data.created === 1 ? "" : "s"}.`, "success");
        if (errs.length > 0) toast(`${errs.length} row${errs.length === 1 ? "" : "s"} skipped — see details.`, "info");
      }
      await load();
      return data;
    } catch {
      toast("Network error during upload", "error");
      return null;
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Question Bank</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {questions === null
              ? "Loading…"
              : `${questions.length} question${questions.length === 1 ? "" : "s"} across all subjects`}
          </p>
        </div>
        <div className="w-full overflow-x-auto sm:w-auto">
          <div className="flex min-w-max items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateBankOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-primary/40 hover:text-primary dark:bg-[var(--background)]"
            >
              <PlusIcon />
              New Bank
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => setCsvModalOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60 dark:bg-[var(--background)]"
            >
              <UploadIcon />
              {uploading ? "Uploading…" : "Bulk Upload CSV"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
            >
              <PlusIcon />
              Add Question
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Two-pane: subjects sidebar + table */}
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Subjects */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm dark:bg-[var(--background)]">
          <p className="mb-3 px-2 text-sm font-semibold text-[var(--foreground)]">Subjects</p>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => setActiveSubject("ALL")}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  activeSubject === "ALL"
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)]"
                    : "text-[var(--foreground)] hover:bg-primary/5 hover:text-primary"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">🎓</span>
                  <span className="font-medium">All Subjects</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${activeSubject === "ALL" ? "bg-white/25 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                  {questions?.length ?? "—"}
                </span>
              </button>
            </li>
            {subjects.length === 0 && questions !== null ? (
              <li className="px-3 py-3 text-xs text-[var(--muted-foreground)]">No subjects yet — add a question to begin.</li>
            ) : (
              subjects.map(([name, count]) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => setActiveSubject(name)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      activeSubject === name
                        ? "bg-primary/10 text-primary"
                        : "text-[var(--foreground)] hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span aria-hidden="true">{SUBJECT_ICON[name] ?? "📘"}</span>
                      <span className="truncate font-medium">{name}</span>
                    </span>
                    <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs font-semibold text-[var(--muted-foreground)]">
                      {count}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Right pane */}
        <div className="min-w-0 space-y-4">
          {/* Difficulty pills + search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex gap-1 rounded-full border border-[var(--border)] bg-white p-1 dark:bg-[var(--background)]">
              {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((d) => {
                const active = activeDifficulty === d;
                const label = d === "ALL" ? "All" : d.charAt(0) + d.slice(1).toLowerCase();
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setActiveDifficulty(d)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-gradient-to-r from-primary to-accent text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="relative w-full flex-1 sm:min-w-[240px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"><SearchIcon /></span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions or authors…"
                className="h-10 w-full rounded-full border border-[var(--border)] bg-white pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                    <th className="px-5 py-3">Question</th>
                    <th className="px-5 py-3">Subject</th>
                    <th className="px-5 py-3">Difficulty</th>
                    <th className="px-5 py-3">Class</th>
                    <th className="px-5 py-3">Created By</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered === null ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`s-${i}`} className="border-b border-[var(--border)]/60">
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-5 py-3.5">
                            <div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-14 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">No questions found</p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {questions?.length === 0 ? "Add the first question or upload a CSV to begin." : "Try changing the filters."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((q) => (
                      <tr key={q.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                        <td className="px-5 py-3.5 font-medium text-[var(--foreground)]">
                          <p className="line-clamp-2 max-w-[420px]">{q.text ?? q.question_text ?? "—"}</p>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{q.subject ?? "—"}</td>
                        <td className="px-5 py-3.5">
                          {q.difficulty ? (
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${difficultyPill[String(q.difficulty).toUpperCase()] ?? "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                              {String(q.difficulty).charAt(0) + String(q.difficulty).slice(1).toLowerCase()}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{q.grade ?? q.grade_level ?? q.class_level ?? "—"}</td>
                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{q.created_by_name ?? q.created_by ?? "—"}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => addToWizard(q)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Use →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Question Modal */}
      <AnimatePresence>
        {showAdd && (
          <AddQuestionModal
            onClose={() => setShowAdd(false)}
            onCreated={async () => { setShowAdd(false); await load(); toast("Question added", "success"); }}
            knownSubjects={subjects.map(([n]) => n)}
          />
        )}
      </AnimatePresence>

      {/* Bulk-upload CSV modal — bank picker + file picker + result detail */}
      <AnimatePresence>
        {csvModalOpen && (
          <BulkUploadCsvModal
            onClose={() => setCsvModalOpen(false)}
            onUpload={uploadCsvToBank}
            uploading={uploading}
          />
        )}
      </AnimatePresence>

      {/* Create Bank modal */}
      <AnimatePresence>
        {createBankOpen && (
          <CreateBankModal
            onClose={() => setCreateBankOpen(false)}
            onCreated={async () => { setCreateBankOpen(false); toast("Bank created", "success"); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


// ─── Create Bank modal ───────────────────────────────────────────────────────

function CreateBankModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await apiFetch("/academics/courses/");
      const data = res.ok ? await res.json() : { results: [] };
      const list: CourseSummary[] = Array.isArray(data) ? data : (data?.results ?? []);
      setCourses(list);
      if (list[0]) setCourseId(list[0].id);
    })();
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && !saving) onClose(); }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose, saving]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Bank name is required."); return; }
    if (!courseId) { setError("Pick a course."); return; }
    setSaving(true);
    const token = await getToken();
    if (!token) { setError("Session expired."); setSaving(false); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/banks/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), course: courseId, description: description.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body?.name?.[0] ?? body?.detail ?? `Failed (${res.status})`;
        setError(detail);
        return;
      }
      onCreated();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  const noCourses = courses !== null && courses.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10 backdrop-blur-sm"
      onClick={() => { if (!saving) onClose(); }}
      role="dialog" aria-modal="true" aria-label="Create question bank"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)] dark:bg-[var(--background)]"
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Create Question Bank</h3>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              A bank groups questions for one course. You can upload CSV questions into it afterwards.
            </p>
          </div>

          <Field label="Bank name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Robotics — Grade 9"
              className={inputCls}
              autoFocus
            />
          </Field>

          <Field label="Course">
            {courses === null ? (
              <div className={`${inputCls} animate-pulse text-[var(--muted-foreground)]`}>Loading…</div>
            ) : noCourses ? (
              <p className="text-xs text-[var(--muted-foreground)]">No courses found. Create a course first in the academics section.</p>
            ) : (
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this bank covers…"
              className={inputCls}
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-9 rounded-full border border-[var(--border)] bg-white px-4 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary dark:bg-[var(--background)] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || noCourses || courses === null}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-xs font-semibold text-white shadow-[0_8px_20px_-8px_rgba(5,150,105,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create Bank"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}


// ─── Bulk CSV upload modal ───────────────────────────────────────────────────

interface BankSummary { id: string; name: string; subject?: string; }
interface CourseSummary { id: string; name: string; code: string; }

/** Strip the trailing " — xxxxxx" suffix (6 hex chars) added by services.py to keep bank names unique. */
function displayBankName(name: string): string {
  return name.replace(/ — [0-9a-f]{6}$/i, "").trim();
}
type UploadResult = { created: number; errors: { row: number; message: string }[]; total_rows: number } | null;

// A ready-to-edit sample. Download it, keep the header row exactly as-is,
// replace the example rows with your own questions, then upload. The leading
// ﻿ is a UTF-8 BOM so Excel opens it cleanly; the backend strips it.
const CSV_HEADER =
  "text,type,difficulty,points,option_a,option_b,option_c,option_d,correct,accepted_answers,tags,explanation";
const CSV_SAMPLE_ROWS = [
  `"What is 2 + 2?",MCQ,EASY,1,3,4,5,6,B,,math|arithmetic,"4 is the sum of 2 and 2."`,
  `"Which planet is known as the Red Planet?",MCQ,MEDIUM,1,Venus,Mars,Jupiter,Saturn,B,,space,"Mars looks red because of iron oxide."`,
  `"Select the prime numbers below.",MCQ,HARD,2,2,4,7,9,"A,C",,math,"2 and 7 are prime (multi-answer)."`,
  `"The Earth is flat.",TRUE_FALSE,EASY,1,,,,,False,,geography,"The Earth is an oblate spheroid."`,
  `"Water boils at 100 degrees Celsius at sea level.",TRUE_FALSE,EASY,1,,,,,True,,science,`,
  `"What is the capital of India?",SHORT_ANSWER,MEDIUM,2,,,,,,delhi|new delhi,geography,"Either spelling is accepted."`,
];
const CSV_TEMPLATE = "﻿" + [CSV_HEADER, ...CSV_SAMPLE_ROWS].join("\r\n") + "\r\n";

// Human-friendly view of the sample (the download has the full CSV).
const EXAMPLE_PREVIEW: { text: string; type: string; difficulty: string; points: string; answer: string }[] = [
  { text: "What is 2 + 2?", type: "MCQ", difficulty: "EASY", points: "1", answer: "option_a=3, option_b=4, option_c=5, option_d=6 · correct=B" },
  { text: "Select the prime numbers.", type: "MCQ", difficulty: "HARD", points: "2", answer: "options A–D · correct=A,C (multi-answer)" },
  { text: "The Earth is flat.", type: "TRUE_FALSE", difficulty: "EASY", points: "1", answer: "correct=False" },
  { text: "Capital of India?", type: "SHORT_ANSWER", difficulty: "MEDIUM", points: "2", answer: "accepted_answers=delhi|new delhi" },
];

function downloadCsvTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "skillship-questions-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function DownloadIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>;
}

function BulkUploadCsvModal({
  onClose,
  onUpload,
  uploading,
}: {
  onClose: () => void;
  onUpload: (bankId: string, file: File) => Promise<UploadResult>;
  uploading: boolean;
}) {
  const [banks, setBanks] = useState<BankSummary[] | null>(null);
  const [bankId, setBankId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(false);

  const noBanks = banks !== null && banks.length === 0;
  // The whole file was rejected (wrong/missing columns, empty) — nothing parsed.
  const fileLevelError = result !== null && result.total_rows === 0 && result.errors.length > 0;

  useEffect(() => {
    (async () => {
      const res = await apiFetch(`/quizzes/banks/`);
      const list = res.ok ? asArray<BankSummary>(await res.json()) : [];
      setBanks(list);
      if (list[0]) setBankId(list[0].id);
    })();
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && !uploading) onClose(); }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose, uploading]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!bankId) { setError("Pick a bank to import into."); return; }
    if (!file) { setError("Choose a CSV file."); return; }
    const r = await onUpload(bankId, file);
    if (r !== null) setResult(r);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10 backdrop-blur-sm"
      onClick={() => { if (!uploading) onClose(); }}
      role="dialog" aria-modal="true" aria-label="Bulk upload CSV"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)] dark:bg-[var(--background)]"
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Bulk upload questions</h3>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Upload a UTF-8 CSV. New to the format? Download the template — it already
              has working example rows for every question type. Just replace them with your own.
            </p>
          </div>

          {/* Template + example — the fastest way to get a correct CSV */}
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--foreground)]">Need a starting point?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-3.5 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)] transition-transform hover:-translate-y-0.5"
                >
                  <DownloadIcon />
                  Download template
                </button>
                <button
                  type="button"
                  onClick={() => setShowExample((s) => !s)}
                  className="h-8 rounded-full border border-[var(--border)] bg-white px-3 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary dark:bg-[var(--background)]"
                >
                  {showExample ? "Hide example" : "See example"}
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showExample && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--border)] bg-white dark:bg-[var(--background)]">
                    <table className="w-full min-w-[460px] text-[11px]">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                          <th className="px-2.5 py-1.5 font-semibold">text</th>
                          <th className="px-2.5 py-1.5 font-semibold">type</th>
                          <th className="px-2.5 py-1.5 font-semibold">difficulty</th>
                          <th className="px-2.5 py-1.5 font-semibold">points</th>
                          <th className="px-2.5 py-1.5 font-semibold">answer columns</th>
                        </tr>
                      </thead>
                      <tbody>
                        {EXAMPLE_PREVIEW.map((r) => (
                          <tr key={r.text} className="border-b border-[var(--border)]/60 last:border-0">
                            <td className="px-2.5 py-1.5 text-[var(--foreground)]">{r.text}</td>
                            <td className="px-2.5 py-1.5 font-mono text-primary">{r.type}</td>
                            <td className="px-2.5 py-1.5">{r.difficulty}</td>
                            <td className="px-2.5 py-1.5">{r.points}</td>
                            <td className="px-2.5 py-1.5 text-[var(--muted-foreground)]">{r.answer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="mt-2 space-y-0.5 text-[11px] text-[var(--muted-foreground)]">
                    <li><strong>Required columns:</strong> <code>text, type, difficulty, points</code> (keep the header row).</li>
                    <li><strong>MCQ:</strong> fill <code>option_a…option_d</code> and set <code>correct</code> to the letter(s), e.g. <code>B</code> or <code>A,C</code>.</li>
                    <li><strong>TRUE_FALSE:</strong> set <code>correct</code> to <code>True</code> or <code>False</code>.</li>
                    <li><strong>SHORT_ANSWER:</strong> set <code>accepted_answers</code> to pipe-separated values, e.g. <code>delhi|new delhi</code>.</li>
                    <li><strong>Optional:</strong> <code>tags</code> (pipe-separated) and <code>explanation</code>.</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Target bank</span>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              disabled={banks === null || noBanks || uploading}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)] disabled:opacity-60"
            >
              {banks === null && <option>Loading…</option>}
              {noBanks && <option>No question banks yet</option>}
              {banks?.map((b) => <option key={b.id} value={b.id}>{displayBankName(b.name)}{b.subject ? ` · ${b.subject}` : ""}</option>)}
            </select>
            {noBanks && (
              <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">
                Question banks are created with the{" "}
                <Link href="/dashboard/sub-admin/quizzes/new" className="font-semibold text-primary hover:underline">
                  Quiz Builder
                </Link>
                . Create a quiz once and its bank will appear here.
              </p>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">CSV file</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
              disabled={uploading || noBanks}
              className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/15 disabled:opacity-60 dark:bg-[var(--background)]"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          {/* File-level rejection — the file isn't a question CSV at all */}
          {fileLevelError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs dark:border-red-500/30 dark:bg-red-500/10">
              <p className="font-semibold text-red-700 dark:text-red-300">This file isn&apos;t a valid question CSV.</p>
              <p className="mt-1 text-red-600 dark:text-red-300/90">{result?.errors[0]?.message}</p>
              <p className="mt-1.5 text-red-600/90 dark:text-red-300/80">
                Download the template above, copy your questions into it, and upload that file.
              </p>
            </div>
          )}

          {/* Row-level outcome — at least one row parsed */}
          {result && !fileLevelError && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-xs space-y-1">
              <p className="font-semibold text-[var(--foreground)]">
                Imported {result.created} of {result.total_rows} row{result.total_rows === 1 ? "" : "s"}.
              </p>
              {result.errors.length > 0 && (
                <details className="text-[var(--muted-foreground)]" open>
                  <summary className="cursor-pointer font-semibold text-red-600">
                    {result.errors.length} row{result.errors.length === 1 ? "" : "s"} skipped — show details
                  </summary>
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pl-3">
                    {result.errors.slice(0, 30).map((e) => (
                      <li key={`${e.row}-${e.message}`} className="text-[11px]">
                        <span className="font-mono text-[var(--foreground)]">row {e.row}</span> · {e.message}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="h-9 rounded-full border border-[var(--border)] bg-white px-4 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary dark:bg-[var(--background)] disabled:opacity-60"
            >
              {result && !fileLevelError ? "Done" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={uploading || !file || !bankId || noBanks}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-xs font-semibold text-white shadow-[0_8px_20px_-8px_rgba(5,150,105,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Add Question Modal ─────────────────────────────────────────────────
function AddQuestionModal({
  onClose,
  onCreated,
  knownSubjects,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
  knownSubjects: string[];
}) {
  const [text, setText] = useState("");
  const [subject, setSubject] = useState(knownSubjects[0] ?? "");
  const [customSubject, setCustomSubject] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [grade, setGrade] = useState("Class 9");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!text.trim()) { setError("Question text required."); return; }
    const finalSubject = (customSubject.trim() || subject).trim();
    if (!finalSubject) { setError("Subject required."); return; }
    if (options.filter((o) => o.trim()).length < 2) { setError("Provide at least 2 options."); return; }

    setSaving(true);
    const token = await getToken();
    if (!token) { setError("Session expired."); setSaving(false); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/questions/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          subject: finalSubject,
          difficulty,
          grade,
          options: options.map((o) => o.trim()).filter(Boolean),
          correct_answer_index: correct,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.detail ?? `Failed to create (${res.status}).`);
        return;
      }
      await onCreated();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10 backdrop-blur-sm"
      onClick={onClose}
      role="dialog" aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.96, y: 8, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)]"
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
        <form onSubmit={submit} className="space-y-4 p-6">
          <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Add Question</h3>

          <Field label="Question text">
            <textarea required value={text} onChange={(e) => setText(e.target.value)} rows={3} className={inputCls} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subject">
              {knownSubjects.length > 0 ? (
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls}>
                  {knownSubjects.map((s) => <option key={s}>{s}</option>)}
                  <option value="">+ New subject…</option>
                </select>
              ) : (
                <input value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="e.g. Robotics" className={inputCls} />
              )}
              {(subject === "" && knownSubjects.length > 0) && (
                <input value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="Type new subject name" className={`${inputCls} mt-2`} />
              )}
            </Field>
            <Field label="Difficulty">
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className={inputCls}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </Field>
          </div>

          <Field label="Grade / Class">
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls}>
              {Array.from({ length: 12 }).map((_, i) => <option key={i}>{`Class ${i + 1}`}</option>)}
            </select>
          </Field>

          <Field label="Options (select correct)">
            <div className="space-y-2">
              {options.map((opt, i) => (
                <label key={i} className={`flex items-center gap-3 rounded-xl border p-2.5 transition-colors ${correct === i ? "border-primary bg-primary/5" : "border-[var(--border)]"}`}>
                  <input
                    type="radio"
                    name="correct"
                    checked={correct === i}
                    onChange={() => setCorrect(i)}
                    className="h-4 w-4 accent-[color:var(--primary)]"
                  />
                  <input
                    value={opt}
                    onChange={(e) => setOptions((cur) => cur.map((c, ix) => ix === i ? e.target.value : c))}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
                  />
                </label>
              ))}
            </div>
          </Field>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <button type="button" onClick={onClose} className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 disabled:opacity-60">
              {saving ? "Saving…" : "Add Question"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

const inputCls = "w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</label>
      {children}
    </div>
  );
}
