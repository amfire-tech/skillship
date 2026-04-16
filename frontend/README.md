<!--
File:    frontend/README.md
Purpose: Quick-start for the Next.js frontend.
Owner:   Pranav
-->

# Skillship — Frontend (Next.js 14 + TypeScript + Tailwind)

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run gen:types       # regenerate TS types from Django's OpenAPI schema
```

## Run

```bash
npm run dev             # http://localhost:3000
```

## Folder layout

```
src/
  app/
    (public)/       # landing + marketplace (no auth)
    (auth)/login/   # login screen
    (dashboard)/    # protected; one subfolder per role
      admin/        student/
      sub-admin/    teacher/
      principal/
  components/       # shared UI (buttons, tables, charts)
  hooks/            # custom React hooks (useAuth, useDashboard)
  lib/              # api client, auth helpers, utilities
  types/generated/  # auto-generated from Django OpenAPI — DO NOT EDIT BY HAND
  middleware.ts     # route protection
```

## Syncing types with backend

Whenever backend changes an API shape:
```bash
npm run gen:types
```
This calls `openapi-typescript http://localhost:8000/api/schema/ -o src/types/generated/api.ts`.
