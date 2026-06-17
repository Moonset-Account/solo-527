import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import type { NewUser } from '../db/schema';

export async function findUserByEmail(email: string): Promise<typeof users.$inferSelect | null> {
	const results = await db.select().from(users).where(eq(users.email, email)).limit(1);
	return results[0] || null;
}

export async function findUserById(id: string): Promise<typeof users.$inferSelect | null> {
	const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return results[0] || null;
}

export async function createUser(data: NewUser): Promise<typeof users.$inferSelect> {
	const [result] = await db.insert(users).values(data).returning();
	return result;
}

export async function updateUser(
	id: string,
	data: Partial<typeof users.$inferInsert>
): Promise<typeof users.$inferSelect | null> {
	const [result] = await db.update(users).set(data).where(eq(users.id, id)).returning();
	return result || null;
}

export async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password + process.env.SESSION_SECRET);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	const computedHash = await hashPassword(password);
	return computedHash === hash;
}

export async function getUsers(): Promise<(typeof users.$inferSelect)[]> {
	return db.select().from(users);
}
