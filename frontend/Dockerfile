# File:    frontend/Dockerfile
# Purpose: Container image for the Next.js frontend (prod build).
# Owner:   Pranav
# TODO:
#   FROM node:20-alpine AS deps
#   WORKDIR /app
#   COPY package.json package-lock.json ./
#   RUN npm ci
#   FROM node:20-alpine AS build
#   WORKDIR /app
#   COPY --from=deps /app/node_modules ./node_modules
#   COPY . .
#   RUN npm run build
#   FROM node:20-alpine
#   WORKDIR /app
#   COPY --from=build /app/.next ./.next
#   COPY --from=build /app/public ./public
#   COPY --from=build /app/package.json ./
#   RUN npm ci --omit=dev
#   CMD ["npm", "start"]
