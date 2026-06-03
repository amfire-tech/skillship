/*
 * File:    frontend/src/lib/__tests__/auth.test.ts
 * Purpose: Unit tests for shared auth helpers (getToken, getRole, isAuthenticated).
 * Owner:   Pranav
 */
import { getToken, getRole, isAuthenticated, getCurrentUser } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

describe("lib/auth", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it("getToken returns existing access token without refresh", async () => {
    useAuthStore.setState({ accessToken: "abc.def.ghi", isAuthenticated: true });
    const token = await getToken();
    expect(token).toBe("abc.def.ghi");
  });

  it("getToken triggers refresh and returns new token when missing", async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access: "new-token" }),
    });
    useAuthStore.setState({ accessToken: null });
    const token = await getToken();
    expect(token).toBe("new-token");
    expect(global.fetch).toHaveBeenCalledWith("/api/auth/refresh", { method: "POST" });
  });

  it("getToken returns null when refresh fails", async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({ ok: false });
    useAuthStore.setState({ accessToken: null });
    const token = await getToken();
    expect(token).toBeNull();
  });

  it("getRole returns user role or null", () => {
    expect(getRole()).toBeNull();
    useAuthStore.setState({
      user: { id: "u1", email: "a@b.c", role: "TEACHER" } as never,
    });
    expect(getRole()).toBe("TEACHER");
  });

  it("isAuthenticated reflects store flag", () => {
    expect(isAuthenticated()).toBe(false);
    useAuthStore.setState({ isAuthenticated: true });
    expect(isAuthenticated()).toBe(true);
  });

  it("getCurrentUser returns user object or null", () => {
    expect(getCurrentUser()).toBeNull();
    useAuthStore.setState({ user: { id: "u1" } as never });
    expect(getCurrentUser()).toEqual({ id: "u1" });
  });
});
