import { type NextRequest, NextResponse } from "next/server";

// ============================================================
// Dev proxy: /api/auth/refresh → Django POST /api/v1/auth/refresh/
// No body. Sends the refresh cookie from this origin to Django as a
// cookie on its side. On success: returns { access } and forwards the
// rotated refresh cookie if Django sent one.
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function extractRefreshFromSetCookie(setCookie: string | null): string | null {
  if (!setCookie) return null;
  const match = setCookie.match(/refresh=([^;]+)/);
  return match?.[1] ?? null;
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh")?.value;

  if (!refreshToken) {
    return NextResponse.json({ code: "AUTH_REQUIRED", message: "No refresh token" }, { status: 401 });
  }

  const djangoRes = await fetch(`${API_BASE}/auth/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `refresh=${refreshToken}`,
    },
  });

  const data = await djangoRes.json().catch(() => ({}));

  if (!djangoRes.ok) {
    const res = NextResponse.json(
      { code: "AUTH_EXPIRED", message: "Refresh failed" },
      { status: 401 }
    );
    res.cookies.set("refresh", "", { httpOnly: true, maxAge: 0, path: "/api/auth" });
    return res;
  }

  const response = NextResponse.json({ access: data.access });

  const rotated = extractRefreshFromSetCookie(djangoRes.headers.get("set-cookie"));
  if (rotated) {
    response.cookies.set("refresh", rotated, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  return response;
}
