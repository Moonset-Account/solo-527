import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { exceptions } from '$drizzle/schema';
import { eq } from 'drizzle-orm';
import { mockExceptions } from '$lib/mock-data';
import type { ExceptionRecord } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as {
    id: string;
    result: string;
    remark?: string;
    hostId: string;
    hostName: string;
  };

  const db = getDb();

  if (db) {
    try {
      await db
        .update(exceptions)
        .set({
          status: 'resolved',
          result: body.result,
          remark: body.remark || null,
          hostId: body.hostId,
          resolvedAt: new Date()
        })
        .where(eq(exceptions.id, body.id));

      const rows = await db.select().from(exceptions).where(eq(exceptions.id, body.id));
      if (rows.length > 0) {
        return json({ data: rows[0], ok: true });
      }
    } catch {
      // fallback to in-memory
    }
  }

  const idx = mockExceptions.findIndex((e) => e.id === body.id);
  if (idx < 0) {
    return json({ error: '异常记录不存在' }, { status: 404 });
  }

  mockExceptions[idx] = {
    ...mockExceptions[idx],
    status: 'resolved',
    result: body.result,
    remark: body.remark || null,
    hostId: body.hostId,
    hostName: body.hostName,
    resolvedAt: new Date().toISOString()
  } as ExceptionRecord;

  return json({ data: mockExceptions[idx], ok: true });
};
