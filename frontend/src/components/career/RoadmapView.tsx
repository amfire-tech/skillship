/*
 * File:    frontend/src/components/career/RoadmapView.tsx
 * Purpose: Read-only renderer for a full, in-depth career roadmap — timeline plus
 *          recommended stream, exams, top colleges, top companies, projects and
 *          internships. Footer actions are supplied by the parent page.
 * Owner:   Pranav
 */

"use client";

import { ReactNode } from "react";
import { ITEM_DOT, type RoadmapDetail } from "./types";

export function RoadmapView({
  roadmap, onBack, footer,
}: {
  roadmap: RoadmapDetail;
  onBack?: () => void;
  footer?: ReactNode;
}) {
  const stream = roadmap.recommended_stream;
  return (
    <div className="space-y-5">
      {onBack && (
        <button onClick={onBack} className="text-xs font-medium text-[var(--muted-foreground)] hover:text-primary">← Back</button>
      )}

      {/* Overview */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-bold text-[var(--foreground)]">{roadmap.headline}</p>
        {roadmap.summary && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{roadmap.summary}</p>}
        {stream?.name && (
          <p className="mt-3 text-xs text-[var(--foreground)]">
            <span className="font-semibold text-primary">Recommended stream:</span> {stream.name}
            {stream.why ? <span className="text-[var(--muted-foreground)]"> — {stream.why}</span> : null}
          </p>
        )}
        {(roadmap.key_exams?.length || roadmap.key_skills?.length) ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {roadmap.key_exams?.map((e) => <span key={e} className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{e}</span>)}
            {roadmap.key_skills?.map((s) => <span key={s} className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">{s}</span>)}
          </div>
        ) : null}
      </div>

      {/* Timeline */}
      <ol className="space-y-3">
        {roadmap.sections.map((s, i) => (
          <li key={s.id} className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">{i + 1}</div>
            <div className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-[var(--foreground)]">{s.title}</p>
                {s.timeframe && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{s.timeframe}</span>}
                {s.focus && <span className="text-[11px] text-[var(--muted-foreground)]">· {s.focus}</span>}
              </div>
              <ul className="mt-2 space-y-1.5">
                {s.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-[var(--foreground)]">
                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${ITEM_DOT[it.type] ?? "bg-primary"}`} />
                    <span>{it.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      {/* Top colleges */}
      {roadmap.top_colleges && roadmap.top_colleges.length > 0 && (
        <Block title="Top colleges in India">
          <ul className="space-y-2">
            {roadmap.top_colleges.map((c, i) => (
              <li key={i} className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">{c.name}{c.location ? <span className="font-normal text-[var(--muted-foreground)]"> · {c.location}</span> : null}</p>
                {c.note && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{c.note}</p>}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {/* Top companies */}
      {roadmap.top_companies && roadmap.top_companies.length > 0 && (
        <Block title="Top companies to aim for">
          <div className="flex flex-wrap gap-2">
            {roadmap.top_companies.map((c, i) => (
              <span key={i} title={c.note} className="rounded-full border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-1 text-xs font-medium text-[var(--foreground)]">{c.name}</span>
            ))}
          </div>
        </Block>
      )}

      {/* Projects */}
      {roadmap.projects && roadmap.projects.length > 0 && (
        <Block title="Industry projects to build">
          <ul className="space-y-2">
            {roadmap.projects.map((p, i) => (
              <li key={i} className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">{p.title}</p>
                {p.detail && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{p.detail}</p>}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {/* Internships */}
      {roadmap.internships && roadmap.internships.length > 0 && (
        <Block title="Internship options">
          <ul className="space-y-2">
            {roadmap.internships.map((p, i) => (
              <li key={i} className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">{p.title}</p>
                {p.detail && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{p.detail}</p>}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {footer && <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">{footer}</div>}
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">{title}</h4>
      {children}
    </div>
  );
}
