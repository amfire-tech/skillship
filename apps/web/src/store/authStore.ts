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
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  refreshAuth: () => Promise<boolean>;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      login: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, isLoading: false }),

      logout: () => set({ ...initialState }),

      clearAuth: () => set({ ...initialState }),

      setLoading: (isLoading) => set({ isLoading }),

      refreshAuth: async () => {
        // Django sets refresh token as HttpOnly cookie.
        // This call sends the cookie automatically via withCredentials.
        // Stub until Django endpoint is ready.
        try {
          // const res = await apiClient.post<{access: string}>("/auth/token/refresh/");
          // set({ accessToken: res.data.access });
          // return true;
          get().clearAuth();
          return false;
        } catch {
          get().clearAuth();
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
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
