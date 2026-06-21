/*
 * File:    frontend/src/lib/schoolContext.ts
 * Purpose: The "which school am I acting in" context for a Skillship (roaming)
 *          teacher. A Skillship teacher has no home school and works in ONE
 *          assigned school at a time; we send that school's id as the
 *          `X-School-Context` header on every API call so the backend scopes
 *          them exactly like a normal teacher of that school.
 * Owner:   Pranav
 *
 * We patch window.fetch once (scoped to /api/v1/ requests) so the many teacher
 * dashboard pages that use raw fetch all carry the header without per-file
 * edits. For non-Skillship users no context is ever set, so it's a no-op (and
 * the backend ignores the header for them anyway).
 */

const KEY = "skillship.schoolContext";

let _ctx: string | null = null;
if (typeof window !== "undefined") {
  try { _ctx = localStorage.getItem(KEY); } catch { /* private mode */ }
}

export function getSchoolContext(): string | null {
  return _ctx;
}

export function setSchoolContext(id: string | null): void {
  _ctx = id;
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch { /* private mode */ }
}

let _installed = false;
function install(): void {
  if (_installed || typeof window === "undefined") return;
  _installed = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const ctx = getSchoolContext();
    if (!ctx) return orig(input, init);
    let url = "";
    try {
      url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    } catch {
      return orig(input, init);
    }
    if (!url.includes("/api/v1/")) return orig(input, init);
    if (input instanceof Request) {
      const headers = new Headers(input.headers);
      headers.set("X-School-Context", ctx);
      return orig(new Request(input, { headers }));
    }
    const headers = new Headers(init?.headers);
    headers.set("X-School-Context", ctx);
    return orig(url, { ...init, headers });
  };
}

// Install at client module load — before any page's useEffect fetch runs.
install();
