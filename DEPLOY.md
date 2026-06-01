# Skillship — Deploy Guide

> Target: **Vercel (frontend)** + **Railway (backend + Postgres)** + **Gmail SMTP (owner email)**.
> Time to a working deployment: ~60–90 minutes if you have accounts ready.

Everything below assumes you've already pushed the latest code to `origin/staging` on GitHub.

---

## 0 · One-time prerequisites

- [ ] GitHub account that owns the `amfire/skillship_test` repo
- [ ] Vercel account (signup with the same GitHub for SSO — free)
- [ ] Railway account (free trial credit covers a small Postgres + 1 web service)
- [ ] Gmail account you'll use as the **sender** for owner notifications
- [ ] Gmail account you'll use as the **owner inbox** (can be the same Gmail)
- [ ] A domain you control (optional for tomorrow; both Vercel + Railway hand out free subdomains)

---

## 1 · Backend → Railway

### 1a. Provision Postgres

1. Railway dashboard → **New Project** → **Provision PostgreSQL**.
2. Once created, open the Postgres service → **Connect** tab → copy the **`DATABASE_URL`** (Railway labels it `Postgres Connection URL`). It looks like `postgresql://postgres:xxx@containers-us-west-x.railway.app:1234/railway`.

### 1b. Deploy the Django service

1. Same project → **+ New** → **GitHub Repo** → pick `amfire/skillship_test`.
2. Railway will detect the monorepo. Set the **Root Directory** to `backend` in service settings → Source.
3. **Build command**: Railway's Nixpacks detects Django automatically; you can leave the default. If it fails, set it explicitly:
   ```
   pip install -r requirements.txt && python manage.py collectstatic --noinput
   ```
4. **Start command**:
   ```
   python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2
   ```
   (The `migrate` runs on every deploy — safe because Django migrations are idempotent.)

### 1c. Environment variables (Railway → service → Variables)

Paste these in. Replace `<…>` placeholders with real values.

```
# Django
DJANGO_SETTINGS_MODULE=config.settings.prod
DJANGO_SECRET_KEY=<run: python -c "import secrets; print(secrets.token_urlsafe(50))">
DJANGO_ALLOWED_HOSTS=<your-railway-subdomain>.up.railway.app
DJANGO_CSRF_TRUSTED_ORIGINS=https://<your-railway-subdomain>.up.railway.app

# Postgres — Railway autofills this once you link the Postgres plugin
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Owner notification email (Gmail SMTP — free)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=alerts@yourdomain.com           # or your-gmail@gmail.com
EMAIL_HOST_PASSWORD=<gmail app password>        # see step 1d below
DEFAULT_FROM_EMAIL=Skillship <alerts@yourdomain.com>
LEADS_NOTIFY_EMAIL=owner@yourdomain.com         # where alerts land
```

Once you add Vercel later (step 2), come back and ALSO add the Vercel domain to both `DJANGO_ALLOWED_HOSTS` and `DJANGO_CSRF_TRUSTED_ORIGINS`:

```
DJANGO_ALLOWED_HOSTS=<rail>.up.railway.app,<vercel>.vercel.app
DJANGO_CSRF_TRUSTED_ORIGINS=https://<rail>.up.railway.app,https://<vercel>.vercel.app
```

### 1d. Gmail App Password (5 min, free)

Google blocks plain-password SMTP. You need an **App Password**:

1. Sign in to the Gmail account you'll use as `EMAIL_HOST_USER`.
2. Go to **myaccount.google.com → Security → 2-Step Verification** → turn it on if it isn't.
3. Same Security page → **App passwords**.
4. Generate an app password with name "Skillship SMTP". Copy the 16-character code (no spaces).
5. Paste into Railway as `EMAIL_HOST_PASSWORD`.

**Daily limit on the free tier:** Gmail allows ~500 emails/day per account — far above demo-booking volume.

### 1e. Create the Main Admin / superuser

Railway service → **Shell** → run:

```bash
python manage.py createsuperuser
```

Use the owner's email + a strong password. This account logs into `/admin/` to see leads.

### 1f. Verify

```bash
# from your laptop
curl https://<rail>.up.railway.app/api/schema/ | head -c 200

# Hit it harder — submit a fake lead
curl -X POST https://<rail>.up.railway.app/api/v1/demo-requests/ \
  -H "Content-Type: application/json" \
  -d '{"schoolName":"Smoke Test","principalName":"Test","city":"Pune","studentRange":"up-to-250","phoneNumber":"+91 99999 99999","emailAddress":"test@example.com","preferredDate":"2026-12-01","preferredTimeSlot":"11:30"}'
```

You should:
- Get a 201 with the saved lead JSON
- Receive an email at `LEADS_NOTIFY_EMAIL` within ~30 seconds
- See the lead in `/admin/leads/demorequest/`

---

## 2 · Frontend → Vercel

### 2a. Import the repo

1. Vercel dashboard → **Add New** → **Project** → pick `amfire/skillship_test`.
2. **Root Directory**: `frontend`
3. **Framework**: Next.js (auto-detected)
4. Leave build + output commands at defaults.

### 2b. Environment variable

Vercel project → **Settings → Environment Variables**:

```
NEXT_PUBLIC_API_BASE_URL=https://<your-railway-subdomain>.up.railway.app/api/v1
```

Set this for **Production, Preview, and Development** scopes.

### 2c. Deploy

Vercel auto-builds. First deploy takes ~3 min. You'll get `https://<project>.vercel.app`.

### 2d. Wire the Vercel domain back into the backend

Go back to Railway → service → Variables → append the Vercel domain to `DJANGO_ALLOWED_HOSTS` and `DJANGO_CSRF_TRUSTED_ORIGINS` (comma-separated). Railway will redeploy automatically.

Also confirm CORS works: open `https://<project>.vercel.app/request-demo`, fill the form, submit. If the request is blocked, the browser console will show a CORS error pointing back to the Railway host you need to add.

---

## 3 · After-deploy checklist

- [ ] `/` loads, hero animation runs, scroll works
- [ ] `/request-demo` loads, date picker selects, time slot selects, "Continue to form" scrolls down
- [ ] Submitting the form returns the success state
- [ ] `<LEADS_NOTIFY_EMAIL>` inbox receives the alert with date + slot
- [ ] Owner logs into `https://<rail>.up.railway.app/admin/` and sees the lead under **Leads → Demo requests**
- [ ] Owner can edit status (NEW → CONTACTED → CONVERTED) and write triage notes

---

## 4 · How the owner tracks bookings day-to-day

**Three free surfaces:**

1. **Email inbox** — every booking pings `LEADS_NOTIFY_EMAIL` with all details + a direct link to the Django admin row for that lead.
2. **Django admin** at `https://<rail>.up.railway.app/admin/leads/demorequest/` — sortable list, filters by status, search by school/email/city, click any row to update status + add notes.
3. **Phone/email back** — every email has the prospect's `phone_number` and `email_address`, so the owner can reply or call directly.

When the owner needs more (e.g. dashboard tiles, conversion analytics, WhatsApp pings) — that's the next milestone, not a launch blocker.

---

## 5 · Two things to know about what we shipped

### What's real
- Booking calendar (date + slot) is fully interactive and writes to the DB.
- Form validates + retries via mailto if backend is unreachable.
- Owner email notification on every new lead.

### What's still simulated (no harm for launch)
- **Slot availability** — every slot is always "available". If two schools pick the same slot, the owner just reaches out to one and reschedules. Real availability requires a calendar + capacity model; out of scope for tomorrow.
- **"12 schools booked this week"** floating pill — social-proof decoration, not a real counter.

---

## 6 · Future fast wins (after tomorrow's ship)

- [ ] Real slot availability — block slots that already have a booking.
- [ ] Build a `/dashboard/admin/demo-requests/` page using the existing dashboard chrome (better UX than `/admin/` for non-Django people).
- [ ] WhatsApp ping in addition to email — MSG91 or Gupshup, ~₹0.50/msg.
- [ ] Calendar invite (`.ics` attachment) auto-sent to the prospect on confirm.
- [ ] Custom domain in Vercel + Railway.
