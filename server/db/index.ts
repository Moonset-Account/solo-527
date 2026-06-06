import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/store_inspection',
});

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export async function getClient() {
  return pool.connect();
}
