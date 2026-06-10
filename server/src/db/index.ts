import { drizzle } from 'drizzle-orm/node-postgres';
import { Client, types } from 'pg';
import * as schema from './schema';

types.setTypeParser(1700, (val) => {
  if (val === null) return null;
  return parseFloat(val);
});

types.setTypeParser(1082, (val) => {
  if (val === null) return null;
  return val;
});

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/apartment',
});

await client.connect();

export const db = drizzle(client, { schema });
