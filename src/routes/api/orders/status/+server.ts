import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { orders } from '$lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { mockOrders } from '$lib/mock-data';
import type { Order } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as {
    id: string;
    status: Order['status'];
  };

  const db = getDb();

  if (db) {
    try {
      await db
        .update(orders)
        .set({ status: body.status })
        .where(eq(orders.id, body.id));

      const rows = await db.select().from(orders).where(eq(orders.id, body.id));
      if (rows.length > 0) {
        return json({ data: rows[0], ok: true });
      }
    } catch {
      // fallback to in-memory
    }
  }

  const idx = mockOrders.findIndex((o) => o.id === body.id);
  if (idx < 0) {
    return json({ error: '订单不存在' }, { status: 404 });
  }

  mockOrders[idx] = { ...mockOrders[idx], status: body.status };

  return json({ data: mockOrders[idx], ok: true });
};
