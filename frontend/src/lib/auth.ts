/*
 * File:    frontend/src/lib/auth.ts
 * Purpose: Shared auth helpers used across all dashboard pages.
 * Owner:   Pranav
 * Note:    Inside components use useAuth() hook instead.
 */

import { useAuthStore } from "@/store/authStore";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

/**
 * True if the JWT is missing/unparseable or its `exp` is within 10s. Access
 * tokens live 15 min; a teacher filling the quiz wizard easily crosses that, so
 * we must refresh proactively — getToken() previously only refreshed when the
 * token was null, letting an expired token surface as "token not valid".
 */
function isExpired(token: string): boolean {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(part));
    if (!payload?.exp) return false;
    return Date.now() >= payload.exp * 1000 - 10_000; // refresh 10s early
  } catch {
    return true; // unparseable → force a refresh
  }
}

export async function getToken(force = false): Promise<string | null> {
  let token = useAuthStore.getState().accessToken;
  if (!token || force || isExpired(token)) {
    const ok = await useAuthStore.getState().refreshAuth();
    if (!ok) return null;
    token = useAuthStore.getState().accessToken;
  }
  return token;
}

/**
 * Fetch wrapper that transparently refreshes the access token once on a 401.
 * Use this instead of raw fetch for any authenticated API call so a stale JWT
 * doesn't surface as a "token not valid" toast in the UI.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  let token = await getToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    // Stale access token — force-refresh and retry once.
    token = await getToken(true);
    if (!token) return res;
    res = await fetch(url, {
      ...init,
      headers: { ...headers, Authorization: `Bearer ${token}` },
    });
  }
  return res;
}

export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated;
}

export function getCurrentUser() {
  return useAuthStore.getState().user;
}

export function getRole() {
  return useAuthStore.getState().user?.role ?? null;
}

export function logout() {
  useAuthStore.getState().clearAuth();
  if (typeof window !== "undefined") window.location.href = "/login";
}
