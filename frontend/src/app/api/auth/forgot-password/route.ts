/*
 * File:    frontend/src/app/api/auth/forgot-password/route.ts
 * Purpose: Next.js route handler that proxies password-reset requests to Django.
 * Owner:   Pranav
 */

import { NextResponse, type NextRequest } from "next/server";

const DJANGO_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "") ??
  "http://localhost:8000";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${DJANGO_BASE}/api/v1/auth/password-reset/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
