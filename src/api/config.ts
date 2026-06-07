export interface DatabaseConnectionConfig {
  id: number
  name: string
  backend: "clickhouse" | "postgresql"
  host: string
  port: number
  database: string
  username: string
  password: string
  schema: string
  connectTimeoutMs: number
  poolSize: number
}

export const CLICKHOUSE_CONFIG: DatabaseConnectionConfig = {
  id: 1,
  name: "clickhouse-analytics",
  backend: "clickhouse",
  host: "ch-analytics.internal",
  port: 8123,
  database: "analytics",
  username: "dashboard_reader",
  password: "***REDACTED***",
  schema: "analytics",
  connectTimeoutMs: 5000,
  poolSize: 10,
}

export const POSTGRESQL_CONFIG: DatabaseConnectionConfig = {
  id: 2,
  name: "postgresql-main",
  backend: "postgresql",
  host: "pg-meta.internal",
  port: 5432,
  database: "return_dashboard",
  username: "dashboard_meta",
  password: "***REDACTED***",
  schema: "public",
  connectTimeoutMs: 3000,
  poolSize: 5,
}

export const SUPERSET_CONFIG = {
  baseUrl: "https://superset.internal",
  apiVersion: "v1",
  cacheTtlMs: 60000,
  exportChunkSize: 10000,
  defaultRole: "operator" as const,
}
