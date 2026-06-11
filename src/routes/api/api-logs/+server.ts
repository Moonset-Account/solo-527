import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { mockApiLogs } from '$lib/mock-data';
import { apiLogs } from '$lib/drizzle/schema';
import { desc } from 'drizzle-orm';
import type { ApiLog } from '$lib/types';

function formatDate(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export const GET: RequestHandler = async () => {
  const db = getDb();

  if (db) {
    try {
      const rows = await db.select().from(apiLogs).orderBy(desc(apiLogs.requestedAt));

      const formattedLogs: ApiLog[] = rows.map((l) => ({
        id: l.id,
        endpoint: l.endpoint,
        method: l.method,
        success: l.success,
        errorMessage: l.errorMessage,
        lastRetryAt: formatDate(l.lastRetryAt),
        retryCount: l.retryCount,
        requestedAt: formatDate(l.requestedAt) ?? ''
      }));

      return json({ data: formattedLogs, ok: true });
    } catch {
      // fallback to mock
    }
  }

  return json({ data: mockApiLogs, ok: true });
};
