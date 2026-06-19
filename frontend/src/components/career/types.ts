/*
 * File:    frontend/src/components/career/types.ts
 * Purpose: Shared types for the career-roadmap engine (Career Pilot, Saved
 *          Roadmaps, My Daily Planner pages).
 * Owner:   Pranav
 */

export interface CareerRec {
  slug: string;
  title: string;
  blurb?: string;
  match_pct?: number;
  reason?: string;
}

export interface RoadmapItem { text: string; type: string }
export interface RoadmapSection { id: string; title: string; timeframe?: string; focus?: string; items: RoadmapItem[] }
export interface CollegePick { name: string; location?: string; note?: string }
export interface CompanyPick { name: string; note?: string }
export interface NamedIdea { title: string; detail?: string }

export interface RoadmapDetail {
  headline: string;
  summary?: string;
  recommended_stream?: { name?: string; why?: string };
  sections: RoadmapSection[];
  key_exams?: string[];
  key_skills?: string[];
  top_colleges?: CollegePick[];
  top_companies?: CompanyPick[];
  projects?: NamedIdea[];
  internships?: NamedIdea[];
}

export type RoadmapFull = RoadmapDetail & {
  roadmap_id: string;
  career_slug: string;
  career_title: string;
  cached?: boolean;
};

export interface SavedRoadmap {
  id: string;
  career_slug: string;
  career_title: string;
  grade: number;
  board: string;
  is_saved: boolean;
  is_objective: boolean;
  created_at: string;
  roadmap: RoadmapDetail | null;
}

export interface ChecklistTask {
  id: string;
  day_index: number;
  due_date: string;
  title: string;
  detail?: string;
  category?: string;
  is_done: boolean;
}

export interface Checklist {
  id: string;
  career_title: string;
  headline?: string;
  period_start: string;
  period_end: string;
  done_count: number;
  total_count: number;
  tasks: ChecklistTask[];
}

export interface Quota { used: number; limit: number }

export interface CareerProfile {
  career_slug: string;
  career_title: string;
  objective_set_at: string | null;
  active_roadmap: string | null;
}

export const ITEM_DOT: Record<string, string> = {
  action: "bg-primary", skill: "bg-violet-500", exam: "bg-rose-500", milestone: "bg-amber-500",
};

export const CATEGORY_STYLE: Record<string, string> = {
  study:    "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  practice: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  revise:   "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  explore:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rest:     "bg-[var(--muted)] text-[var(--muted-foreground)]",
};
