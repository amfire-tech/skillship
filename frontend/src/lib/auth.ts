/*
 * File:    frontend/src/lib/auth.ts
 * Purpose: Shared auth helpers used across all dashboard pages.
 * Owner:   Pranav
 * Note:    Inside components use useAuth() hook instead.
 */

import { useAuthStore } from "@/store/authStore";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function getToken(): Promise<string | null> {
  let token = useAuthStore.getState().accessToken;
  if (!token) {
    const ok = await useAuthStore.getState().refreshAuth();
    if (!ok) return null;
    token = useAuthStore.getState().accessToken;
  }
  return token;
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
