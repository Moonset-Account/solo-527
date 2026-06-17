import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/solar_dashboard';

const client = postgres(DATABASE_URL, { max: 1 });
export const db = drizzle(client, { schema });
export type DB = typeof db;
