import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 
        'postgresql://postgres:postgres@localhost:5432/pharmacy_analytics',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  return pool;
}

export async function queryDb(text: string, params?: any[]) {
  const pool = getDbPool();
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text: text.substring(0, 80), duration, rows: res.rowCount });
  return res;
}

export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await queryDb('SELECT 1 as health_check');
    return true;
  } catch (e) {
    console.warn('Database not available, falling back to mock data');
    return false;
  }
}
