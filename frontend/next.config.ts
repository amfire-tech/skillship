import type { NextConfig } from "next";

// File:    frontend/next.config.ts
// Purpose: Next.js config — proxies /api/* to the Django backend in dev,
//          so the frontend never hard-codes the backend host.
// Owner:   Pranav

const nextConfig: NextConfig = {
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
    ],
  },
};

export default nextConfig;
