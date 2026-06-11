import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '$drizzle/schema';

let _db: ReturnType<typeof drizzle> | null = null;
let dbAvailable = false;

try {
  const pool = new pg.Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/podcast_delivery',
    max: 5
  });

  pool.query('SELECT 1').then(() => {
    dbAvailable = true;
    console.log('[db] PostgreSQL connected');
  }).catch(() => {
    console.log('[db] PostgreSQL unavailable, using in-memory fallback');
  });

  _db = drizzle(pool, { schema });
} catch {
  console.log('[db] Failed to initialize PostgreSQL, using in-memory fallback');
}

export function getDb() {
  return dbAvailable ? _db : null;
}

export function isDbAvailable() {
  return dbAvailable;
}

export const db = _db;
