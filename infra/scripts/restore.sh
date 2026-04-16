#!/usr/bin/env bash
# File:    infra/scripts/restore.sh
# Purpose: Restore a pg_dump backup from S3 into a target database (staging or recovery).
# Why:     A backup you've never restored is a backup you do not have.
# Owner:   Navanish
# TODO:    aws s3 cp s3://skillship-backups/$1 - | gunzip | psql $TARGET_DATABASE_URL
