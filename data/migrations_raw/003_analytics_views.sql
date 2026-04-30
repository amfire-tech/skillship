-- File:    data/migrations_raw/003_analytics_views.sql
-- Purpose: Materialized views for fast dashboard queries.
-- Why:     Live aggregates over 1M+ rows kill dashboards. Views refreshed nightly via Celery (02:30 IST).
-- Owner:   Vishal
-- Run:     Navanish applies this in Supabase SQL editor AFTER analytics migrations are deployed.

-- ============================================================
-- 1. school_kpi_mv — school-wide KPIs for principal dashboard
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS school_kpi_mv AS
SELECT
    s.school_id,
    COUNT(DISTINCT s.student_id)                              AS total_students,
    AVG(s.avg_score)                                          AS school_avg_score,
    SUM(s.time_spent_seconds)                                 AS total_time_spent_seconds,
    SUM(s.quizzes_taken)                                      AS total_quizzes_taken,
    COUNT(DISTINCT r.id) FILTER (WHERE r.acknowledged_by_id IS NULL)  AS open_risk_count
FROM analytics_studentdailystats s
LEFT JOIN analytics_risksignal r
       ON r.school_id = s.school_id AND r.student_id = s.student_id
WHERE s.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY s.school_id;

CREATE UNIQUE INDEX IF NOT EXISTS school_kpi_mv_school_idx ON school_kpi_mv (school_id);

-- ============================================================
-- 2. class_perf_mv — per-class performance for teacher dashboard
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS class_perf_mv AS
SELECT
    w.school_id,
    w.klass_id,
    AVG(w.avg_score)           AS class_avg_score,
    SUM(w.at_risk_count)       AS total_at_risk,
    MAX(w.week_start_date)     AS latest_week,
    COUNT(*)                   AS weeks_recorded
FROM analytics_classweeklystats w
WHERE w.week_start_date >= CURRENT_DATE - INTERVAL '28 days'
GROUP BY w.school_id, w.klass_id;

CREATE UNIQUE INDEX IF NOT EXISTS class_perf_mv_school_class_idx ON class_perf_mv (school_id, klass_id);

-- ============================================================
-- 3. student_trend_mv — 30-day rolling trend per student
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS student_trend_mv AS
SELECT
    d.school_id,
    d.student_id,
    COUNT(*)                   AS days_active,
    SUM(d.quizzes_taken)       AS quizzes_last_30d,
    AVG(d.avg_score)           AS avg_score_last_30d,
    SUM(d.time_spent_seconds)  AS time_spent_last_30d_secs,
    MAX(d.date)                AS last_active_date
FROM analytics_studentdailystats d
WHERE d.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY d.school_id, d.student_id;

CREATE UNIQUE INDEX IF NOT EXISTS student_trend_mv_school_stud_idx ON student_trend_mv (school_id, student_id);

-- ============================================================
-- Refresh schedule (Celery job — see backend/jobs/analytics.py)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY school_kpi_mv;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY class_perf_mv;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY student_trend_mv;
-- ============================================================
