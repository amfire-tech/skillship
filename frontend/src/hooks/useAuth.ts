import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { displayName, type User, type LoginPayload, type AuthResponse } from "@/types";

// ============================================================
// useAuth — Components use this hook, never authStore directly.
// Login goes through /api/auth/login (Next.js route handler)
// which proxies Django and sets the HttpOnly refresh cookie.
// Response shape matches contract: { user, access }.
// ============================================================

export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  const login = async (payload: LoginPayload) => {
    useAuthStore.getState().setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? err?.detail ?? "Login failed");
      }

      const data: AuthResponse = await res.json();
      useAuthStore.getState().login(data.user, data.access);
      return data.user;
    } catch (error) {
      useAuthStore.getState().setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    useAuthStore.getState().clearAuth();
    router.replace("/login");
  };

  const hasRole = (role: User["role"]) => user?.role === role;

  const hasAnyRole = (...roles: User["role"][]) =>
    user ? roles.includes(user.role) : false;

  return {
    user,
    isAuthenticated,
    isLoading,
    role: user?.role ?? null,
    school: user?.school ?? null,
    displayName: user ? displayName(user) : null,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };
}
