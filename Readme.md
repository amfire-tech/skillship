# Skillship Platform

AI-powered school management platform for Indian schools.

---

## Run Frontend Only (Quick Start)

If you just want to run the website/UI, follow these steps.

### Step 1 — Install Node.js

**Windows:**
```bash
winget install OpenJS.NodeJS.LTS
```

**Mac:**
```bash
brew install node@20
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify install:
```bash
node -v   # should show v20.x.x or higher
npm -v
```

> If `winget` is not available on Windows, download installer from: https://nodejs.org/en/download

---

### Step 2 — Install Git

**Windows:**
```bash
winget install Git.Git
```

**Mac:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt-get install git
```

Verify:
```bash
git --version
```

---

### Step 3 — Clone the Repo

```bash
git clone https://github.com/amfire-tech/skillship.git
cd skillship
```

---

### Step 4 — Install Dependencies

```bash
cd apps/web
npm install
```

---

### Step 5 — Set Up Environment File

Inside `apps/web/`, create a file named `.env.local` and paste this:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

**Windows (PowerShell):**
```powershell
New-Item apps/web/.env.local
```
Then open the file and paste the content above.

**Mac/Linux:**
```bash
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
EOF
```

---

### Step 6 — Run the App

```bash
cd apps/web
npm run dev
```

Open browser → **http://localhost:3000**

Done. Frontend is running.

> **Note:** Login and data features won't work without the backend running. But all UI pages will load.

---

## Run Full Stack (Frontend + Backend + AI)

Only needed if you want login, database, and AI features to work.

### Step 1 — Install All Tools

#### Node.js (see above — Step 1 of Quick Start)

#### pnpm

```bash
npm install -g pnpm
```

Verify:
```bash
pnpm -v
```

#### Python 3.11+

**Windows:**
```bash
winget install Python.Python.3.11
```

**Mac:**
```bash
brew install python@3.11
```

**Linux:**
```bash
sudo apt-get install python3.11 python3.11-venv python3-pip
```

Verify:
```bash
python --version   # or: python3 --version
```

#### PostgreSQL

**Windows:**
```bash
winget install PostgreSQL.PostgreSQL
```

**Mac:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Verify:
```bash
psql --version
```

---

### Step 2 — Clone and Install Dependencies

```bash
git clone https://github.com/amfire-tech/skillship.git
cd skillship
pnpm install
```

---

### Step 3 — Set Up Environment Files

```bash
cp apps/api/.env.example apps/api/.env
cp apps/ai-service/.env.example apps/ai-service/.env
cp apps/web/.env.example apps/web/.env.local
```

Now open each file and fill in the values:

**`apps/api/.env`:**
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/skillship
JWT_SECRET=any-random-secret-string
AI_SERVICE_URL=http://localhost:8001
PORT=8000
```

**`apps/web/.env.local`:**
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

**`apps/ai-service/.env`:**
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/skillship
OPENAI_API_KEY=sk-your-openai-key-here
PORT=8001
```

> Replace `yourpassword` with your PostgreSQL password set during installation.

---

### Step 4 — Create the Database

```bash
psql -U postgres -c "CREATE DATABASE skillship;"
```

Run migrations and seed data:

```bash
cd packages/db
npx prisma migrate dev
npx prisma generate
npx prisma db seed
cd ../..
```

---

### Step 5 — Set Up Python AI Service

```bash
cd apps/ai-service

python -m venv venv
```

Activate the virtual environment:

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

Install Python packages:
```bash
pip install -r requirements.txt
cd ../..
```

---

### Step 6 — Start All 3 Services

Open **3 separate terminals** and run one command in each:

**Terminal 1 — API (Node.js backend):**
```bash
cd skillship/apps/api
pnpm dev
```
Runs at → http://localhost:8000

**Terminal 2 — AI Service (Python):**
```bash
cd skillship/apps/ai-service

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

uvicorn app.main:app --reload --port 8001
```
Runs at → http://localhost:8001

**Terminal 3 — Frontend (Next.js):**
```bash
cd skillship/apps/web
npm run dev
```
Runs at → http://localhost:3000

---

---

## Common Issues

**Port already in use:**
```bash
npx kill-port 3000 8000 8001
```

**`psql` command not found on Windows:**
Add PostgreSQL to PATH. Default location: `C:\Program Files\PostgreSQL\15\bin`

**PostgreSQL password error:**
```bash
# Reset postgres user password
psql -U postgres
\password postgres
```

**`pnpm` not found:**
```bash
npm install -g pnpm
```

**Python venv not activating on Windows (PowerShell):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then run `venv\Scripts\activate` again.

**`pip install` fails:**
Make sure venv is activated (you should see `(venv)` at the start of your terminal line).
