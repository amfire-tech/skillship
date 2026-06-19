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
# at build time. `.github/workflows/deploy.yml` passes them through `build-args`.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Canonical public origin — feeds metadataBase (og:image / twitter:image URLs),
# sitemap.xml, and robots.txt. If the CI build-arg is empty or unset, fall back
# to the prod domain so we never bake "http://localhost:3000" into a shipped
# image (which would break social-share previews and SEO).
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-https://skillship.in}

RUN npm run build


# ── Stage 3: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# `curl` for the healthcheck; `libc6-compat` so sharp's native binary loads.
RUN apk update && apk upgrade --no-cache && apk add --no-cache curl libc6-compat \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

# Standalone output bundles a minimal node_modules + server.js.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Guarantee the Next.js image optimizer's native dep (sharp) is present in the
# standalone runtime. Next usually traces it, but copy it explicitly so AVIF/
# WebP optimization can never silently fall back to serving the originals.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@img ./node_modules/@img

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://localhost:${PORT}/ || exit 1

CMD ["node", "server.js"]
