# syntax=docker/dockerfile:1.7
#
# File:    frontend/Dockerfile
# Purpose: Production image for the Next.js 14 frontend.
# Owner:   Navanish (Phase 5 build)
#
# Uses Next.js standalone output (set in next.config.js: output: "standalone")
# so the final image is ~150 MB instead of ~1 GB and only ships the server
# files actually needed at runtime.

# ── Stage 1: install deps ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Pull latest Alpine security patches before installing anything.
RUN apk update && apk upgrade --no-cache && apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund


# ── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* env vars are inlined into the build, so they must be available
# at build time. `docker-compose.prod.yml` passes them through `build.args`.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

RUN npm run build


# ── Stage 3: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

RUN apk update && apk upgrade --no-cache && apk add --no-cache curl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

# Standalone output bundles a minimal node_modules + server.js.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://localhost:${PORT}/ || exit 1

CMD ["node", "server.js"]
