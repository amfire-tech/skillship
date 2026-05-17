// File:    frontend/next.config.js
// Purpose: Next.js config — proxies /api/v1/* to Django backend in dev.
// Owner:   Pranav

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output bundles only the files needed to run `node server.js`,
  // shrinks the prod image from ~1 GB to ~150 MB and makes the Dockerfile
  // trivial. Local dev is unaffected — `next dev` ignores this setting.
  output: "standalone",
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
    return [
      {
        source: "/api/v1/:path*",
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

module.exports = nextConfig;
