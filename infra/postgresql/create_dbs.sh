#!/bin/bash
set -e

psql -v ON_ERROR_STOP=0 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  SELECT 'CREATE DATABASE superset_meta' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'superset_meta')\gexec
EOSQL

echo "[PostgreSQL] Database superset_meta ensured"
