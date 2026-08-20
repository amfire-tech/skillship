/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/quizzes/new/page.tsx
 * Purpose: 4-step quiz creation wizard with AI question generator side panel.
 *          Steps: Basic Info → Add Questions → Settings → Review & Submit.
 *          AI generator calls /ai/quiz/generate/ (Plan-01 AI feature).
 *          Real API only.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE, getToken, apiFetch } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

// ─── Types ──────────────────────────────────────────────────────────────
type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface DraftQuestion {
  text: string;
  subject?: string;
  difficulty?: Difficulty;
  options: string[];
  correct_answer_index: number;
}

interface BasicInfo {
  title: string;
  subject: string;
  difficulty: Difficulty;
  grade: string;
  section: string;
  duration: number;
  instructions: string;
}

interface Settings {
  shuffle_questions: boolean;
  show_correct: boolean;
  passing_score: number;
  attempts_allowed: number;
}

const STEPS = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Add Questions" },
  { id: 3, label: "Settings" },
  { id: 4, label: "Review & Submit" },
];

// Class/Section are domain enums (CBSE/ICSE/State) — fixed by Indian school taxonomy.
const GRADES = Array.from({ length: 12 }).map((_, i) => `Class ${i + 1}`);
const SECTIONS = ["All", "A", "B", "C", "D"];

// ─── Page ───────────────────────────────────────────────────────────────
export default function QuizCreationWizard() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [basic, setBasic] = useState<BasicInfo>({
    title: "", subject: "", difficulty: "MEDIUM", grade: "", section: "All", duration: 30, instructions: "",
  });
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [settings, setSettings] = useState<Settings>({
    shuffle_questions: true, show_correct: false, passing_score: 50, attempts_allowed: 1,
  });

  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  // Real subjects fetched from question bank (unique values).
  const [subjects, setSubjects] = useState<string[] | null>(null);

  useEffect(() => { document.title = "Create Quiz — Skillship"; }, []);

  // Pull questions seeded by Question Bank "Use →" button.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("skillship-quiz-draft-questions");
      if (!raw) return;
      const seeded = JSON.parse(raw) as DraftQuestion[];
      if (Array.isArray(seeded) && seeded.length > 0) {
        setQuestions((cur) => [...cur, ...seeded]);
        sessionStorage.removeItem("skillship-quiz-draft-questions");
        toast(`${seeded.length} question${seeded.length === 1 ? "" : "s"} loaded from Question Bank`, "info");
        setStep(2);
      }
    } catch {
      // ignore malformed draft
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token) { setSubjects([]); return; }
      try {
        const res = await fetch(`${API_BASE}/quizzes/questions/`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { if (!cancelled) setSubjects([]); return; }
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        const uniq = Array.from(new Set(list.map((q: { subject?: string }) => q.subject).filter(Boolean))) as string[];
        if (!cancelled) setSubjects(uniq.sort());
      } catch {
        if (!cancelled) setSubjects([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function basicValid(): string | null {
    if (!basic.title.trim() || basic.title.trim().length < 5) return "Title must be at least 5 characters.";
    if (!basic.subject) return "Pick a subject.";
    if (!basic.grade) return "Pick a class.";
    return null;
  }

  function next() {
    if (step === 1) {
      const err = basicValid();
      if (err) { toast(err, "error"); return; }
    }
    if (step === 2 && questions.length === 0) {
      toast("Add at least one question (manual or via AI generator).", "error");
      return;
    }
    setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s));
  }
  function prev() { setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s)); }

  async function persistQuiz(status: "DRAFT" | "REVIEW" | "PUBLISHED"): Promise<string | null> {
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); return null; }

    try {
      // One atomic call: the backend authoring adapter provisions the course +
      // question bank, creates the questions, builds the quiz, and applies the
      // DRAFT/REVIEW transition. (Publishing is the reviewer's job.)
      const quizRes = await fetch(`${API_BASE}/quizzes/authoring/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: basic.title.trim(),
          subject: basic.subject,
          grade: basic.grade,
          instructions: basic.instructions.trim(),
          difficulty: basic.difficulty,
          duration_minutes: basic.duration,
          passing_score: settings.passing_score,
          attempts_allowed: settings.attempts_allowed,
          shuffle_questions: settings.shuffle_questions,
          status: status === "PUBLISHED" ? "REVIEW" : status,
          questions: questions.map((q) => ({
            text: q.text,
            options: q.options,
            correct_answer_index: q.correct_answer_index,
            difficulty: q.difficulty ?? basic.difficulty,
          })),
        }),
      });
      if (!quizRes.ok) {
        const body = await quizRes.json().catch(() => ({}));
        toast(body?.detail ?? `Failed to create quiz (${quizRes.status})`, "error");
        return null;
      }
      const quiz = await quizRes.json();
      return quiz?.id ?? null;
    } catch {
      toast("Network error", "error");
      return null;
    }
  }

  async function saveDraft() {
    const err = basicValid();
    if (err) { toast(err, "error"); return; }
    setSavingDraft(true);
    const id = await persistQuiz("DRAFT");
    setSavingDraft(false);
    if (id) {
      toast("Draft saved", "success");
      router.push("/dashboard/sub-admin/quizzes");
    }
  }

  async function submit() {
    setSubmitting(true);
    const id = await persistQuiz("REVIEW");
    setSubmitting(false);
    if (id) {
      toast("Quiz submitted for approval", "success");
      router.push("/dashboard/sub-admin/quizzes");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Create New Quiz</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Follow the steps to create and publish a quiz</p>
      </div>

      {/* Stepper */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]">
        <div className="flex items-center gap-3 overflow-x-auto">
          {STEPS.map((s, i) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div key={s.id} className="flex flex-1 items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    active ? "bg-gradient-to-br from-primary to-accent text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)]"
                      : done  ? "bg-primary text-white"
                              : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  }`}>
                    {done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    ) : s.id}
                  </span>
                  <span className={`whitespace-nowrap text-sm ${active || done ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <span className={`h-px flex-1 ${done ? "bg-primary" : "bg-[var(--border)]"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column workspace */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        {/* Left: step content */}
        <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Step1BasicInfo basic={basic} onChange={setBasic} subjects={subjects} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Step2Questions
                  questions={questions}
                  defaultSubject={basic.subject}
                  defaultDifficulty={basic.difficulty}
                  onAdd={(q) => setQuestions((cur) => [...cur, q])}
                  onRemove={(i) => setQuestions((cur) => cur.filter((_, idx) => idx !== i))}
                />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Step3Settings settings={settings} onChange={setSettings} />
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Step4Review basic={basic} questions={questions} settings={settings} onJump={setStep} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-4">
            <button
              type="button"
              onClick={saveDraft}
              disabled={savingDraft || submitting}
              className="rounded-full border border-[var(--border)] bg-white px-5 py-2 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary disabled:opacity-60 dark:bg-[var(--background)]"
            >
              {savingDraft ? "Saving…" : "Save as Draft"}
            </button>
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prev}
                  className="rounded-full border border-[var(--border)] bg-white px-5 py-2 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary dark:bg-[var(--background)]"
                >
                  ← Back
                </button>
              )}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting || questions.length === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit for Approval"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Generator */}
        <AIGeneratorPanel
          defaultSubject={basic.subject}
          defaultDifficulty={basic.difficulty}
          defaultGrade={basic.grade}
          onGenerated={(qs) => setQuestions((cur) => [...cur, ...qs])}
        />
      </div>

      {/* Cancel link */}
      <div>
        <Link href="/dashboard/sub-admin/quizzes" className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary">
          ← Discard and go back
        </Link>
      </div>
    </div>
  );
}

// ─── Step 1: Basic Info ─────────────────────────────────────────────────
function Step1BasicInfo({ basic, onChange, subjects }: { basic: BasicInfo; onChange: (b: BasicInfo) => void; subjects: string[] | null }) {
  const set = <K extends keyof BasicInfo>(k: K, v: BasicInfo[K]) => onChange({ ...basic, [k]: v });
  const [customSubject, setCustomSubject] = useState("");
  return (
    <div className="p-6 md:p-7">
      <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Basic Quiz Information</h2>
      <div className="mt-5 space-y-5">
        <Field label="Quiz Title *">
          <input value={basic.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g., Robotics Sensors MCQ — Class 8" className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject *">
            {subjects === null ? (
              <div className="h-10 animate-pulse rounded-xl bg-[var(--muted)]" />
            ) : subjects.length === 0 ? (
              <input
                value={customSubject || basic.subject}
                onChange={(e) => { setCustomSubject(e.target.value); set("subject", e.target.value); }}
                placeholder="Type subject name (no questions yet)"
                className={inputCls}
              />
            ) : (
              <select value={basic.subject} onChange={(e) => set("subject", e.target.value)} className={inputCls}>
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s}>{s}</option>)}
              </select>
            )}
          </Field>
          <Field label="Difficulty *">
            <select value={basic.difficulty} onChange={(e) => set("difficulty", e.target.value as Difficulty)} className={inputCls}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Class *">
            <select value={basic.grade} onChange={(e) => set("grade", e.target.value)} className={inputCls}>
              <option value="">Class</option>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Section">
            <select value={basic.section} onChange={(e) => set("section", e.target.value)} className={inputCls}>
              {SECTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Time Limit (min)">
            <input type="number" min={5} max={180} value={basic.duration} onChange={(e) => set("duration", Number(e.target.value) || 30)} className={inputCls} />
          </Field>
        </div>
        <Field label="Instructions for Students">
          <textarea rows={3} value={basic.instructions} onChange={(e) => set("instructions", e.target.value)} placeholder="e.g., This quiz has 10 MCQ questions. Each correct answer carries 1 mark. No negative marking." className={inputCls} />
        </Field>
      </div>
    </div>
  );
}

// ─── Bank picker types ───────────────────────────────────────────────────
interface BankOption { id: string; name: string; subject?: string; question_count?: number; }
interface BankQuestion {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  points: number;
  options: { id: string; text: string }[];
  correct_option_ids: string[];
  accepted_answers?: string[];
}

// ─── Step 2: Add Questions ──────────────────────────────────────────────
function Step2Questions({
  questions, defaultSubject, defaultDifficulty, onAdd, onRemove,
}: {
  questions: DraftQuestion[];
  defaultSubject: string;
  defaultDifficulty: Difficulty;
  onAdd: (q: DraftQuestion) => void;
  onRemove: (i: number) => void;
}) {
  const [text, setText] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [bankPickerOpen, setBankPickerOpen] = useState(false);

  function addManual() {
    if (!text.trim()) return;
    const filledOpts = opts.map((o) => o.trim()).filter(Boolean);
    if (filledOpts.length < 2) return;
    onAdd({
      text: text.trim(),
      subject: defaultSubject,
      difficulty: defaultDifficulty,
      options: filledOpts,
      correct_answer_index: Math.min(correct, filledOpts.length - 1),
    });
    setText(""); setOpts(["", "", "", ""]); setCorrect(0);
  }

  return (
    <div className="space-y-5 p-6 md:p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Add Questions</h2>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {questions.length} added
        </span>
      </div>

      {/* Pick from question bank — the primary path when bank has questions */}
      <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Pick from Question Bank</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Browse questions you already uploaded via CSV or the bank page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBankPickerOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-4 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.5)] transition-transform hover:-translate-y-0.5"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
            Browse Bank
          </button>
        </div>
      </div>

      {/* Manual add */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Or add manually (MCQ only)</p>
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter question text…" className={inputCls} />
        <div className="space-y-2">
          {opts.map((o, i) => (
            <label key={i} className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${correct === i ? "border-primary bg-primary/5" : "border-[var(--border)] bg-white dark:bg-[var(--background)]"}`}>
              <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} className="h-4 w-4 accent-[color:var(--primary)]" />
              <input value={o} onChange={(e) => setOpts((cur) => cur.map((c, ix) => ix === i ? e.target.value : c))} placeholder={`Option ${i + 1}`} className="flex-1 bg-transparent outline-none placeholder:text-[var(--muted-foreground)]" />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={addManual}
          disabled={!text.trim() || opts.filter((o) => o.trim()).length < 2}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          + Add Question
        </button>
      </div>

      {/* Added list */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Quiz questions ({questions.length})</p>
        {questions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-10 text-center text-sm text-[var(--muted-foreground)]">
            No questions yet. Browse the bank above, add manually, or use the AI generator on the right.
          </div>
        ) : (
          questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-white p-4 dark:bg-[var(--background)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">{i + 1}. {q.text}</p>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--muted-foreground)]">
                    {q.options.map((o, ix) => (
                      <li key={ix} className={ix === q.correct_answer_index ? "font-semibold text-primary" : ""}>
                        {String.fromCharCode(65 + ix)}. {o} {ix === q.correct_answer_index && "✓"}
                      </li>
                    ))}
                  </ul>
                </div>
                <button type="button" onClick={() => onRemove(i)} aria-label="Remove" className="shrink-0 rounded-full p-1 text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bank Picker Modal */}
      <AnimatePresence>
        {bankPickerOpen && (
          <BankPickerModal
            defaultDifficulty={defaultDifficulty}
            defaultSubject={defaultSubject}
            alreadyAdded={questions.map((q) => q.text)}
            onAdd={(qs) => { qs.forEach(onAdd); }}
            onClose={() => setBankPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Bank Picker Modal ───────────────────────────────────────────────────
function BankPickerModal({
  defaultDifficulty,
  defaultSubject,
  alreadyAdded,
  onAdd,
  onClose,
}: {
  defaultDifficulty: Difficulty;
  defaultSubject: string;
  alreadyAdded: string[];
  onAdd: (qs: DraftQuestion[]) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [banks, setBanks] = useState<BankOption[] | null>(null);
  const [bankId, setBankId] = useState("");
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[] | null>(null);
  const [loadingQ, setLoadingQ] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  // Load all banks for this school
  useEffect(() => {
    (async () => {
      const res = await apiFetch("/quizzes/banks/");
      const list = res.ok ? asArray<BankOption>(await res.json()) : [];
      setBanks(list);
      if (list[0]) setBankId(list[0].id);
    })();
  }, []);

  // Load questions when bank changes
  useEffect(() => {
    if (!bankId) { setBankQuestions([]); return; }
    let cancelled = false;
    setLoadingQ(true);
    setBankQuestions(null);
    setSelected(new Set());
    (async () => {
      const res = await apiFetch(`/quizzes/questions/?bank=${bankId}`);
      if (cancelled) return;
      const list = res.ok ? asArray<BankQuestion>(await res.json()) : [];
      setBankQuestions(list);
      setLoadingQ(false);
    })();
    return () => { cancelled = true; };
  }, [bankId]);

  const filtered = useMemo(() => {
    if (!bankQuestions) return null;
    const q = search.trim().toLowerCase();
    if (!q) return bankQuestions;
    return bankQuestions.filter((bq) => bq.text.toLowerCase().includes(q));
  }, [bankQuestions, search]);

  function toggleAll() {
    if (!filtered) return;
    const ids = filtered.map((q) => q.id);
    if (ids.every((id) => selected.has(id))) {
      setSelected((s) => { const n = new Set(s); ids.forEach((id) => n.delete(id)); return n; });
    } else {
      setSelected((s) => new Set(Array.from(s).concat(ids)));
    }
  }

  function addSelected() {
    if (!bankQuestions || selected.size === 0) return;
    const picked = bankQuestions.filter((q) => selected.has(q.id));
    const converted: DraftQuestion[] = picked.map((q) => {
      // Convert bank's {id,text}[] options back to plain strings for the wizard.
      const opts = (q.options ?? []).map((o) => o.text);
      // Find the index of the correct option.
      const correctId = q.correct_option_ids?.[0] ?? "";
      const correctIdx = (q.options ?? []).findIndex((o) => o.id === correctId);
      return {
        text: q.text,
        subject: defaultSubject,
        difficulty: (q.difficulty as Difficulty) ?? defaultDifficulty,
        options: opts.length >= 2 ? opts : ["True", "False"],
        correct_answer_index: correctIdx >= 0 ? correctIdx : 0,
      };
    });
    onAdd(converted);
    toast(`${converted.length} question${converted.length === 1 ? "" : "s"} added to quiz`, "success");
    onClose();
  }

  const noBanks = banks !== null && banks.length === 0;
  const allFilteredSelected = !!(filtered?.length && filtered.every((q) => selected.has(q.id)));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10 backdrop-blur-sm"
      onClick={onClose}
      role="dialog" aria-modal="true" aria-label="Pick questions from bank"
    >
      <motion.div
        initial={{ scale: 0.96, y: 8, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)] dark:bg-[var(--background)]"
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
        <div className="space-y-4 p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Pick from Question Bank</h3>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Select the questions you want in this quiz. They are copied into the quiz draft.
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Bank selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Question bank</label>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              disabled={banks === null || noBanks}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)] disabled:opacity-60"
            >
              {banks === null && <option>Loading…</option>}
              {noBanks && <option>No question banks yet — upload a CSV first</option>}
              {banks?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}{b.question_count !== undefined ? ` (${b.question_count} questions)` : ""}
                </option>
              ))}
            </select>
            {noBanks && (
              <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">
                Go to{" "}
                <Link href="/dashboard/sub-admin/question-bank" className="font-semibold text-primary hover:underline">
                  Question Bank
                </Link>
                {" "}and upload a CSV to populate a bank first.
              </p>
            )}
          </div>

          {/* Search + select-all */}
          {!noBanks && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions…"
                  className="h-9 w-full rounded-xl border border-[var(--border)] bg-white pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]"
                />
              </div>
              {(filtered?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="h-9 whitespace-nowrap rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary dark:bg-[var(--background)]"
                >
                  {allFilteredSelected ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>
          )}

          {/* Question list */}
          <div className="max-h-72 overflow-y-auto rounded-xl border border-[var(--border)]">
            {loadingQ || filtered === null ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-[var(--muted)]" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
                {bankQuestions?.length === 0
                  ? "This bank has no questions yet — upload a CSV to add some."
                  : "No questions match your search."}
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]/60">
                {filtered.map((q) => {
                  const isSelected = selected.has(q.id);
                  const alreadyIn = alreadyAdded.includes(q.text);
                  return (
                    <li
                      key={q.id}
                      onClick={() => {
                        if (alreadyIn) return;
                        setSelected((s) => {
                          const n = new Set(s);
                          if (n.has(q.id)) n.delete(q.id); else n.add(q.id);
                          return n;
                        });
                      }}
                      className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors ${
                        alreadyIn
                          ? "cursor-not-allowed opacity-40"
                          : isSelected
                          ? "bg-primary/8"
                          : "hover:bg-[var(--muted)]/40"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                        isSelected ? "border-primary bg-primary" : "border-[var(--border)] bg-white dark:bg-[var(--background)]"
                      }`}>
                        {isSelected && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm text-[var(--foreground)]">{q.text}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            q.type === "MCQ" ? "bg-blue-50 text-blue-700" :
                            q.type === "TRUE_FALSE" ? "bg-purple-50 text-purple-700" :
                            "bg-amber-50 text-amber-700"
                          }`}>{q.type}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            q.difficulty === "EASY" ? "bg-emerald-50 text-emerald-700" :
                            q.difficulty === "MEDIUM" ? "bg-amber-50 text-amber-700" :
                            "bg-red-50 text-red-700"
                          }`}>{q.difficulty}</span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">{q.points} pt{q.points !== 1 ? "s" : ""}</span>
                          {alreadyIn && <span className="text-[10px] text-[var(--muted-foreground)]">already in quiz</span>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
            <span className="text-xs text-[var(--muted-foreground)]">
              {selected.size > 0 ? `${selected.size} question${selected.size === 1 ? "" : "s"} selected` : "None selected"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-full border border-[var(--border)] bg-white px-4 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary dark:bg-[var(--background)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addSelected}
                disabled={selected.size === 0}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-xs font-semibold text-white shadow-[0_8px_20px_-8px_rgba(5,150,105,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add {selected.size > 0 ? `${selected.size} ` : ""}to Quiz →
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Step 3: Settings ───────────────────────────────────────────────────
function Step3Settings({ settings, onChange }: { settings: Settings; onChange: (s: Settings) => void }) {
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...settings, [k]: v });
  return (
    <div className="space-y-5 p-6 md:p-7">
      <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Quiz Settings</h2>

      <ToggleRow
        label="Shuffle Questions"
        description="Each student sees questions in a different order"
        checked={settings.shuffle_questions}
        onChange={(v) => set("shuffle_questions", v)}
      />
      <ToggleRow
        label="Show Correct Answers"
        description="After submission, show students the correct answers"
        checked={settings.show_correct}
        onChange={(v) => set("show_correct", v)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Passing Score (%)">
          <input type="number" min={0} max={100} value={settings.passing_score} onChange={(e) => set("passing_score", Math.max(0, Math.min(100, Number(e.target.value) || 0)))} className={inputCls} />
        </Field>
        <Field label="Attempts Allowed">
          <input type="number" min={1} max={10} value={settings.attempts_allowed} onChange={(e) => set("attempts_allowed", Math.max(1, Number(e.target.value) || 1))} className={inputCls} />
        </Field>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-[var(--muted)]"}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

// ─── Step 4: Review ─────────────────────────────────────────────────────
function Step4Review({
  basic, questions, settings, onJump,
}: {
  basic: BasicInfo;
  questions: DraftQuestion[];
  settings: Settings;
  onJump: (s: 1 | 2 | 3 | 4) => void;
}) {
  return (
    <div className="space-y-5 p-6 md:p-7">
      <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Review &amp; Submit</h2>

      <ReviewCard title="Basic Info" onEdit={() => onJump(1)}>
        <ReviewItem k="Title" v={basic.title || "—"} />
        <ReviewItem k="Subject" v={basic.subject || "—"} />
        <ReviewItem k="Class" v={basic.grade ? `${basic.grade}${basic.section !== "All" ? ` · Section ${basic.section}` : ""}` : "—"} />
        <ReviewItem k="Difficulty" v={basic.difficulty} />
        <ReviewItem k="Time Limit" v={`${basic.duration} min`} />
        {basic.instructions && <ReviewItem k="Instructions" v={basic.instructions} />}
      </ReviewCard>

      <ReviewCard title={`Questions (${questions.length})`} onEdit={() => onJump(2)}>
        {questions.length === 0 ? (
          <p className="text-sm text-red-600">No questions yet — add at least one before submitting.</p>
        ) : (
          <ul className="space-y-1.5 text-sm text-[var(--foreground)]">
            {questions.slice(0, 5).map((q, i) => (
              <li key={i} className="line-clamp-1">{i + 1}. {q.text}</li>
            ))}
            {questions.length > 5 && (
              <li className="text-xs text-[var(--muted-foreground)]">…and {questions.length - 5} more</li>
            )}
          </ul>
        )}
      </ReviewCard>

      <ReviewCard title="Settings" onEdit={() => onJump(3)}>
        <ReviewItem k="Shuffle Questions" v={settings.shuffle_questions ? "Yes" : "No"} />
        <ReviewItem k="Show Correct Answers" v={settings.show_correct ? "Yes" : "No"} />
        <ReviewItem k="Passing Score" v={`${settings.passing_score}%`} />
        <ReviewItem k="Attempts Allowed" v={String(settings.attempts_allowed)} />
      </ReviewCard>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        Submitting sends the quiz to the admin approval queue. You can edit it while it&apos;s still in <strong>DRAFT</strong> or <strong>REVIEW</strong> status.
      </div>
    </div>
  );
}

function ReviewCard({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
        <button type="button" onClick={onEdit} className="text-xs font-semibold text-primary hover:underline">Edit</button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewItem({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-[var(--muted-foreground)]">{k}</span>
      <span className="text-right font-medium text-[var(--foreground)]">{v}</span>
    </div>
  );
}

// ─── AI Generator Panel ─────────────────────────────────────────────────
function AIGeneratorPanel({
  defaultSubject, defaultDifficulty, defaultGrade, onGenerated,
}: {
  defaultSubject: string;
  defaultDifficulty: Difficulty;
  defaultGrade: string;
  onGenerated: (qs: DraftQuestion[]) => void;
}) {
  const toast = useToast();
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState(defaultGrade);
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty);
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setGrade(defaultGrade); }, [defaultGrade]);
  useEffect(() => { setDifficulty(defaultDifficulty); }, [defaultDifficulty]);

  const canGenerate = useMemo(() => topic.trim().length > 1 && count >= 1 && count <= 30 && !loading, [topic, count, loading]);

  const generate = useCallback(async () => {
    if (!canGenerate) return;
    setLoading(true);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/ai/quiz/generate/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          subject: defaultSubject || topic.trim(),
          grade: grade || undefined,
          difficulty: difficulty.toLowerCase(),
          count,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(body?.detail ?? `Generation failed (${res.status})`, "error");
        return;
      }
      const data = await res.json();
      // The AI service returns options as [{id,text}] and the answer as
      // correct_option_ids (e.g. ["C"]). The wizard works with plain string
      // options + a correct_answer_index, so normalise both here.
      const items: DraftQuestion[] = (data?.questions ?? data ?? [])
        .map((q: any) => {
          const rawOpts: unknown[] = q.options ?? q.choices ?? [];
          const options: string[] = rawOpts.map((o) =>
            typeof o === "string" ? o : ((o as { text?: string })?.text ?? ""),
          );
          let correct_answer_index =
            q.correct_answer_index ?? q.correct_index ?? q.answer_index ?? q.correct ?? 0;
          const correctIds = q.correct_option_ids ?? q.correct_ids;
          if (Array.isArray(correctIds) && correctIds.length && rawOpts.length && typeof rawOpts[0] === "object") {
            const idx = (rawOpts as { id?: string }[]).findIndex((o) => o?.id === correctIds[0]);
            if (idx >= 0) correct_answer_index = idx;
          }
          return {
            text: q.text ?? q.question_text ?? q.question ?? "",
            subject: defaultSubject,
            difficulty,
            options,
            correct_answer_index,
          };
        })
        .filter((q: DraftQuestion) => q.text && q.options.length >= 2);

      if (items.length === 0) {
        toast("Generator returned no usable questions.", "error");
        return;
      }
      onGenerated(items);
      toast(`Generated ${items.length} question${items.length === 1 ? "" : "s"}`, "success");
    } catch {
      toast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, [canGenerate, topic, defaultSubject, grade, difficulty, count, onGenerated, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
      className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-white to-accent/5 shadow-sm dark:from-primary/10 dark:via-[var(--background)] dark:to-accent/10"
    >
      <div className="flex items-center justify-between border-b border-primary/20 px-5 py-4">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">✨</span>
          <h3 className="text-base font-bold tracking-tight text-primary">AI Question Generator</h3>
        </div>
        <span className="rounded-full border border-primary/30 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:bg-[var(--background)]">
          AI Powered
        </span>
      </div>

      <div className="space-y-4 p-5">
        <p className="text-xs text-[var(--muted-foreground)]">Enter details to generate quiz questions automatically.</p>

        <Field label="Topic / Subject">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Infrared Sensors, Python Loops" className={inputCls} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Class">
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls}>
              <option value="">Class</option>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Difficulty">
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className={inputCls}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </Field>
          <Field label="Count">
            <input type="number" min={1} max={30} value={count} onChange={(e) => setCount(Math.max(1, Math.min(30, Number(e.target.value) || 10)))} className={inputCls} />
          </Field>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={!canGenerate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              Generating…
            </>
          ) : (
            <>✨ Generate Questions</>
          )}
        </button>

        <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          Generated via Skillship AI service · Gemini 1.5 Flash. Review every output before submitting.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────
const inputCls = "w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</label>
      {children}
    </div>
  );
}
