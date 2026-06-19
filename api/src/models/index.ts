import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  const result = await pool.query(text, params)
  const duration = Date.now() - start
  return result
}

export { pool }
