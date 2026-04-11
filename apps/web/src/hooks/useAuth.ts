import { useAuthStore } from "@/store/authStore";
import type { User, LoginPayload, AuthResponse } from "@/types";
import { api } from "@/lib/api";

// ============================================================
// useAuth — Components use this, never authStore directly.
// ============================================================

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  const login = async (payload: LoginPayload) => {
    useAuthStore.getState().setLoading(true);
    try {
      const res = await api.post<AuthResponse>("/auth/token/", payload);
      useAuthStore.getState().login(res.user, res.accessToken);
      return res.user;
    } catch (error) {
      useAuthStore.getState().setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    useAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") window.location.href = "/login";
  };

  const hasRole = (role: User["role"]) => user?.role === role;

  const hasAnyRole = (...roles: User["role"][]) =>
    user ? roles.includes(user.role) : false;

  return { user, isAuthenticated, isLoading, login, logout, hasRole, hasAnyRole };
}
