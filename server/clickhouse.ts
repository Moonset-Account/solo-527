import { createClient } from '@clickhouse/client'
import type { ClickHouseClient } from '@clickhouse/client'
import { CLICKHOUSE_DDL } from './clickhouse-schema.js'
import { initDatabase } from './db.js'
import type { ClickHouseDB } from './types.js'

const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || 'http://localhost:8123'
const CLICKHOUSE_DB = process.env.CLICKHOUSE_DB || 'waste_classification'

let chClient: ClickHouseClient | null = null
let isConnected = false
let fallbackDb: ClickHouseDB | null = null

export async function getClickHouseClient(): Promise<{ client: ClickHouseClient | null; connected: boolean }> {
  if (isConnected && chClient) return { client: chClient, connected: true }

  try {
    chClient = createClient({
      url: CLICKHOUSE_URL,
      database: CLICKHOUSE_DB,
    })
    const pingResult = await chClient.ping()
    if (!pingResult.success) {
      throw new Error(`Ping failed: ${JSON.stringify(pingResult)}`)
    }
    isConnected = true
    console.log(`[ClickHouse] Connected to ${CLICKHOUSE_URL}/${CLICKHOUSE_DB}`)
    return { client: chClient, connected: true }
  } catch (e) {
    console.log(`[ClickHouse] Connection failed (${CLICKHOUSE_URL}), using in-memory fallback`)
    console.log(`[ClickHouse] To use real ClickHouse: set CLICKHOUSE_URL and ensure server is running`)
    isConnected = false
    chClient = null
    return { client: null, connected: false }
  }
}

export async function initClickHouse(): Promise<boolean> {
  const { client, connected } = await getClickHouseClient()

  if (!connected || !client) {
    if (!fallbackDb) {
      fallbackDb = await initDatabase()
    }
    return false
  }

  try {
    console.log('[ClickHouse] Creating database and tables...')
    await client.command({
      query: `CREATE DATABASE IF NOT EXISTS ${CLICKHOUSE_DB}`,
    })

    const statements = CLICKHOUSE_DDL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const stmt of statements) {
      try {
        await client.command({ query: stmt })
      } catch (e: any) {
        if (!e.message?.includes('already exists') && !e.message?.includes('MATERIALIZED VIEW')) {
          console.warn(`[ClickHouse] DDL warning: ${e.message?.substring(0, 100)}`)
        }
      }
    }

    console.log('[ClickHouse] Tables created successfully')

    const result = await client.query({
      query: `SELECT count() AS cnt FROM bin_points`,
      format: 'JSONEachRow',
    })
    const rows = await result.json<Array<{ cnt: string }>>()
    const count = parseInt(rows[0]?.cnt || '0')

    if (count === 0) {
      console.log('[ClickHouse] Tables are empty, inserting seed data...')
      const seedData = await initDatabase()
      await insertSeedData(client, seedData)
      fallbackDb = seedData
    } else {
      console.log(`[ClickHouse] Tables already have ${count} rows in bin_points`)
    }

    return true
  } catch (e: any) {
    console.error(`[ClickHouse] Init failed: ${e.message?.substring(0, 200)}`)
    if (!fallbackDb) {
      fallbackDb = await initDatabase()
    }
    return false
  }
}

async function insertSeedData(client: ClickHouseClient, data: ClickHouseDB) {
  const tables: Array<{ name: string; rows: any[] }> = [
    { name: 'communities', rows: data.communities },
    { name: 'bin_points', rows: data.binPoints },
    { name: 'holiday_schedules', rows: data.holidays },
    { name: 'misuse_records', rows: data.misuseRecords },
    { name: 'full_alerts', rows: data.fullAlerts },
    { name: 'collection_logs', rows: data.collectionLogs },
    { name: 'inspection_photos', rows: data.inspectionPhotos },
    { name: 'audit_logs', rows: data.auditLogs },
    { name: 'return_visits', rows: data.returnVisits },
  ]

  for (const table of tables) {
    if (table.rows.length === 0) continue
    try {
      await client.insert({
        table: table.name,
        values: table.rows,
        format: 'JSONEachRow',
      })
      console.log(`[ClickHouse] Inserted ${table.rows.length} rows into ${table.name}`)
    } catch (e: any) {
      console.warn(`[ClickHouse] Insert into ${table.name} warning: ${e.message?.substring(0, 150)}`)
    }
  }
}

export async function queryClickHouse<T = any>(
  sql: string,
  params: Record<string, any> = {}
): Promise<{ data: T[]; fromClickHouse: boolean; sql: string }> {
  const { client, connected } = await getClickHouseClient()

  if (connected && client) {
    try {
      let finalSql = sql
      Object.entries(params).forEach(([key, value]) => {
        const placeholder = `{${key}:String}`
        const placeholder2 = `{${key}:Float64}`
        const placeholder3 = `{${key}:UInt32}`
        const placeholder4 = `{${key}:Date}`
        const strValue = typeof value === 'string' ? `'${value}'` : String(value)
        finalSql = finalSql.replace(placeholder, strValue)
        finalSql = finalSql.replace(placeholder2, String(value))
        finalSql = finalSql.replace(placeholder3, String(value))
        finalSql = finalSql.replace(placeholder4, `'${value}'`)
      })

      const result = await client.query({
        query: finalSql,
        format: 'JSONEachRow',
      })
      const data = await result.json<T[]>()
      return { data, fromClickHouse: true, sql }
    } catch (e: any) {
      console.warn(`[ClickHouse] Query failed, falling back: ${e.message?.substring(0, 100)}`)
    }
  }

  return { data: [] as T[], fromClickHouse: false, sql }
}

export function getFallbackDb(): ClickHouseDB {
  if (!fallbackDb) {
    throw new Error('Database not initialized')
  }
  return fallbackDb
}
