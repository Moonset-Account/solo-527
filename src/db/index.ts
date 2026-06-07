import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  conn: Pool | undefined;
};

let conn: Pool | null = null;

try {
  if (process.env.DATABASE_URL) {
    conn = globalForDb.conn ?? new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
    if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn;
  } else {
    console.warn('DATABASE_URL not set, database features will be disabled');
  }
} catch (e) {
  console.warn('Failed to initialize database connection:', e);
  conn = null;
}

export const db = conn ? drizzle(conn, { schema }) : null;
export const isDbAvailable = () => conn !== null && process.env.DATABASE_URL !== undefined;
