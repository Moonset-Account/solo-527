import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let dbError: Error | null = null;

export function getDb() {
	if (dbInstance) return dbInstance;
	if (dbError) throw dbError;

	try {
		const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL;

		if (!databaseUrl) {
			dbError = new Error('DATABASE_URL is not set');
			throw dbError;
		}

		const client = postgres(databaseUrl, {
			connect_timeout: 5,
			max: 1
		});

		dbInstance = drizzle(client, { schema });
		return dbInstance;
	} catch (err) {
		dbError = err instanceof Error ? err : new Error(String(err));
		throw dbError;
	}
}

export function isDbAvailable(): boolean {
	try {
		getDb();
		return true;
	} catch {
		return false;
	}
}

export { schema };
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
	get: function (target, prop) {
		const database = getDb();
		return (database as never)[prop];
	}
});
