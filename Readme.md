# Skillship Platform

AI-powered school management platform for Indian schools.

---

## Run Frontend Only (Quick Start)

If you just want to run the website/UI, follow these steps.

### Step 1 — Install Node.js

Download and install Node.js (version 20 or above):
https://nodejs.org/en/download

Verify install:
```bash
node -v   # should show v20.x.x or higher
npm -v
```

### Step 2 — Clone the Repo

```bash
git clone https://github.com/amfire-tech/skillship.git
cd skillship
```

### Step 3 — Install Dependencies

```bash
cd apps/web
npm install
```

### Step 4 — Set Up Environment File

Create a file called `.env.local` inside `apps/web/` with this content:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

### Step 5 — Run the App

```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

That's it. Frontend is running.

> **Note:** API calls (login, data fetching) won't work unless the backend is also running. But all UI pages will load fine.

---

## Run Full Stack (Frontend + Backend + AI)

Only needed if you want login, database, and AI features to work.

### Requirements

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 20+ | https://nodejs.org |
| pnpm | 9+ | Run: `npm install -g pnpm` |
| Python | 3.11+ | https://python.org |
| PostgreSQL | 15+ | https://postgresql.org |

### Step 1 — Install pnpm and project dependencies

```bash
npm install -g pnpm
cd skillship
pnpm install
```

### Step 2 — Set up environment files

Copy and fill in env files for each service:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/ai-service/.env.example apps/ai-service/.env
cp apps/web/.env.example apps/web/.env.local
```

**`apps/api/.env`** — fill in:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/skillship
JWT_SECRET=any-random-secret-string
AI_SERVICE_URL=http://localhost:8001
PORT=8000
```

**`apps/web/.env.local`** — fill in:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

**`apps/ai-service/.env`** — fill in:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/skillship
OPENAI_API_KEY=sk-your-key-here
PORT=8001
```

### Step 3 — Set up the database

Make sure PostgreSQL is running, then:

```bash
psql -U postgres -c "CREATE DATABASE skillship;"

cd packages/db
npx prisma migrate dev
npx prisma generate
npx prisma db seed
cd ../..
```

### Step 4 — Set up Python AI service

```bash
cd apps/ai-service

python -m venv venv

# Activate (Windows):
venv\Scripts\activate

# Activate (Mac/Linux):
source venv/bin/activate

pip install -r requirements.txt
cd ../..
```

### Step 5 — Start all 3 services (open 3 terminals)

**Terminal 1 — API:**
```bash
cd apps/api
pnpm dev
# Running at http://localhost:8000
```

**Terminal 2 — AI Service:**
```bash
cd apps/ai-service
venv\Scripts\activate        # or: source venv/bin/activate
uvicorn app.main:app --reload --port 8001
# Running at http://localhost:8001
```

**Terminal 3 — Frontend:**
```bash
cd apps/web
npm run dev
# Running at http://localhost:3000
```

---

## Default Login Credentials

After running the database seed, use these to log in:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@skillship.in | Admin@123 |
| Principal | principal@demo.school.in | School@123 |
| Teacher | teacher@demo.school.in | Teacher@123 |
| Student | student@demo.school.in | Student@123 |

---

## Common Issues

**Port already in use:**
```bash
npx kill-port 3000 8000 8001
```

**PostgreSQL not connecting:** Make sure PostgreSQL service is running on your machine.

**`pnpm` not found:** Run `npm install -g pnpm` first.

**Python venv errors:** Make sure you activated the venv before running `pip install` or `uvicorn`.
