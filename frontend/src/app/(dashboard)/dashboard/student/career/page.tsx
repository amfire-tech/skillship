/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/career/page.tsx
 * Purpose: AI Career Pilot — chat (left) + discover & build (right).
 *          Discover interest (from quiz, or a 20-Q aptitude quiz) → build a
 *          detailed roadmap (cache-first) → SAVE it. Saved roadmaps live under
 *          the "Saved Roadmaps" tab; the 30-day plan is created from there.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { RoadmapView } from "@/components/career/RoadmapView";
import type { CareerRec, RoadmapDetail, RoadmapFull, CareerProfile, Quota } from "@/components/career/types";

type Tab = "roadmap" | "colleges";
type Lang = "EN" | "HI";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: { title: string; url: string }[];
  ts: number;
}

const QUICK_PROMPTS = [
  "What should I do after Class 10 for engineering?",
  "How do I prepare for JEE?",
  "Best B.Tech specialisations for AI/ML?",
  "Compare IIT vs NIT for Computer Science",
];

export default function CareerPilotPage() {
  const { user, displayName } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("roadmap");
  const [lang, setLang] = useState<Lang>("EN");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = "AI Career Pilot — Skillship"; }, []);

  useEffect(() => {
    setMessages([{
      role: "assistant",
      ts: Date.now(),
      content:
        lang === "HI"
          ? `नमस्ते ${displayName ?? "Student"}! 👋 मैं आपका AI Career Counselor हूँ। दाईं ओर अपना career roadmap बनाएँ और save करें, या मुझसे career/colleges/exams के बारे में पूछें।`
          : `Hi ${displayName ?? "Student"}! 👋 I'm your AI Career Counselor. Build & save a career roadmap on the right, or ask me about careers, colleges, or exams like JEE/CUET.`,
    }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  async function send(question?: string) {
    const q = (question ?? input).trim();
    if (!q || thinking) return;
    setMessages((cur) => [...cur, { role: "user", content: q, ts: Date.now() }]);
    setInput("");
    setThinking(true);
    try {
      const res = await apiFetch(`/ai/career/ask/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, language: lang === "HI" ? "hi" : "en", context: { student_id: user?.id } }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(body?.detail ?? `AI failed (${res.status})`, "error");
        return;
      }
      const data = await res.json();
      const reply: string = data?.answer ?? data?.reply ?? data?.text ?? "I couldn't generate a response — please try rephrasing.";
      setMessages((cur) => [...cur, { role: "assistant", content: reply, citations: data?.citations ?? data?.sources, ts: Date.now() }]);
    } catch {
      toast("Network error", "error");
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(340px,1fr)_minmax(0,1.5fr)]">
      {/* ── Chat ── (second on mobile so the roadmap builder is reached first) */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="order-2 flex h-[60vh] min-h-[380px] flex-col overflow-hidden rounded-2xl border-2 border-primary/30 bg-white shadow-sm lg:order-1 lg:h-[calc(100vh-12rem)] lg:min-h-[520px] dark:bg-[var(--background)]">
        <div className="flex items-center justify-between border-b border-primary/20 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white"><BotIcon /></div>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">AI Career Counselor</p>
              <p className="flex items-center gap-1 text-[11px] text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online</p>
            </div>
          </div>
          <button type="button" onClick={() => setLang(lang === "EN" ? "HI" : "EN")} className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)] hover:border-primary/30 hover:text-primary dark:bg-[var(--background)]">
            {lang === "EN" ? "EN → हिंदी" : "हिंदी → EN"}
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m) => <ChatBubble key={m.ts} role={m.role} content={m.content} citations={m.citations} />)}
          {thinking && <ChatBubble role="assistant" content="" thinking />}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[var(--border)] p-3">
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {QUICK_PROMPTS.map((p) => (
              <button key={p} type="button" onClick={() => send(p)} className="shrink-0 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10">{p}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="relative">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything about your career…" className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--muted)]/40 pl-4 pr-12 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:focus:bg-[var(--background)]" />
            <button type="submit" disabled={!input.trim() || thinking} aria-label="Send" className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-white disabled:opacity-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </form>
        </div>
      </motion.section>

      {/* ── Build & save ── (first on mobile) */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="order-1 flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm lg:order-2 dark:bg-[var(--background)]">
        <nav className="flex border-b border-[var(--border)] px-2 pt-2" role="tablist">
          {([{ k: "roadmap", label: "Build a Roadmap" }, { k: "colleges", label: "College Finder" }] as { k: Tab; label: string }[]).map((t) => (
            <button key={t.k} role="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${tab === t.k ? "border-b-2 border-primary text-primary" : "border-b-2 border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>{t.label}</button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {tab === "roadmap"  && <BuildRoadmap key="rm" studentName={displayName ?? "Student"} />}
            {tab === "colleges" && <CollegeFinderTab key="cl" />}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
}

/* ─────────────────────────── Build a roadmap ─────────────────────────── */

function BuildRoadmap({ studentName }: { studentName: string }) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [roadmapQuota, setRoadmapQuota] = useState<Quota | null>(null);
  const [recs, setRecs] = useState<CareerRec[] | null>(null);
  const [ctx, setCtx] = useState<{ grade?: number | null; board?: string | null; strengths?: string[] } | null>(null);

  const [openRoadmap, setOpenRoadmap] = useState<RoadmapFull | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [genCareer, setGenCareer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([apiFetch(`/career/profile/`), apiFetch(`/career/suggestions/`)]);
      if (pRes.ok) { const p = await pRes.json(); setProfile(p.profile); setRoadmapQuota(p.quota?.roadmaps ?? null); }
      if (sRes.ok) { const s = await sRes.json(); setRecs(s.recommendations ?? []); setCtx(s.context ?? null); }
    } catch { /* per-action */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function generateRoadmap(slug: string) {
    if (busy) return;
    setBusy(true); setGenCareer(slug);
    try {
      const res = await apiFetch(`/career/roadmap/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ career_slug: slug }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast(data?.detail ?? `Couldn't generate roadmap (${res.status})`, "error"); return; }
      setOpenRoadmap({ ...(data.roadmap as RoadmapDetail), roadmap_id: data.roadmap_id, career_slug: data.career_slug, career_title: data.career_title, cached: data.cached });
      setSavedId(null);
      if (data.quota) setRoadmapQuota(data.quota);
      toast(data.cached ? "Loaded an existing roadmap" : "Roadmap generated ✨", "success");
    } catch { toast("Network error", "error"); } finally { setBusy(false); setGenCareer(null); }
  }

  async function saveRoadmap() {
    if (!openRoadmap || busy) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/career/roadmaps/${openRoadmap.roadmap_id}/save/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d?.detail ?? "Couldn't save", "error"); return; }
      setSavedId(openRoadmap.roadmap_id);
      toast("Saved to your Saved Roadmaps 📌", "success");
    } catch { toast("Network error", "error"); } finally { setBusy(false); }
  }

  if (loading) return <div className="space-y-3" role="status">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--muted)]/40" />)}</div>;

  const roadmapExhausted = !!roadmapQuota && roadmapQuota.used >= roadmapQuota.limit;
  const needsClass = !ctx?.grade;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4" role="tabpanel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Build a Career Roadmap</h3>
          {profile?.career_slug && <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">Current objective: <span className="font-semibold text-primary">{profile.career_title}</span></p>}
        </div>
        {roadmapQuota && <span className="text-[11px] text-[var(--muted-foreground)]">Roadmaps: <b className="text-[var(--foreground)]">{roadmapQuota.used}/{roadmapQuota.limit}</b> this month</span>}
      </div>

      {openRoadmap ? (
        <RoadmapView
          roadmap={openRoadmap}
          onBack={() => setOpenRoadmap(null)}
          footer={
            <>
              {savedId === openRoadmap.roadmap_id ? (
                <>
                  <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-100 px-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">📌 Saved</span>
                  <Link href="/dashboard/student/roadmaps" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white">Go to Saved Roadmaps →</Link>
                </>
              ) : (
                <button onClick={saveRoadmap} disabled={busy} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white disabled:opacity-50">
                  {busy ? "Saving…" : "Save roadmap"}
                </button>
              )}
            </>
          }
        />
      ) : (
        <>
          {needsClass && (
            <div className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">Add your class in your profile so we can tailor the roadmap to your grade.</div>
          )}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4">
            <p className="text-sm text-[var(--foreground)]">Hi {studentName} — based on your quiz performance{ctx?.strengths?.length ? <> (strong in <b>{ctx.strengths.slice(0, 2).join(", ")}</b>)</> : null}, here are careers that may suit you.</p>
            <button onClick={() => setShowQuiz(!showQuiz)} className="mt-3 text-xs font-semibold text-primary hover:underline">{showQuiz ? "Hide the aptitude quiz" : "Not sure? Take a 2-minute aptitude quiz →"}</button>
          </div>

          {showQuiz && <InterestQuiz onDone={(r) => { setRecs(r); setShowQuiz(false); }} />}

          {recs === null ? (
            <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--muted)]/40" />)}</div>
          ) : recs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--muted-foreground)]">Take a few quizzes — the AI tailors suggestions from your performance. Or take the aptitude quiz above.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {recs.map((r) => (
                <div key={r.slug} className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-[var(--foreground)]">{r.title}</p>
                    {typeof r.match_pct === "number" && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{r.match_pct}%</span>}
                  </div>
                  {r.reason && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{r.reason}</p>}
                  {r.blurb && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{r.blurb}</p>}
                  <button onClick={() => generateRoadmap(r.slug)} disabled={!!genCareer || roadmapExhausted || needsClass} className="mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    {genCareer === r.slug ? "Building roadmap…" : "Build roadmap"}
                  </button>
                </div>
              ))}
            </div>
          )}
          {roadmapExhausted && <p className="text-center text-xs text-[var(--muted-foreground)]">You've used all your roadmaps for this month.</p>}
        </>
      )}
    </motion.div>
  );
}

function InterestQuiz({ onDone }: { onDone: (recs: CareerRec[]) => void }) {
  const toast = useToast();
  const [questions, setQuestions] = useState<{ id: string; text: string }[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await apiFetch(`/career/interest-quiz/`);
      if (res.ok) { const d = await res.json(); setQuestions(d.questions ?? []); }
    })();
  }, []);

  const allAnswered = !!questions && questions.every((q) => answers[q.id] != null);

  async function submit() {
    if (!allAnswered || busy) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/career/interest-quiz/score/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { toast(d?.detail ?? "Couldn't score quiz", "error"); return; }
      toast("Here are your aptitude-based matches", "success");
      onDone(d.recommendations ?? []);
    } catch { toast("Network error", "error"); } finally { setBusy(false); }
  }

  if (!questions) return <div className="h-40 animate-pulse rounded-xl bg-[var(--muted)]/40" />;

  const LIKERT = [{ v: 1, label: "No" }, { v: 2, label: "Rarely" }, { v: 3, label: "Maybe" }, { v: 4, label: "Often" }, { v: 5, label: "Yes" }];

  return (
    <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p className="text-xs text-[var(--muted-foreground)]">Rate how much each statement sounds like you.</p>
      <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-lg border border-[var(--border)] bg-white p-3 dark:bg-[var(--background)]">
            <p className="text-xs font-medium text-[var(--foreground)]">{i + 1}. {q.text}</p>
            <div className="mt-2 flex gap-1.5">
              {LIKERT.map((opt) => (
                <button key={opt.v} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.v }))} className={`flex-1 rounded-md px-1 py-1 text-[10px] font-semibold transition-colors ${answers[q.id] === opt.v ? "bg-primary text-white" : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"}`}>{opt.label}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={submit} disabled={!allAnswered || busy} className="inline-flex h-9 w-full items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? "Scoring…" : allAnswered ? "See my matches" : `Answer all ${questions.length} questions`}
      </button>
    </div>
  );
}

/* ─────────────────────────── Chat bubble ─────────────────────────── */

function ChatBubble({ role, content, citations, thinking }: { role: "user" | "assistant"; content: string; citations?: { title: string; url: string }[]; thinking?: boolean }) {
  if (role === "assistant") {
    return (
      <div className="flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><BotIcon /></div>
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-[var(--muted)]/60 px-3.5 py-2.5">
          {thinking ? (
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <>
              <p className="whitespace-pre-line text-sm text-[var(--foreground)]">{content}</p>
              {citations && citations.length > 0 && (
                <ul className="mt-2 space-y-0.5 border-t border-[var(--border)] pt-2 text-xs">
                  {citations.slice(0, 3).map((c, i) => (<li key={i}><a href={c.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{c.title}</a></li>))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-br from-primary to-accent px-3.5 py-2.5 text-white">
        <p className="whitespace-pre-line text-sm">{content}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────── College Finder ─────────────────────────── */

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Andaman & Nicobar", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu", "Delhi", "Jammu & Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

const SPECIALIZATIONS = [
  "Computer Science Engineering", "Artificial Intelligence & Machine Learning", "Information Technology",
  "Electronics & Communication", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering",
  "Chemical Engineering", "Aerospace Engineering", "Robotics Engineering", "Biotechnology", "Data Science",
  "Cyber Security", "Bachelor of Business Administration (BBA)", "Commerce (B.Com)", "Economics (B.A.)",
  "Medicine (MBBS)", "Pharmacy (B.Pharm)", "Architecture (B.Arch)", "Design (B.Des)", "Law (BA LLB)",
  "Pure Sciences (B.Sc Physics/Chemistry/Maths)",
];

interface AiCollege { name: string; city: string; state: string; type: string; nirf_rank: number | null; nirf_score: number | null; why_recommended: string; typical_cutoff: string | null; website: string | null }
interface AiCollegeResponse { state: string; city: string; specialization: string; results: AiCollege[]; note: string }

function CollegeFinderTab() {
  const toast = useToast();
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [spec, setSpec] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<AiCollegeResponse | null>(null);

  const canSubmit = state.length > 1 && city.trim().length > 1 && spec.length > 1 && !busy;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true); setData(null);
    try {
      const res = await apiFetch(`/ai/career/college-finder/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state, city: city.trim(), specialization: spec }) });
      if (!res.ok) { const body = await res.json().catch(() => ({})); toast(body?.detail ?? `College finder failed (${res.status})`, "error"); return; }
      const json = (await res.json()) as AiCollegeResponse;
      setData(json);
      if (!json.results?.length) toast("No matches — try a nearby city or broader specialization.", "info");
    } catch { toast("Network error", "error"); } finally { setBusy(false); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4" role="tabpanel">
      <div>
        <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">College Finder</h3>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">AI picks the best colleges based on NIRF rankings for the state, city, and specialization you choose.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4">
        <label className="block">
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">1. State</span>
          <select required value={state} onChange={(e) => setState(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
            <option value="">Select a state…</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">2. City</span>
          <input required type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai, Pune, Bengaluru" className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">3. Specialization</span>
          <select required value={spec} onChange={(e) => setSpec(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
            <option value="">Select a branch / specialization…</option>
            {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button type="submit" disabled={!canSubmit} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Searching…" : "Find Colleges"}</button>
      </form>

      {busy && <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--muted)]/40" />)}</div>}

      {data && data.results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--muted-foreground)]">Showing top {data.results.length} colleges for <span className="font-semibold text-[var(--foreground)]">{data.specialization}</span> in {data.city}, {data.state}.</p>
          <ul className="space-y-2">
            {data.results.map((c, idx) => (
              <li key={`${c.name}-${idx}`} className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3 transition-colors hover:bg-[var(--muted)]/60">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{c.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{[c.city, c.state].filter(Boolean).join(", ")} · {c.type}</p>
                    <p className="mt-2 text-sm text-[var(--foreground)]">{c.why_recommended}</p>
                    {c.typical_cutoff && <p className="mt-1 text-xs text-[var(--muted-foreground)]"><span className="font-semibold">Cutoff:</span> {c.typical_cutoff}</p>}
                    {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-medium text-primary hover:underline">Visit website →</a>}
                  </div>
                  {c.nirf_rank ? <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">NIRF #{c.nirf_rank}</span> : <span className="shrink-0 rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted-foreground)]">Unranked</span>}
                </div>
              </li>
            ))}
          </ul>
          {data.note && <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 p-3 text-xs text-[var(--muted-foreground)]"><span className="font-semibold">Note:</span> {data.note}</p>}
        </div>
      )}

      {!busy && !data && <div className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--muted-foreground)]">Fill out the form above to get NIRF-ranked colleges for your stream.</div>}
    </motion.div>
  );
}

function BotIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><line x1="12" y1="7" x2="12" y2="11" /><circle cx="8" cy="16" r="0.6" fill="currentColor" /><circle cx="12" cy="16" r="0.6" fill="currentColor" /><circle cx="16" cy="16" r="0.6" fill="currentColor" /></svg>;
}
