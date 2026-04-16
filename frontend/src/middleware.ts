import { NextResponse, type NextRequest } from "next/server";

// File:    frontend/src/middleware.ts
// Purpose: Next.js Edge Middleware — server-side auth gate for all (dashboard) routes.
// Owner:   Pranav

const PROTECTED_PREFIXES = ["/admin", "/sub-admin", "/principal", "/teacher", "/student"];
const REFRESH_COOKIE_NAME = "skillship_refresh";

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();

  // Cookie guard disabled until Django sets the refresh cookie on login.
  // Once backend lands, remove the early return and uncomment the block below.
  return NextResponse.next();

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
  matcher: ["/admin/:path*", "/sub-admin/:path*", "/principal/:path*", "/teacher/:path*", "/student/:path*"],
};
