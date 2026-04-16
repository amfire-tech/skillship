<!--
File:    data/reports_sql/README.md
Purpose: Ad-hoc analytics SQL — read-only, safe to run in prod read-replica.
Owner:   Vishal
-->

# Ad-hoc analytics queries

Drop `.sql` files here for one-off reports (e.g. "revenue per plan per month").
Name convention: `YYYY-MM-DD_short_description.sql`.

Rule: **never** run DDL / DML here. If a query becomes permanent, move it to
`migrations_raw/003_analytics_views.sql` as a materialized view instead.
