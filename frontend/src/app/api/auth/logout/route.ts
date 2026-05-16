import { type NextRequest, NextResponse } from "next/server";

// ============================================================
// Dev proxy: /api/auth/logout → Django POST /api/v1/auth/logout/
// Django reads the refresh cookie, blacklists the token, clears the cookie.
// We clear our own frontend-origin cookie regardless of backend outcome.
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh")?.value;

  if (refreshToken) {
    // Send refresh token in body — SimpleJWT TokenBlacklistView requires {"refresh": "..."}
    await fetch(`${API_BASE}/auth/logout/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `refresh=${refreshToken}` },
      body: JSON.stringify({ refresh: refreshToken }),
    }).catch(() => {});
  }

  const response = NextResponse.json({ ok: true });
  // Path must match login cookie path ("/") so the cookie is actually cleared.
  response.cookies.set("refresh", "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
