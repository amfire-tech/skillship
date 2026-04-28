import { NextResponse, type NextRequest } from "next/server";

// TODO: route protection will be implemented here
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/admin/:path*",
    "/dashboard/sub-admin/:path*",
    "/dashboard/principal/:path*",
    "/dashboard/teacher/:path*",
    "/dashboard/student/:path*",
  ],
};
