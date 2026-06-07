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
  host: import.meta.env.VITE_CLICKHOUSE_HOST ?? "localhost",
  port: Number(import.meta.env.VITE_CLICKHOUSE_PORT ?? "8123"),
  database: import.meta.env.VITE_CLICKHOUSE_DB ?? "analytics",
  username: import.meta.env.VITE_CLICKHOUSE_USER ?? "dashboard_reader",
  password: import.meta.env.VITE_CLICKHOUSE_PASSWORD ?? "ch_secure_2024",
  schema: "analytics",
  connectTimeoutMs: 5000,
  poolSize: 10,
}

export const POSTGRESQL_CONFIG: DatabaseConnectionConfig = {
  id: 2,
  name: "postgresql-main",
  backend: "postgresql",
  host: import.meta.env.VITE_PG_HOST ?? "localhost",
  port: Number(import.meta.env.VITE_PG_PORT ?? "5432"),
  database: import.meta.env.VITE_PG_DB ?? "return_dashboard",
  username: import.meta.env.VITE_PG_USER ?? "dashboard_meta",
  password: import.meta.env.VITE_PG_PASSWORD ?? "pg_secure_2024",
  schema: "public",
  connectTimeoutMs: 3000,
  poolSize: 5,
}

export const SUPERSET_CONFIG = {
  baseUrl: import.meta.env.VITE_SUPERSET_URL ?? "http://localhost:8088",
  apiVersion: "v1",
  cacheTtlMs: 60000,
  exportChunkSize: 10000,
  defaultRole: "operator" as const,
}
