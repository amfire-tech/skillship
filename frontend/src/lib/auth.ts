// File:    frontend/src/lib/auth.ts
// Purpose: Thin helpers that wrap authStore — for use outside React components.
// Owner:   Pranav
// Note:    Inside components use useAuth() hook instead.

import { useAuthStore } from "@/store/authStore";

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
