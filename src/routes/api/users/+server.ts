import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { mockUsers } from '$lib/mock-data';
import { users } from '$lib/drizzle/schema';
import type { User } from '$lib/types';

function formatDate(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export const GET: RequestHandler = async () => {
  const db = getDb();

  if (db) {
    try {
      const rows = await db.select().from(users);

      const formattedUsers: User[] = rows.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        avatarUrl: u.avatarUrl,
        createdAt: formatDate(u.createdAt) ?? ''
      }));

      return json({ data: formattedUsers, ok: true });
    } catch {
      // fallback to mock
    }
  }

  return json({ data: mockUsers, ok: true });
};
