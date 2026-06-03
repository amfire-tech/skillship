# Skillship — Production deploy handbook

> Phase 5 deliverable, 16 May 2026. Owner: Navanish.

This document is the runbook for taking the Skillship stack from a fresh
Hetzner/DigitalOcean VPS to a working `https://skillship.example.com`.

Everything is automatable — but the first deploy needs a human to (a) point
DNS, (b) issue the TLS cert, and (c) approve the production environment in
GitHub. After that, `git push` to `main` → staging auto-deploys → manual
"Approve" in the Actions UI promotes to prod.

---

## 0 · Architecture in one minute

```
        ┌── nginx (:80, :443) ────────── public ─────────┐
        │     │                                          │
        │     ├─► /api/  → backend  :8000 (Django)        │
        │     ├─► /admin/ → backend                       │
        │     ├─► /static/, /media/ → backend             │
        │     └─► /       → frontend :3000 (Next.js)      │
        │                                                 │
        │     internal-only (no public route):            │
        │     backend → ai-service :8001 (FastAPI/Gemini) │
        │     backend → redis :6379                       │
        │     backend → Postgres+pgvector (Supabase)      │
        │     celery-worker, celery-beat                  │
        └─────────────────────────────────────────────────┘
```

- **One VPS** runs everything except Postgres (which lives on Supabase).
- **GHCR** stores the three Docker images. CI builds and pushes; the VPS pulls.
- **Let's Encrypt** issues the TLS cert via the `certbot` compose service.

---

## 1 · One-time VPS setup

Pick a VPS sized per the proposal (Server & Hosting section):
- **Daily use** (~100 users): Hetzner CCX13 / DigitalOcean s-2vcpu-2gb (~₹1,500–3,000/mo)
- **School-wide quiz day** (~1,500 users peak): scale up to 4 vCPU / 8 GB before exam week.

On the VPS as a sudoer user:

```bash
# 1. Install Docker + compose plugin (Ubuntu 24.04 LTS recommended)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Clone the repo
sudo mkdir -p /opt/skillship && sudo chown $USER:$USER /opt/skillship
cd /opt/skillship
git clone https://github.com/amfire-tech/skillship_test.git .

# 3. Create the prod env file
cp infra/.env.prod.example infra/.env.prod
chmod 600 infra/.env.prod
$EDITOR infra/.env.prod   # fill in DJANGO_SECRET_KEY, DATABASE_URL, GEMINI_API_KEY, etc.

# 4. Authenticate Docker to GHCR so `compose pull` can fetch private images
echo $GITHUB_PAT | docker login ghcr.io -u <your-github-username> --password-stdin
```

Generate a strong `DJANGO_SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Same for `AI_SERVICE_INTERNAL_KEY` (32 bytes is plenty).

---

## 2 · DNS

In your DNS provider (Cloudflare, Route 53, etc.):

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `skillship.example.com` | `<VPS public IPv4>` | 300 |
| A | `www.skillship.example.com` | `<VPS public IPv4>` | 300 |

If you're using Cloudflare, set the proxy mode to **DNS only** (grey cloud)
for the first cert issuance — orange-cloud breaks Let's Encrypt HTTP-01
validation. You can flip it to proxied (orange) after the cert is issued.

Wait until `dig skillship.example.com` returns the VPS IP from at least two
resolvers before doing anything else. Usually 1–5 minutes.

---

## 3 · First-time TLS cert

The compose file ships a one-shot `certbot` service that uses the `webroot`
challenge — nginx serves `/.well-known/acme-challenge/` from a shared volume.

```bash
cd /opt/skillship

# 3a. Bring up nginx alone in HTTP-only mode so certbot can talk to it.
# (The TLS server block in nginx.conf will fail to load until certs exist.
# Comment out the `:443 ssl;` server temporarily, OR use a bootstrap config —
# easiest is to start with just the redirect server until certs exist.)
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod up -d nginx

# 3b. Request the cert
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  -d skillship.example.com -d www.skillship.example.com \
  --email contact@amfire.in --agree-tos --no-eff-email

# 3c. Restart nginx with the full config (TLS server now valid).
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod restart nginx
```

### Cert renewal

Let's Encrypt certs last 90 days. Auto-renew via a cron entry on the host:

```bash
sudo crontab -e
# Add:
0 3 * * * cd /opt/skillship && docker compose -f infra/docker-compose.prod.yml run --rm certbot renew --quiet && docker compose -f infra/docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 4 · First full deploy

```bash
cd /opt/skillship

# Pull the latest images CI pushed
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod pull

# Apply Django migrations (one-shot)
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod \
  run --rm backend python manage.py migrate --noinput

# Create the first MAIN_ADMIN
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod \
  run --rm backend python manage.py createsuperuser

# Bring the whole stack up
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod up -d

# Verify
curl -fsS https://skillship.example.com/healthz/
docker compose -f infra/docker-compose.prod.yml ps   # all services should be `healthy`
```

---

## 5 · CI/CD wiring (GitHub Actions)

The `.github/workflows/deploy.yml` workflow auto-fires on every push to `main`:

1. **Build** stage — builds `backend`, `ai-service`, `frontend` images in
   parallel and pushes them to GHCR with two tags: the short commit SHA and
   `latest`. Uses GitHub Actions cache for fast incremental rebuilds.
2. **Deploy → staging** — SSH into the staging VPS, `git pull`, `compose
   pull`, run `migrate`, `compose up -d`, run a smoke test against `/healthz/`.
3. **Deploy → production** — same as staging, but gated by a GitHub
   **Environment protection rule** that requires a human approval.

### Required GitHub configuration

In **Settings → Environments**, create two environments:

**`staging`**
- No protection rules
- Environment secrets:
  - `SSH_HOST` — e.g. `staging.skillship.example.com`
  - `SSH_USER` — e.g. `ubuntu`
  - `SSH_PRIVATE_KEY` — paste the private key whose pubkey is in `~/.ssh/authorized_keys` on the VPS
  - `DEPLOY_DIR` — e.g. `/opt/skillship`

**`production`**
- Add at least one **Required reviewer** under "Deployment protection rules"
- Same four secrets (pointing at the production VPS)

### Required GitHub Variables (not secrets — these are public)

In **Settings → Variables → Actions**:
- `NEXT_PUBLIC_API_BASE_URL` — e.g. `https://skillship.example.com/api/v1`
  - This gets baked into the frontend image at build time. If staging and
    prod have different API hostnames, switch to per-environment variables.

### Required repo Actions permission

**Settings → Actions → General → Workflow permissions** → set to **"Read
and write"**. Otherwise the `GITHUB_TOKEN` can't push to GHCR.

---

## 6 · Day-to-day operations

### Look at logs

```bash
cd /opt/skillship

# Tail one service
docker compose -f infra/docker-compose.prod.yml logs -f backend

# Tail everything (chronological merge)
docker compose -f infra/docker-compose.prod.yml logs -f --tail=200
```

### Run a one-shot Django command

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod \
  run --rm backend python manage.py shell
```

### Restart one service

```bash
docker compose -f infra/docker-compose.prod.yml restart backend
```

### Roll back to a previous image

```bash
# Find the SHA tag you want from the GHCR UI or `gh api`
$EDITOR infra/.env.prod    # change BACKEND_IMAGE=ghcr.io/...:<sha>
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod pull
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod up -d
```

### Back up Redis + media

The `redis_data` and `media_data` named volumes hold state worth backing up.

```bash
# Snapshot Redis
docker compose -f infra/docker-compose.prod.yml exec redis redis-cli SAVE
sudo cp /var/lib/docker/volumes/skillship_redis_data/_data/dump.rdb /backup/redis-$(date +%F).rdb

# Tar the media volume
sudo tar -czf /backup/media-$(date +%F).tgz -C /var/lib/docker/volumes/skillship_media_data/_data .
```

Postgres is hosted on Supabase — back up via its dashboard (Daily Backups
plan) or `pg_dump` from this VPS using the `DATABASE_URL`.

---

## 7 · What's deliberately deferred

These are **not** in Phase 5 and need a follow-up before/after launch:

- **Sentry init** — `sentry-sdk` is in `requirements.txt` but never called.
  Phase 6 work. Add `SENTRY_DSN_BACKEND` / `SENTRY_DSN_AI_SERVICE` to the
  env file and call `sentry_sdk.init()` in Django settings + AI service
  `lifespan`.
- **Sentry SDK in ai-service** — not in `ai-service/requirements.txt` yet.
- **S3/CDN for `/media/`** — currently served by Django via
  `FileSystemStorage`. Fine for ~100 schools' worth of auto-reports;
  swap to `django-storages[boto3]` + S3 when storage > a few GB or you
  want global edge caching.
- **Cloudflare in front** — optional. Once your DNS A records resolve to
  the VPS, you can flip Cloudflare's proxy on for DDoS protection + edge
  caching. Keep your origin server's IP secret.
- **Bootstrap nginx config for first cert** — section 3a above leaves a
  manual step. Could be automated by shipping a `nginx-http-only.conf` and
  swapping it after first cert.

---

## 8 · Smoke checklist after every deploy

- [ ] `curl -fsS https://<host>/healthz/` returns `{"status":"ok",...}`
- [ ] Frontend home page loads without console errors
- [ ] Login works (`admin@skillship.test` or your real admin)
- [ ] At least one role's dashboard renders real data
- [ ] AI Career Pilot returns a Gemini answer (Career Pilot chat)
- [ ] Admin → Reports → "School Progress — PDF" downloads a non-empty PDF
- [ ] No `docker compose ps` row shows `restarting` or `unhealthy` after 60s
