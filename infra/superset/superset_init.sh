#!/bin/bash
set -e

superset db upgrade
superset fab create-admin --username admin --firstname Admin --lastname User --email admin@return-dashboard.local --password admin123 || true
superset init

superset set-database-uri --database-name "clickhouse-analytics" "clickhouse+native://dashboard_reader:ch_secure_2024@clickhouse:9000/analytics" || true
superset set-database-uri --database-name "postgresql-main" "postgresql+psycopg2://dashboard_meta:pg_secure_2024@postgres:5432/return_dashboard" || true

echo "[Superset] Initialization complete. Starting server on port 8088..."
gunicorn --bind 0.0.0.0:8088 --workers 4 --timeout 120 "superset.app:create_app()"
