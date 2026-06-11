import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '$lib/drizzle/schema';

const _schema = schema;
type SchemaType = typeof _schema;
const _dbInstance = drizzle({ client: {} as any, schema: _schema });
type Database = typeof _dbInstance;

let _db: Database | null = null;
let _pool: pg.Pool | null = null;
let _dbAvailable: boolean | null = null;
let _initPromise: Promise<boolean> | null = null;

function initDb() {
  try {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/podcast_delivery';

    _pool = new pg.Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 10000
    });

    _db = drizzle(_pool, { schema });

    _initPromise = _pool
      .query('SELECT 1')
      .then(() => {
        _dbAvailable = true;
        console.log('[db] PostgreSQL connected');
        return true;
      })
      .catch(() => {
        _dbAvailable = false;
        console.log('[db] PostgreSQL unavailable, using in-memory fallback');
        return false;
      });
  } catch (e) {
    _dbAvailable = false;
    _initPromise = Promise.resolve(false);
    console.log('[db] Failed to initialize PostgreSQL, using in-memory fallback');
  }
}

export async function ensureDbAvailable(): Promise<boolean> {
  if (_dbAvailable !== null) {
    return _dbAvailable;
  }
  if (_initPromise) {
    return _initPromise;
  }
  return false;
}

export function isDbAvailable(): boolean {
  return _dbAvailable === true;
}

export function getDb() {
  if (_dbAvailable === true && _db) {
    return _db;
  }
  return null;
}

export { _pool as pool };

initDb();
