/*
 * File:    frontend/src/store/subAdminAccess.ts
 * Purpose: A sub-admin's granted-school territory + per-school capabilities,
 *          loaded once from /assignments/subadmin-grants/my-access/. Drives both
 *          the school switcher and the capability-gated sidebar nav, so the two
 *          never drift. The "current" school is mirrored into schoolContext (the
 *          X-School-Context header) so every API call is scoped server-side.
 * Owner:   Pranav
 */

import { create } from "zustand";
import { getSchoolContext, setSchoolContext } from "@/lib/schoolContext";

export interface SubAdminGrant {
  school: string;
  school_name: string;
  can_manage_school: boolean;
  can_onboard_students: boolean;
  can_onboard_teachers: boolean;
  can_approve_quizzes: boolean;
}

interface SubAdminAccessState {
  grants: SubAdminGrant[] | null; // null = not loaded yet
  current: string | null;         // currently-acting school id
  loaded: boolean;
  setGrants: (grants: SubAdminGrant[]) => void;
  setCurrent: (schoolId: string) => void;
}

export const useSubAdminAccess = create<SubAdminAccessState>((set, get) => ({
  grants: null,
  current: getSchoolContext(),
  loaded: false,

  setGrants: (grants) => {
    // Keep the existing selection if it's still valid; otherwise default to the
    // first granted school and pin it as the active X-School-Context.
    const ctx = getSchoolContext();
    const valid = ctx && grants.some((g) => g.school === ctx);
    const current = valid ? ctx : grants[0]?.school ?? null;
    if (current && current !== ctx) setSchoolContext(current);
    set({ grants, current, loaded: true });
  },

  setCurrent: (schoolId) => {
    if (schoolId === get().current) return;
    setSchoolContext(schoolId);
    set({ current: schoolId });
  },
}));

/** The capability set for the school the sub-admin is currently acting in. */
export function currentGrant(state: SubAdminAccessState): SubAdminGrant | null {
  if (!state.grants || !state.current) return null;
  return state.grants.find((g) => g.school === state.current) ?? null;
}
