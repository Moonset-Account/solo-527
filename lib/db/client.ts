import postgres from 'postgres'

let sql: postgres.Sql | null = null

export function getDbClient(): postgres.Sql {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/logistics_db'
    sql = postgres(databaseUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  }
  return sql
}

export async function testDbConnection(): Promise<boolean> {
  try {
    const client = getDbClient()
    await client`SELECT 1`
    return true
  } catch (e) {
    console.warn('Database connection failed, falling back to mock data:', (e as Error).message)
    return false
  }
}

export async function isPostgisAvailable(): Promise<boolean> {
  try {
    const client = getDbClient()
    const result = await client`SELECT PostGIS_version() as version`
    return result.length > 0
  } catch (e) {
    console.warn('PostGIS not available:', (e as Error).message)
    return false
  }
}

export { sql }
