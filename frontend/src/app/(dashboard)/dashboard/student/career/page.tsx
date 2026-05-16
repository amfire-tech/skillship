/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/career/page.tsx
 * Purpose: AI Career Pilot — chat (left) + tabbed roadmap/college/quiz/careers (right).
 *          Concepts adapted from ai_career_pilot repo, written native to Skillship style.
 *          Real APIs: /career/ask, /career/roadmap/, /career/colleges/, /career/recommendations/.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

type Tab = "roadmap" | "colleges" | "quiz" | "careers";
type Lang = "EN" | "HI";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: { title: string; url: string }[];
  ts: number;
}

interface RoadmapStage {
  id: string;
  stage: string;
  badge?: string;
  description: string;
  tone: "primary" | "violet" | "emerald" | "amber" | "rose";
}

interface College {
  id: string;
  name: string;
  city?: string;
  state?: string;
  programs?: string[];
  nirf_rank?: number;
  fees?: string;
}

interface CareerRecommendation {
  id: string;
  title: string;
  match_pct?: number;
  reason?: string;
  workshops?: { id: string; title: string; difficulty?: string; duration?: string }[];
}

const QUICK_PROMPTS = [
  "What should I do after Class 10 for engineering?",
  "How do I prepare for JEE?",
  "Best B.Tech specialisations for AI/ML?",
  "Compare IIT vs NIT for Computer Science",
];

const STAGE_TONE: Record<RoadmapStage["tone"], string> = {
  primary: "bg-blue-500",
  violet:  "bg-violet-500",
  emerald: "bg-emerald-500",
  amber:   "bg-amber-500",
  rose:    "bg-rose-500",
};

export default function CareerPilotPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get("tab") as Tab | null) ?? "roadmap";
  const { user, displayName } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>(initialTab && ["roadmap", "colleges", "quiz", "careers"].includes(initialTab) ? initialTab : "roadmap");
  const [lang, setLang] = useState<Lang>("EN");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [roadmap, setRoadmap] = useState<RoadmapStage[] | null>(null);
  const [colleges, setColleges] = useState<College[] | null>(null);
  const [recommendations, setRecommendations] = useState<CareerRecommendation[] | null>(null);
  const [collegeQuery, setCollegeQuery] = useState("");

  useEffect(() => { document.title = "AI Career Pilot — Skillship"; }, []);

  useEffect(() => {
    setMessages([{
      role: "assistant",
      ts: Date.now(),
      content:
        lang === "HI"
          ? `नमस्ते ${displayName ?? "Student"}! 👋 मैं आपका AI Career Counselor हूँ। आपकी quiz performance के आधार पर आप Engineering और Robotics में अच्छे हैं। क्या मैं career paths, colleges, या JEE/CUET की तैयारी में मदद करूँ?`
          : `Hi ${displayName ?? "Student"}! 👋 I'm your AI Career Counselor. Based on your quiz performance you show strong aptitude for Engineering and Robotics. Ask me about career paths, colleges, entrance exams like JEE/CUET, or specific roadmaps.`,
    }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  const loadAll = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [rm, col, rec] = await Promise.all([
        fetch(`${API_BASE}/career/roadmap/`, { headers }),
        fetch(`${API_BASE}/career/colleges/`, { headers }),
        fetch(`${API_BASE}/career/recommendations/`, { headers }),
      ]);
      setRoadmap(rm.ok ? asArray<RoadmapStage>(await rm.json()) : []);
      setColleges(col.ok ? asArray<College>(await col.json()) : []);
      setRecommendations(rec.ok ? asArray<CareerRecommendation>(await rec.json()) : []);
    } catch {
      setRoadmap([]); setColleges([]); setRecommendations([]);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function send(question?: string) {
    const q = (question ?? input).trim();
    if (!q || thinking) return;
    setMessages((cur) => [...cur, { role: "user", content: q, ts: Date.now() }]);
    setInput("");
    setThinking(true);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setThinking(false); return; }
    try {
      const res = await fetch(`${API_BASE}/career/ask/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          language: lang === "HI" ? "hi" : "en",
          context: { student_id: user?.id },
        }),
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

  const filteredColleges = useMemo(() => {
    if (!colleges) return null;
    const q = collegeQuery.trim().toLowerCase();
    if (!q) return colleges;
    return colleges.filter((c) => c.name.toLowerCase().includes(q) || (c.city ?? "").toLowerCase().includes(q) || (c.programs ?? []).some((p) => p.toLowerCase().includes(q)));
  }, [colleges, collegeQuery]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(360px,1fr)_minmax(0,1.4fr)]">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex h-[calc(100vh-12rem)] min-h-[520px] flex-col overflow-hidden rounded-2xl border-2 border-primary/30 bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="flex items-center justify-between border-b border-primary/20 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white"><BotIcon /></div>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">AI Career Counselor</p>
              <p className="flex items-center gap-1 text-[11px] text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
              </p>
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

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <nav className="flex border-b border-[var(--border)] px-2 pt-2" role="tablist">
          {([
            { k: "roadmap",  label: "Career Roadmap" },
            { k: "colleges", label: "College Finder" },
            { k: "quiz",     label: "Career Quiz" },
            { k: "careers",  label: "Recommended Careers" },
          ] as { k: Tab; label: string }[]).map((t) => (
            <button key={t.k} role="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${tab === t.k ? "border-b-2 border-primary text-primary" : "border-b-2 border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {tab === "roadmap"  && <RoadmapTab key="rm"  data={roadmap}  studentName={displayName ?? "Student"} />}
            {tab === "colleges" && <CollegesTab key="cl" data={filteredColleges} query={collegeQuery} setQuery={setCollegeQuery} />}
            {tab === "quiz"     && <QuizTab key="qz" />}
            {tab === "careers"  && <RecommendationsTab key="rc" data={recommendations} />}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
}

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
                  {citations.slice(0, 3).map((c, i) => (
                    <li key={i}><a href={c.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{c.title}</a></li>
                  ))}
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

function RoadmapTab({ data, studentName }: { data: RoadmapStage[] | null; studentName: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4" role="tabpanel">
      <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Your Career Roadmap — {studentName}</h3>
      {data === null ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--muted)]/40" />)}</div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--muted-foreground)]">
          Roadmap unlocks once you complete more quizzes — the AI uses your performance pattern.
        </div>
      ) : (
        <ol className="space-y-3">
          {data.map((s, i) => (
            <li key={s.id} className="flex items-start gap-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${STAGE_TONE[s.tone] ?? "bg-primary"}`}>{i + 1}</div>
              <div className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-[var(--muted-foreground)]">{s.stage}</p>
                  {s.badge && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{s.badge}</span>}
                </div>
                <p className="mt-1 text-sm text-[var(--foreground)]">{s.description}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </motion.div>
  );
}

function CollegesTab({ data, query, setQuery }: { data: College[] | null; query: string; setQuery: (q: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4" role="tabpanel">
      <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">College Finder</h3>
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search college, city, or program (e.g. IIT Delhi, B.Tech)" className="h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]" />
      {data === null ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--muted)]/40" />)}</div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--muted-foreground)]">No colleges in catalog yet.</div>
      ) : (
        <ul className="space-y-2">
          {data.slice(0, 12).map((c) => (
            <li key={c.id} className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3 transition-colors hover:bg-[var(--muted)]/60">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{c.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{[c.city, c.state].filter(Boolean).join(", ") || "—"}{c.fees ? ` · ${c.fees}` : ""}</p>
                  {c.programs && c.programs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.programs.slice(0, 4).map((p) => <span key={p} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{p}</span>)}
                    </div>
                  )}
                </div>
                {c.nirf_rank && <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">NIRF #{c.nirf_rank}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

function QuizTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4" role="tabpanel">
      <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Career Aptitude Quiz</h3>
      <p className="text-sm text-[var(--muted-foreground)]">
        Take a 10-minute interest-and-aptitude assessment. Results feed into your Recommended Careers and Roadmap tabs.
      </p>
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
        <p className="text-sm text-[var(--foreground)]">
          Your performance across regular Skillship quizzes already feeds the AI Career Pilot. Want a focused career-aptitude quiz on top?
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/student/quizzes" className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white">
            Browse aptitude quizzes
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </Link>
          <Link href="/dashboard/student/results" className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] hover:border-primary/30 hover:text-primary dark:bg-[var(--background)]">
            See past results
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function RecommendationsTab({ data }: { data: CareerRecommendation[] | null }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4" role="tabpanel">
      <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Recommended Careers &amp; Workshops</h3>
      {data === null ? (
        <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-[var(--muted)]/40" />)}</div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--muted-foreground)]">Take a few quizzes — the AI tailors career suggestions from your performance.</div>
      ) : (
        <div className="space-y-4">
          {data.map((r) => (
            <div key={r.id} className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--foreground)]">{r.title}</p>
                  {r.reason && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{r.reason}</p>}
                </div>
                {typeof r.match_pct === "number" && <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{r.match_pct}% match</span>}
              </div>
              {r.workshops && r.workshops.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {r.workshops.slice(0, 4).map((w) => (
                    <Link key={w.id} href={`/marketplace`} className="rounded-xl border border-[var(--border)] bg-white p-3 transition-colors hover:border-primary/30 dark:bg-[var(--background)]">
                      <p className="text-xs font-bold text-[var(--foreground)]">{w.title}</p>
                      <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{w.difficulty ?? ""}{w.difficulty && w.duration ? " · " : ""}{w.duration ?? ""}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function BotIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><line x1="12" y1="7" x2="12" y2="11" /><circle cx="8" cy="16" r="0.6" fill="currentColor" /><circle cx="12" cy="16" r="0.6" fill="currentColor" /><circle cx="16" cy="16" r="0.6" fill="currentColor" /></svg>;
}
