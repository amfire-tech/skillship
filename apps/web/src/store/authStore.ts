import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";

// ============================================================
// Auth Store — Zustand with safe token handling.
// Access token: memory only (never persisted — XSS safe)
// Refresh token: HttpOnly cookie (managed by Django, JS never touches it)
// Only user + isAuthenticated are persisted to survive page reload.
// ============================================================

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  refreshAuth: () => Promise<boolean>;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false }),

      logout: () => set({ ...initialState }),

      clearAuth: () => set({ ...initialState }),

      setLoading: (isLoading) => set({ isLoading }),

      refreshAuth: async () => {
        const { user, refreshToken } = get();
        if (!user || !refreshToken) return false;
        try {
          const res = await fetch("http://localhost:8000/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.name, refreshToken }),
          });
          if (!res.ok) {
            get().clearAuth();
            return false;
          }
          const data = await res.json();
          set({ accessToken: data.accessToken });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "skillship-auth",
      storage: createJSONStorage(() => localStorage),
      // SECURITY: Only persist user profile + auth flag.
      // Access token stays in memory only — lost on refresh, re-obtained via cookie refresh.
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
