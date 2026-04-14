# Skillship Platform

AI-powered school management and career guidance SaaS for Indian schools.

**Stack:** Next.js (frontend) · Node.js/Express (API) · Python/FastAPI (AI service) · PostgreSQL · Prisma · Turborepo

---

## Prerequisites

Install these before anything else:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 20+ | https://nodejs.org |
| pnpm | 9+ | `npm install -g pnpm` |
| Python | 3.11+ | https://python.org |
| PostgreSQL | 15+ | https://postgresql.org |
| Git | any | https://git-scm.com |

> Optional: Docker + Docker Compose if you want containerized setup instead.

---

## Setup (Step by Step)

### 1. Clone & Install

```bash
git clone <repo-url>
cd skillship-merged

pnpm install
```

### 2. Set Up Environment Variables

Copy env files for each app:

```bash
# Root
cp .env.example .env

# API
cp apps/api/.env.example apps/api/.env

# AI Service
cp apps/ai-service/.env.example apps/ai-service/.env

# Web
cp apps/web/.env.example apps/web/.env.local
```

Edit each `.env` file. Key variables:

**`apps/api/.env`**
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/skillship
JWT_SECRET=your-secret-key-here
AI_SERVICE_URL=http://localhost:8001
PORT=8000
```

**`apps/web/.env.local`**
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

**`apps/ai-service/.env`**
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/skillship
OPENAI_API_KEY=sk-...
PORT=8001
```

### 3. Set Up Database

Create PostgreSQL database:

```bash
psql -U postgres -c "CREATE DATABASE skillship;"
```

Run Prisma migrations:

```bash
cd packages/db
npx prisma migrate dev
npx prisma generate
cd ../..
```

Seed initial data (optional):

```bash
cd packages/db
npx prisma db seed
cd ../..
```

### 4. Set Up Python AI Service

```bash
cd apps/ai-service

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

cd ../..
```

---

## Running Locally

Run all services. Open **4 terminals** (or use tmux/screen).

### Terminal 1 — API (Node.js)

```bash
cd apps/api
pnpm dev
# Runs on http://localhost:8000
```

### Terminal 2 — AI Service (Python)

```bash
cd apps/ai-service
source venv/bin/activate        # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8001
# Runs on http://localhost:8001
```

### Terminal 3 — Web (Next.js)

```bash
cd apps/web
pnpm dev
# Runs on http://localhost:3000
```

### Alternative — Run All from Root (Turborepo)

```bash
# From repo root, runs all apps simultaneously
pnpm dev
```

---

## Service URLs

| Service | URL |
|---------|-----|
| Web Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/api/docs |
| AI Service | http://localhost:8001 |
| AI Service Docs | http://localhost:8001/docs |

---

## Docker Setup (Alternative)

If you prefer Docker instead of manual setup:

```bash
# Copy root env
cp .env.example .env
# Fill in values in .env

# Start all services
docker compose up --build
```

Services auto-start in correct order. Web at http://localhost:3000.

---

## Project Structure

```
skillship-merged/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   ├── api/          # Node.js/Express backend (port 8000)
│   └── ai-service/   # Python/FastAPI AI service (port 8001)
├── packages/
│   ├── db/           # Prisma schema & migrations
│   ├── config/       # Shared config (Tailwind, ESLint, TS)
│   └── types/        # Shared TypeScript types
├── turbo.json
└── package.json
```

---

## Common Issues

**`prisma generate` fails** — run from `packages/db`, not root.

**Python venv not found** — activate venv before running uvicorn.

**Port already in use** — kill process: `npx kill-port 3000 8000 8001`

**DB connection refused** — ensure PostgreSQL running: `pg_ctl status` or check Services (Windows).

**pnpm not found** — run `npm install -g pnpm` first.

---

## Default Login Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@skillship.in | Admin@123 |
| Principal | principal@demo.school.in | School@123 |
| Teacher | teacher@demo.school.in | Teacher@123 |
| Student | student@demo.school.in | Student@123 |
