import { CLICKHOUSE_CONFIG, POSTGRESQL_CONFIG, SUPERSET_CONFIG } from "./config"

export type ConnectionStatus = "connected" | "disconnected" | "fallback"

export interface DatabaseClient {
  backend: "clickhouse" | "postgresql" | "superset"
  status: ConnectionStatus
  lastPingAt: string | null
  ping(): Promise<boolean>
  getStatus(): { backend: string; status: ConnectionStatus; host: string; port: number; database: string; lastPingAt: string | null }
}

class ClickHouseClient implements DatabaseClient {
  backend: "clickhouse" = "clickhouse"
  status: ConnectionStatus = "disconnected"
  lastPingAt: string | null = null

  async ping(): Promise<boolean> {
    try {
      const url = `http://${CLICKHOUSE_CONFIG.host}:${CLICKHOUSE_CONFIG.port}/ping`
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), CLICKHOUSE_CONFIG.connectTimeoutMs)
      const res = await fetch(url, { signal: controller.signal, method: "GET" })
      clearTimeout(timeout)
      if (res.ok) {
        this.status = "connected"
        this.lastPingAt = new Date().toISOString()
        return true
      }
    } catch {
      console.warn(`[ClickHouse] Connection failed to ${CLICKHOUSE_CONFIG.host}:${CLICKHOUSE_CONFIG.port}, using in-memory fallback`)
    }
    this.status = "fallback"
    this.lastPingAt = new Date().toISOString()
    return false
  }

  getStatus() {
    return {
      backend: this.backend,
      status: this.status,
      host: CLICKHOUSE_CONFIG.host,
      port: CLICKHOUSE_CONFIG.port,
      database: CLICKHOUSE_CONFIG.database,
      lastPingAt: this.lastPingAt,
    }
  }
}

class PostgreSQLClient implements DatabaseClient {
  backend: "postgresql" = "postgresql"
  status: ConnectionStatus = "disconnected"
  lastPingAt: string | null = null

  async ping(): Promise<boolean> {
    try {
      const url = `http://${POSTGRESQL_CONFIG.host}:${POSTGRESQL_CONFIG.port}`
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), POSTGRESQL_CONFIG.connectTimeoutMs)
      const res = await fetch(url, { signal: controller.signal, method: "GET" })
      clearTimeout(timeout)
      if (res.ok || res.status === 403 || res.status === 401) {
        this.status = "connected"
        this.lastPingAt = new Date().toISOString()
        return true
      }
    } catch {
      console.warn(`[PostgreSQL] Connection failed to ${POSTGRESQL_CONFIG.host}:${POSTGRESQL_CONFIG.port}, using in-memory fallback`)
    }
    this.status = "fallback"
    this.lastPingAt = new Date().toISOString()
    return false
  }

  getStatus() {
    return {
      backend: this.backend,
      status: this.status,
      host: POSTGRESQL_CONFIG.host,
      port: POSTGRESQL_CONFIG.port,
      database: POSTGRESQL_CONFIG.database,
      lastPingAt: this.lastPingAt,
    }
  }
}

class SupersetApiClient implements DatabaseClient {
  backend: "superset" = "superset"
  status: ConnectionStatus = "disconnected"
  lastPingAt: string | null = null

  async ping(): Promise<boolean> {
    try {
      const url = `${SUPERSET_CONFIG.baseUrl}/health`
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(url, { signal: controller.signal, method: "GET" })
      clearTimeout(timeout)
      if (res.ok) {
        this.status = "connected"
        this.lastPingAt = new Date().toISOString()
        return true
      }
    } catch {
      console.warn(`[Superset] Connection failed to ${SUPERSET_CONFIG.baseUrl}, using in-memory fallback`)
    }
    this.status = "fallback"
    this.lastPingAt = new Date().toISOString()
    return false
  }

  getStatus() {
    return {
      backend: this.backend,
      status: this.status,
      host: SUPERSET_CONFIG.baseUrl,
      port: 8088,
      database: "superset",
      lastPingAt: this.lastPingAt,
    }
  }
}

export const chClient = new ClickHouseClient()
export const pgClient = new PostgreSQLClient()
export const supersetApi = new SupersetApiClient()

export async function initializeConnections(): Promise<{
  clickhouse: ConnectionStatus
  postgresql: ConnectionStatus
  superset: ConnectionStatus
}> {
  const [chStatus, pgStatus, ssStatus] = await Promise.all([
    chClient.ping().then((ok) => ok ? "connected" as ConnectionStatus : "fallback" as ConnectionStatus),
    pgClient.ping().then((ok) => ok ? "connected" as ConnectionStatus : "fallback" as ConnectionStatus),
    supersetApi.ping().then((ok) => ok ? "connected" as ConnectionStatus : "fallback" as ConnectionStatus),
  ])

  console.log("[DB Clients] Connection status:", { clickhouse: chStatus, postgresql: pgStatus, superset: ssStatus })

  return { clickhouse: chStatus, postgresql: pgStatus, superset: ssStatus }
}
