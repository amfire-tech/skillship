import { NextResponse, type NextRequest } from "next/server";

// ============================================================
// Next.js Edge Middleware — Server-side auth gate.
//
// Defense-in-depth layer: redirects unauthenticated users BEFORE
// a protected route group ever renders. Role checks stay in the
// client layouts (they need the decoded user from Zustand).
//
// Mechanism: presence of the HttpOnly refresh cookie set by the
// Django backend. We can't read the cookie value (HttpOnly), but
// we can check existence via document.cookie's server-side twin.
//
// Cookie name is a placeholder — align with Django SimpleJWT /
// dj-rest-auth config once backend lands. Candidates:
//   - "skillship_refresh"
//   - "refresh_token"
// ============================================================

const PROTECTED_PREFIXES = [
  "/admin",
  "/subadmin",
  "/principal",
  "/teacher",
  "/student",
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const REFRESH_COOKIE_NAME = "skillship_refresh";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(_request: NextRequest) {
  // ------------------------------------------------------------
  // DISABLED during frontend preview — the Django HttpOnly refresh
  // cookie (`skillship_refresh`) doesn't exist yet, so this check
  // would block every protected route. Client-side guard in
  // (admin)/layout.tsx + seeded credentials handle auth for now.
  //
  // Backend team: once Django sets the refresh cookie on login,
  // restore the original block below as your defense-in-depth layer.
  // ------------------------------------------------------------
  return NextResponse.next();

  // const { pathname } = request.nextUrl;
  // if (!isProtectedPath(pathname)) return NextResponse.next();
  // const hasRefreshCookie = request.cookies.has(REFRESH_COOKIE_NAME);
  // if (!hasRefreshCookie) {
  //   const loginUrl = request.nextUrl.clone();
  //   loginUrl.pathname = "/login";
  //   loginUrl.searchParams.set("next", pathname);
  //   return NextResponse.redirect(loginUrl);
  // }
  // return NextResponse.next();
}

export const config = {
  // Match only the protected route groups — exclude static assets + public pages.
  matcher: [
    "/admin/:path*",
    "/subadmin/:path*",
    "/principal/:path*",
    "/teacher/:path*",
    "/student/:path*",
  ],
};
