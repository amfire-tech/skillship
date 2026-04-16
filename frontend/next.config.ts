// File:    frontend/next.config.ts
// Purpose: Next.js config — rewrites /api/* to the Django backend in dev.
// Owner:   Pranav
// TODO:    Export a NextConfig with async rewrites() that proxies
//          /api/:path* -> process.env.NEXT_PUBLIC_API_BASE_URL/api/:path*.
