import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (pool) return pool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  const config: PoolConfig = {
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
  pool = new Pool(config);
  pool.on('error', (err) => {
    console.error('PostGIS pool error:', err.message);
  });
  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const p = getPool();
  if (!p) throw new Error('DATABASE_URL not configured; PostGIS unavailable');
  const start = Date.now();
  const result = await p.query(text, params);
  const duration = Date.now() - start;
  console.log(`[PostGIS] ${text.slice(0, 80)}… ${duration}ms ${result.rowCount}rows`);
  return result;
}

export function isPostGISAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
