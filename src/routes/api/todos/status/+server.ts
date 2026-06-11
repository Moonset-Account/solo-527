import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { todoItems } from '$drizzle/schema';
import { eq } from 'drizzle-orm';
import { mockTodos } from '$lib/mock-data';

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as {
    id: string;
    status: 'pending' | 'processing' | 'done';
  };

  const db = getDb();

  if (db) {
    try {
      await db
        .update(todoItems)
        .set({ status: body.status })
        .where(eq(todoItems.id, body.id));

      const rows = await db.select().from(todoItems).where(eq(todoItems.id, body.id));
      if (rows.length > 0) {
        return json({ data: rows[0], ok: true });
      }
    } catch {
      // fallback to in-memory
    }
  }

  const idx = mockTodos.findIndex((t) => t.id === body.id);
  if (idx < 0) {
    return json({ error: '待办不存在' }, { status: 404 });
  }

  mockTodos[idx] = {
    ...mockTodos[idx],
    status: body.status
  };

  return json({ data: mockTodos[idx], ok: true });
};
