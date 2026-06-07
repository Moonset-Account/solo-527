import { CLICKHOUSE_CONFIG, POSTGRESQL_CONFIG, SUPERSET_CONFIG } from "./config"
import { ConnectionStatus } from "./client"

export type ConnectionStatusType = ConnectionStatus

export interface QuerySource {
  source: "superset_api" | "clickhouse_http" | "in_memory"
  cached: boolean
  latencyMs: number
}

export interface QueryResult<T> {
  data: T
  source: QuerySource
}

class ClickHouseHttpClient {
  async query(sql: string, params?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const url = `http://${CLICKHOUSE_CONFIG.host}:${CLICKHOUSE_CONFIG.port}/`
    const body = sql
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), CLICKHOUSE_CONFIG.connectTimeoutMs)
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "X-ClickHouse-User": CLICKHOUSE_CONFIG.username,
          "X-ClickHouse-Key": CLICKHOUSE_CONFIG.password,
          "X-ClickHouse-Format": "JSON",
        },
        body,
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (res.ok) {
        const json = await res.json()
        return json.data ?? []
      }
      throw new Error(`ClickHouse HTTP ${res.status}`)
    } catch (err) {
      clearTimeout(timeout)
      throw err
    }
  }
}

class SupersetHttpClient {
  private csrfToken: string | null = null

  async queryDataset(datasetName: string, queryParams: Record<string, string>): Promise<unknown[]> {
    const url = `${SUPERSET_CONFIG.baseUrl}/api/${SUPERSET_CONFIG.apiVersion}/dataset/${datasetName}/query`
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(queryParams),
    })
    if (res.ok) {
      const json = await res.json()
      return json.data?.records ?? []
    }
    throw new Error(`Superset API ${res.status}`)
  }

  async exportDatasetCSV(datasetName: string, queryParams: Record<string, string>): Promise<Blob> {
    const url = `${SUPERSET_CONFIG.baseUrl}/api/${SUPERSET_CONFIG.apiVersion}/dataset/${datasetName}/export`
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(queryParams),
    })
    if (res.ok) {
      return await res.blob()
    }
    throw new Error(`Superset CSV export ${res.status}`)
  }

  async fetchCsrfToken(): Promise<string> {
    if (this.csrfToken) return this.csrfToken
    const url = `${SUPERSET_CONFIG.baseUrl}/api/${SUPERSET_CONFIG.apiVersion}/security/csrf_token/`
    const res = await fetch(url, { credentials: "include" })
    if (res.ok) {
      const json = await res.json()
      this.csrfToken = json.result ?? ""
      return this.csrfToken ?? ""
    }
    return ""
  }
}

export const chHttp = new ClickHouseHttpClient()
export const supersetHttp = new SupersetHttpClient()
