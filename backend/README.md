<!--
File:    backend/README.md
Purpose: Quick-start guide for the Django backend — how to run, test, migrate locally.
Owner:   Navanish
-->

# Skillship — Backend (Django + DRF)

Owner of this folder: **Navanish** (lead).
App-level owners: see each app's files for `Owner:` header.

## 1. Setup (one time)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows (bash: source .venv/bin/activate)
pip install -r requirements-dev.txt
cp .env.example .env            # then edit DATABASE_URL etc
```

## 2. Database

```bash
python manage.py migrate
python manage.py createsuperuser    # creates MAIN_ADMIN
```

## 3. Run

```bash
python manage.py runserver 0.0.0.0:8000
# Swagger docs at: http://localhost:8000/api/docs/
```

## 4. Tests

```bash
pytest                              # all tests
pytest apps/schools/tests/          # one app
pytest -k test_isolation            # one test
```

## 5. Celery workers (background jobs)

```bash
celery -A jobs.celery_app worker -l info
celery -A jobs.celery_app beat   -l info     # scheduler
```

## 6. App layout

See root `TEAM_PLAN.md` for the complete explanation.
