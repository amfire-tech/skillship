// File:    infra/load-test/k6_quiz_attempt.js
// Purpose: Simulate concurrent students taking a quiz to verify the proposal's
//          "200–500 concurrent users" promise before going live.
// Owner:   Navanish (Phase 6)
//
// Install k6 locally (one-time):
//   Windows:  choco install k6                       (or winget install k6)
//   macOS:    brew install k6
//   Linux:    https://k6.io/docs/get-started/installation/
//
// Run against staging (most common):
//   k6 run \
//     -e BASE_URL=https://staging.skillship.example.com \
//     -e STUDENT_EMAIL=student@school.test \
//     -e STUDENT_PASSWORD='Skillship#Test-2026' \
//     -e QUIZ_ID=<published-quiz-uuid> \
//     infra/load-test/k6_quiz_attempt.js
//
// The defaults below ramp to 200 concurrent virtual users over 90 s, hold for
// 3 min, then ramp down. Override per scenario:
//   k6 run -e VUS=500 -e DURATION=5m ...
//
// Pass criteria (per proposal page 9 "School-wide quiz day, 500–1,500"):
//   - p95 request latency < 1500 ms
//   - HTTP error rate     < 1 %
//
// What this script does NOT do:
//   - It does NOT simulate AI endpoints (those are rate-limited per-user
//     and would just rack up Gemini cost without measuring server limits).
//   - It does NOT create new attempts beyond `attempts_allowed` per quiz —
//     re-running against the same student/quiz will exhaust attempts and
//     start 400ing. Use a dedicated load-test quiz with attempts_allowed=0.

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate     = new Rate('errors');
const loginLatency  = new Trend('latency_login',   true);
const startLatency  = new Trend('latency_start',   true);
const answerLatency = new Trend('latency_answer',  true);
const submitLatency = new Trend('latency_submit',  true);

const BASE_URL         = __ENV.BASE_URL         || 'http://localhost:8000';
const STUDENT_EMAIL    = __ENV.STUDENT_EMAIL    || 'student@school.test';
const STUDENT_PASSWORD = __ENV.STUDENT_PASSWORD || 'Skillship#Test-2026';
const QUIZ_ID          = __ENV.QUIZ_ID; // required
const TARGET_VUS       = Number(__ENV.VUS || 200);
const HOLD_DURATION    = __ENV.DURATION || '3m';

if (!QUIZ_ID) {
  throw new Error('QUIZ_ID env var is required. Pass -e QUIZ_ID=<published-quiz-uuid>.');
}

export const options = {
  scenarios: {
    quiz_attempt: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '90s',           target: TARGET_VUS },
        { duration: HOLD_DURATION,   target: TARGET_VUS },
        { duration: '30s',           target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed:       ['rate<0.01'],   // < 1 % errors
    http_req_duration:     ['p(95)<1500'],  // p95 under 1.5 s
    'latency_login{}':     ['p(95)<1000'],
    'latency_start{}':     ['p(95)<1500'],
    'latency_answer{}':    ['p(95)<800'],
    'latency_submit{}':    ['p(95)<1500'],
    errors:                ['rate<0.01'],
  },
};

function jsonHeaders(token) {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

export default function () {
  let token = null;

  // ── 1. Login ────────────────────────────────────────────────────────────
  group('login', () => {
    const r = http.post(
      `${BASE_URL}/api/v1/auth/login/`,
      JSON.stringify({ email: STUDENT_EMAIL, password: STUDENT_PASSWORD }),
      { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } },
    );
    loginLatency.add(r.timings.duration);
    const ok = check(r, { 'login 200': (x) => x.status === 200 });
    errorRate.add(!ok);
    if (!ok) return;
    token = r.json('access');
  });

  if (!token) return;

  // ── 2. Start attempt ────────────────────────────────────────────────────
  let attemptId = null;
  group('start', () => {
    const r = http.post(
      `${BASE_URL}/api/v1/quizzes/quizzes/${QUIZ_ID}/start/`,
      null,
      { headers: jsonHeaders(token), tags: { name: 'start' } },
    );
    startLatency.add(r.timings.duration);
    // 200 (resumed) or 201 (new attempt) are both fine.
    const ok = check(r, { 'start 2xx': (x) => x.status === 200 || x.status === 201 });
    errorRate.add(!ok);
    if (!ok) return;
    attemptId = r.json('id');
  });

  if (!attemptId) return;

  // ── 3. Answer-loop (up to 10 questions) ────────────────────────────────
  for (let i = 0; i < 10; i++) {
    let questionId = null;
    const nextRes = http.get(
      `${BASE_URL}/api/v1/quizzes/attempts/${attemptId}/next/`,
      { headers: jsonHeaders(token), tags: { name: 'next' } },
    );
    if (nextRes.status === 204) break; // no more questions
    if (!check(nextRes, { 'next 200': (x) => x.status === 200 })) {
      errorRate.add(true);
      break;
    }
    questionId = nextRes.json('id');
    const opts = nextRes.json('options') || [];
    const pick = opts.length > 0 ? opts[Math.floor(Math.random() * opts.length)].id : null;

    const ansRes = http.post(
      `${BASE_URL}/api/v1/quizzes/attempts/${attemptId}/answer/`,
      JSON.stringify({
        question: questionId,
        selected_option_ids: pick ? [pick] : [],
        text_response: '',
        time_spent_seconds: 5 + Math.floor(Math.random() * 20),
      }),
      { headers: jsonHeaders(token), tags: { name: 'answer' } },
    );
    answerLatency.add(ansRes.timings.duration);
    errorRate.add(!check(ansRes, { 'answer 200': (x) => x.status === 200 }));
    sleep(0.2);
  }

  // ── 4. Submit ───────────────────────────────────────────────────────────
  group('submit', () => {
    const r = http.post(
      `${BASE_URL}/api/v1/quizzes/attempts/${attemptId}/submit/`,
      null,
      { headers: jsonHeaders(token), tags: { name: 'submit' } },
    );
    submitLatency.add(r.timings.duration);
    errorRate.add(!check(r, { 'submit 200': (x) => x.status === 200 }));
  });

  // Mimic a real classroom — pause before the next iteration.
  sleep(1 + Math.random() * 3);
}

export function handleSummary(data) {
  const m = data.metrics;
  const pct = (name) => m[name] && m[name].values
    ? `${m[name].values['p(95)'].toFixed(0)} ms`
    : 'n/a';
  const rate = (name) => m[name] && m[name].values
    ? `${(m[name].values.rate * 100).toFixed(2)} %`
    : 'n/a';
  const summary = `
Skillship quiz-attempt load test — summary
==========================================
  p95 login        ${pct('latency_login')}
  p95 start        ${pct('latency_start')}
  p95 answer       ${pct('latency_answer')}
  p95 submit       ${pct('latency_submit')}
  p95 overall      ${pct('http_req_duration')}
  HTTP error rate  ${rate('http_req_failed')}
  Soft errors      ${rate('errors')}
`;
  return {
    stdout: summary,
    'load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
