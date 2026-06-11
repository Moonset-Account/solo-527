import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { apiLogs } from '$drizzle/schema';
import { eq } from 'drizzle-orm';
import { mockApiLogs } from '$lib/mock-data';

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as { id: string };

  const db = getDb();

  if (db) {
    try {
      const rows = await db.select().from(apiLogs).where(eq(apiLogs.id, body.id));
      if (rows.length > 0) {
        const current = rows[0];
        await db
          .update(apiLogs)
          .set({
            lastRetryAt: new Date(),
            retryCount: current.retryCount + 1
          })
          .where(eq(apiLogs.id, body.id));

        const updated = await db.select().from(apiLogs).where(eq(apiLogs.id, body.id));
        if (updated.length > 0) {
          return json({ data: updated[0], ok: true });
        }
      }
    } catch {
      // fallback to in-memory
    }
  }

  const idx = mockApiLogs.findIndex((l) => l.id === body.id);
  if (idx < 0) {
    return json({ error: '日志不存在' }, { status: 404 });
  }

  mockApiLogs[idx] = {
    ...mockApiLogs[idx],
    lastRetryAt: new Date().toISOString(),
    retryCount: mockApiLogs[idx].retryCount + 1
  };

  return json({ data: mockApiLogs[idx], ok: true });
};
