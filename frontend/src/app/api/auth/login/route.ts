import { type NextRequest, NextResponse } from "next/server";

// ============================================================
// Dev proxy: /api/auth/login → Django POST /api/v1/auth/login/
// Django returns { user, access } and Set-Cookie: refresh=...;
// We forward the refresh cookie to the frontend origin so subsequent
// /api/auth/* calls can read it.
// In prod (same origin via reverse proxy), the frontend can call
// /api/v1/auth/login/ directly — this proxy becomes optional.
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — must mirror SimpleJWT REFRESH_TOKEN_LIFETIME

function extractRefreshFromSetCookie(setCookie: string | null): string | null {
  if (!setCookie) return null;
  const match = setCookie.match(/refresh=([^;]+)/);
  return match?.[1] ?? null;
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const djangoRes = await fetch(`${API_BASE}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await djangoRes.json();

  if (!djangoRes.ok) {
    return NextResponse.json(data, { status: djangoRes.status });
  }

  // Contract: Django response body is { user, access }.
  const response = NextResponse.json({ user: data.user, access: data.access });

  const refresh = extractRefreshFromSetCookie(djangoRes.headers.get("set-cookie"));
  if (refresh) {
    response.cookies.set("refresh", refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  return response;
}
