import { type NextRequest, NextResponse } from "next/server";

const DJANGO_URL = "http://127.0.0.1:8000/api/v1/auth/users/create/";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let djangoRes: Response;
    try {
      djangoRes = await fetch(DJANGO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      console.error("[create-user proxy] cannot reach Django:", networkErr);
      return NextResponse.json(
        { detail: "Cannot reach server." },
        { status: 503 }
      );
    }

    const text = await djangoRes.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("[create-user proxy] Django returned non-JSON:", text.slice(0, 200));
      return NextResponse.json(
        { detail: "Unexpected response from server." },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: djangoRes.status });
  } catch (err) {
    console.error("[create-user proxy] unexpected error:", err);
    return NextResponse.json({ detail: "Internal server error." }, { status: 500 });
  }
}
