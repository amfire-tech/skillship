/*
 * File:    frontend/src/lib/auth.ts
 * Purpose: Shared auth helpers used across all dashboard pages.
 * Owner:   Pranav
 * Note:    Inside components use useAuth() hook instead.
 */

import { useAuthStore } from "@/store/authStore";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function getToken(force = false): Promise<string | null> {
  let token = useAuthStore.getState().accessToken;
  if (!token || force) {
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
