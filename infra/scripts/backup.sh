#!/usr/bin/env bash
# File:    infra/scripts/backup.sh
# Purpose: Daily pg_dump of the production database to S3.
# Why:     Backups are our last line of defence against data loss.
# Owner:   Navanish
# TODO:    pg_dump $DATABASE_URL | gzip | aws s3 cp - s3://skillship-backups/$(date +%F).sql.gz
