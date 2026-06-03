import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";

// ============================================================
// Auth Store — Zustand with safe token handling.
// Access token: memory only (never persisted — XSS safe)
// Refresh token: HttpOnly cookie (managed by Django, JS never touches it)
// Only user + isAuthenticated are persisted to survive page reload.
// hasHydrated: gates auth checks until localStorage is read on reload.
// ============================================================

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (v: boolean) => void;
  refreshAuth: () => Promise<boolean>;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  hasHydrated: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => {
      // Single-flight guard — per-store instance; prevents SSR cross-request sharing
      // and double refresh race (interceptor + layout both calling refresh).
      let _refreshInFlight: Promise<boolean> | null = null;

      return {
      ...initialState,

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      login: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, isLoading: false }),

      logout: () => set({ ...initialState, hasHydrated: true }),

      clearAuth: () => set({ ...initialState, hasHydrated: true }),

      setLoading: (isLoading) => set({ isLoading }),

      refreshAuth: async () => {
        if (_refreshInFlight) return _refreshInFlight;
        _refreshInFlight = (async () => {
          try {
            const res = await fetch("/api/auth/refresh", { method: "POST" });
            if (!res.ok) {
              get().clearAuth();
              return false;
            }
            const data = await res.json();
            set({ accessToken: data.access, isAuthenticated: true });
            return true;
          } catch {
            get().clearAuth();
            return false;
          } finally {
            _refreshInFlight = null;
          }
        })();
        return _refreshInFlight;
      },
    };
    },
    {
      name: "skillship-auth",
      storage: createJSONStorage(() => localStorage),
      // SECURITY: Only persist user profile + auth flag.
      // Access token stays in memory only — lost on refresh, re-obtained via cookie refresh.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Called once localStorage is read. Safe to run auth checks now.
        state?.setHasHydrated(true);
      },
    }
  )
);
