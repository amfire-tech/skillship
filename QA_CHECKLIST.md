# Skillship — QA walkthrough checklist

> Phase 6.A.3 deliverable. Use this as the script for the staging walkthrough
> before promoting to production. Print it or paste into a Google Doc and
> tick boxes as you go.

**Environment:** `https://staging.skillship.example.com` (replace with your real staging host)
**Demo accounts** (all share the same password — `Skillship#Test-2026`):

| Role | Email |
|---|---|
| MAIN_ADMIN | `admin@skillship.test` |
| SUB_ADMIN | `subadmin@skillship.test` |
| PRINCIPAL | `principal@school.test` |
| TEACHER | `teacher@school.test` |
| STUDENT | `student@school.test` |

---

## How to read this doc

Each section is one **role × surface**. Inside each, every row is one check:
- ☐ unchecked → not yet tested
- ✅ passes → noted result
- ❌ fails → file a bug below (template at the bottom)

Aim for **100 % ✅ before production cutover**. If something fails:
1. Capture screenshot + browser console log + network tab error.
2. Paste into the **Bugs found** section.
3. Send to the dev team to fix; re-test after deploy.

---

## 0 · Smoke (do this first)

- [ ] `GET https://<host>/healthz/` returns `{"status":"ok",...}` from outside the VPS
- [ ] Home page loads at `https://<host>/`
- [ ] All five demo accounts can log in successfully
- [ ] No console errors on first page load for any role
- [ ] No "API failed" toasts on first dashboard render for any role

---

## 1 · MAIN_ADMIN (`admin@skillship.test`)

### Dashboard home (`/dashboard/admin`)
- [ ] Page loads in < 3s on a 4G connection
- [ ] Stat cards show real numbers (not all zeros if schools have activity)
- [ ] Recent Schools table populates from live data

### Schools (`/dashboard/admin/schools`)
- [ ] List shows existing schools with board / city / plan
- [ ] **Add school** form creates a new school; new row appears in list
- [ ] School detail page loads with real data
- [ ] Edit school works (change city, save, refresh — change persists)
- [ ] Deactivate school toggles `is_active`

### Users (`/dashboard/admin/users`)
- [ ] User list shows all roles across all schools
- [ ] Filter by role works
- [ ] **Add user** form creates a user; new row appears
- [ ] Edit user works (cannot change role/school per CLAUDE.md rule)
- [ ] **Set password** action works for an existing user
- [ ] Delete user works

### Sub-Admins (`/dashboard/admin/sub-admins`)
- [ ] List of all SUB_ADMINs across schools
- [ ] Add sub-admin works

### Quizzes (`/dashboard/admin/quizzes`)
- [ ] List shows quizzes across all schools
- [ ] Filter by status (DRAFT / REVIEW / PUBLISHED / ARCHIVED) works
- [ ] Quiz detail page shows questions + attempts + avg score

### Analytics (`/dashboard/admin/analytics`)
- [ ] Charts render real data
- [ ] Top schools by activity table populates
- [ ] No "TODO" or "Coming soon" placeholders visible

### **Reports (`/dashboard/admin/reports`) — Phase 2/3 highlight**
- [ ] School picker shows all schools
- [ ] Period selector (7D / 30D / 90D / YTD) changes the query
- [ ] **"School Progress — PDF"** button downloads a PDF that opens cleanly
- [ ] **"School Progress — Excel"** button downloads an xlsx that opens in Excel/Sheets
- [ ] **Custom Date Range** modal works → downloads a PDF
- [ ] Auto-Generated Reports list shows any `[Auto Report] ...` PDFs created by the monthly Celery task (or empty state if none yet)

### Marketplace (`/dashboard/admin/marketplace`)
- [ ] Listings load
- [ ] **Add listing** form creates a marketplace listing

### Settings (`/dashboard/admin/settings`)
- [ ] Page loads (note: per-platform settings deferred to Plan 02)

---

## 2 · PRINCIPAL (`principal@school.test`)

### Dashboard home (`/dashboard/principal`)
- [ ] Sees ONLY their own school's data — never another school's row
- [ ] School KPI summary loads
- [ ] Class performance widgets populated

### Academics (`/dashboard/principal/academics`)
- [ ] Academic years CRUD works
- [ ] Classes list filtered to this school
- [ ] Courses list filtered to this school

### Classes (`/dashboard/principal/classes`)
- [ ] Add academic year → create class → create course flows all work
- [ ] Enroll a student into a class (via existing UI)

### Students (`/dashboard/principal/students`)
- [ ] List shows only this school's students
- [ ] **Bulk Upload** button → upload a valid CSV → see `Imported N` toast
- [ ] **Bulk Upload** with a row error → see `N rows skipped — row X: <reason>` toast
- [ ] Search + filter works
- [ ] Edit student profile works
- [ ] Delete student works

### Teachers (`/dashboard/principal/teachers`)
- [ ] List shows only this school's teachers
- [ ] Bulk upload works (same flow as students, role=TEACHER per row)
- [ ] Add teacher manually works

### Analytics (`/dashboard/principal/analytics`)
- [ ] Charts populated with this school's data
- [ ] No cross-school data leaking in

### Reports (`/dashboard/principal/reports`)
- [ ] PDF export of school report works
- [ ] Excel export works

### **Quiz approval queue (`/dashboard/admin/quiz-approvals` or principal equivalent)**
- [ ] Sees DRAFT → REVIEW quizzes submitted by teachers in their school
- [ ] **Publish** action moves quiz to PUBLISHED
- [ ] **Return to Draft** action sends it back

---

## 3 · SUB_ADMIN (`subadmin@skillship.test`)

### Dashboard home (`/dashboard/sub-admin`)
- [ ] Loads with real school KPIs
- [ ] No console errors

### **Question Bank (`/dashboard/sub-admin/question-bank`) — Phase 4 highlight**
- [ ] List shows all questions across all banks in the school
- [ ] Subject sidebar filters work
- [ ] Difficulty pills filter works
- [ ] Search works
- [ ] **Add Question** modal creates a question; appears in list
- [ ] **"Bulk Upload CSV"** button opens the bank-picker modal
- [ ] Pick a bank → upload a CSV with all 3 question types (MCQ, TRUE_FALSE, SHORT_ANSWER) → result shows `Imported N / N`
- [ ] Bulk upload with deliberate row errors → expand `<details>` → see per-row error messages

### Quizzes (`/dashboard/sub-admin/quizzes`)
- [ ] Create quiz form works
- [ ] Add questions to quiz from question bank works
- [ ] Submit for review → status becomes `REVIEW`

### Schools / Users (sub-admin scoped)
- [ ] CRUD on school + user resources within their scope works

---

## 4 · TEACHER (`teacher@school.test`)

### Dashboard home (`/dashboard/teacher`)
- [ ] Loads with classes they teach
- [ ] Recent quizzes list populated

### My Quizzes (`/dashboard/teacher/quizzes`)
- [ ] List shows quizzes they created
- [ ] Create new quiz → DRAFT status
- [ ] Edit quiz works

### **Quiz detail (`/dashboard/teacher/quizzes/<id>`) — Phase 4.8 highlight**
- [ ] DRAFT quiz: **Edit** button visible, **Assign** button HIDDEN
- [ ] Submit for review → status → REVIEW
- [ ] After principal publishes: **Assign** button appears next to title
- [ ] **Assign** modal opens
- [ ] Toggle "Single student" → student dropdown populates with students in school
- [ ] Toggle "Entire class" → class dropdown populates
- [ ] Pick student + due datetime → Assign → success toast
- [ ] New assignment appears in the **Assignments** section below details with role badge
- [ ] **Revoke** button on an assignment row → confirms → row disappears

### AI Tools (`/dashboard/teacher/ai-tools`)
- [ ] **Content search** form → AI returns relevant content hits (requires pgvector enabled + content ingested)
- [ ] If pgvector disabled, get a clean 503 error toast (not a crash)

### Feedback / Short-answer grading (`/dashboard/teacher/feedback`)
- [ ] Pull up a SHORT_ANSWER attempt
- [ ] Click **AI Grade** → modal/result shows `score: 0.0–1.0` + `feedback` text from Gemini

### Students (`/dashboard/teacher/students`)
- [ ] Shows only students in the classes they teach

### Reports (`/dashboard/teacher/reports`)
- [ ] Class-level PDF / Excel exports work

---

## 5 · STUDENT (`student@school.test`)

### Dashboard home (`/dashboard/student`)
- [ ] Greets by name (real name from profile, not "Student")
- [ ] Shows quizzes available to them
- [ ] Recent attempts list populated

### **My Quizzes (`/dashboard/student/quizzes`) — Phase 4.8 highlight**
- [ ] **"Assigned to you (N)"** section visible AT THE TOP if any assignments exist (skip if none — verify by having a teacher assign one in another tab, then refresh)
- [ ] Personal vs Class badge shows correctly
- [ ] Due date displays; **Overdue** styling kicks in on past-due
- [ ] Click **Start** → routes to `/dashboard/student/quizzes/<quiz-id>` (quiz-taking flow)
- [ ] Below the assigned section: "Browse all published" grid still works

### Take a quiz end-to-end
- [ ] Click Start on a PUBLISHED quiz → attempt created → first question shows
- [ ] Answer 5+ questions in sequence
- [ ] Timer counts down (if quiz has duration_minutes)
- [ ] Submit attempt → score appears
- [ ] Result detail page shows correct/wrong breakdown

### My Results (`/dashboard/student/results`)
- [ ] Attempts list populated with quiz title, score, pass/fail badge, date
- [ ] Search by quiz title works
- [ ] PASS/FAIL filter works
- [ ] Click a row → result detail page loads

### Certificates (`/dashboard/student/certificates`)
- [ ] All passed attempts appear as certificates with score, badge, date
- [ ] Empty state shows when no passed attempts yet

### Rankings (`/dashboard/student/rankings`)
- [ ] Per-quiz leaderboard works
- [ ] Their own row highlighted if outside top-N (Phase 1.2 feature)

### **AI Career Pilot (`/dashboard/student/career`) — Plan 01 highlight**
- [ ] Chat tab → ask a career question → real Gemini answer (5-10 s)
- [ ] **College Finder** tab:
  - Pick a state (e.g. Maharashtra) → city (Mumbai) → specialization (Computer Science Engineering)
  - Click **Find Colleges** → see NIRF-ranked results from Gemini
  - Try a state with weaker options (e.g. Mizoram) → agent should still return something or a clean note
- [ ] Both flows handle stale JWT — wait > 15 min after login, try again → request transparently retries

### Content / Progress / Exam Alerts (`/dashboard/student/{content,progress,exam-alerts}`)
- [ ] Pages render without errors
- [ ] Empty states clean (no "TODO" placeholders)

---

## 6 · Cross-cutting checks (do these last)

### Tenant isolation (the CLAUDE.md "non-negotiable")
- [ ] Log in as `principal@school.test`. Open browser dev tools → Network tab. Visit a known school B UUID URL directly (e.g. `/api/v1/schools/<school-b-uuid>/`). **Must return 404, not 403 or 200.**
- [ ] As `student@school.test`, hit `/api/v1/quizzes/quizzes/<school-b-quiz-uuid>/` directly. **Must return 404.**
- [ ] As `student_a`, try to create an assignment via API targeting `student_b`. **Must return 400.**

### Performance (use Chrome DevTools → Lighthouse, mobile profile)
- [ ] Home page LCP < 2.5 s
- [ ] Each role's dashboard LCP < 3 s
- [ ] Total Blocking Time < 200 ms on every dashboard

### Load test (run from your laptop against staging)
```
k6 run \
  -e BASE_URL=https://staging.skillship.example.com \
  -e STUDENT_EMAIL=student@school.test \
  -e STUDENT_PASSWORD='Skillship#Test-2026' \
  -e QUIZ_ID=<a-published-quiz-uuid> \
  -e VUS=200 \
  -e DURATION=3m \
  infra/load-test/k6_quiz_attempt.js
```
- [ ] p95 latency < 1500 ms across all endpoints
- [ ] HTTP error rate < 1 %
- [ ] No service ever stopped responding (VPS didn't OOM)

### Plan 02 leak check (per CLAUDE.md — these must NOT be reachable)
- [ ] `POST /api/ai/tutor/ask` → 404 / 405 (route not mounted)
- [ ] `POST /api/ai/reports/weekly` → 404 / 405
- [ ] `POST /api/ai/risk/scan` → 404 / 405
- [ ] `POST /api/ai/content/tag` → 404 / 405
- [ ] No frontend menu item linking to a "AI Tutor", "Risk Alerts", "Weekly AI Report", "Doubt Solver"

### Security smoke
- [ ] HTTPS everywhere (no mixed content warnings)
- [ ] HSTS header present on a `curl -I https://<host>/`
- [ ] `X-Content-Type-Options: nosniff` present
- [ ] CSRF token required on POSTs (DRF defaults — DRF tests already cover this)
- [ ] JWT access tokens expire after 15 min (try waiting + refresh)
- [ ] Logging out clears the refresh cookie (browser dev tools → Application → Cookies)

---

## Bugs found template

Copy for each bug:
```
### Bug N — short title

- **Role**: e.g. STUDENT
- **Page / URL**: /dashboard/student/...
- **Steps to reproduce**:
  1. ...
  2. ...
- **Expected**: ...
- **Actual**: ...
- **Browser**: Chrome 121 / Firefox 122 / Safari 17
- **Console errors**: paste from F12 → Console
- **Network errors**: paste failed-request payload from F12 → Network
- **Screenshot**: attach
- **Priority**: P0 (data loss / leak) / P1 (feature broken) / P2 (cosmetic)
```

---

## Sign-off

When every checkbox above is ✅:

- [ ] All roles passed
- [ ] Tenant isolation passed
- [ ] Load test passed
- [ ] Plan 02 leak check passed
- [ ] Security smoke passed
- [ ] Any bugs filed have been fixed and re-tested

**Walkthrough lead:** ___________________________ **Date:** _______________

**Approval to deploy to production:** ☐ Approved ☐ Approved with conditions ☐ Not yet
