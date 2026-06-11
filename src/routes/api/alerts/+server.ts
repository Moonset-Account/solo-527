import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { retentionAlerts } from '$drizzle/schema';
import { eq } from 'drizzle-orm';
import { mockRetentionAlerts } from '$lib/mock-data';

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as {
    id: string;
    action: 'notify' | 'acknowledge' | 'resolve';
  };

  const db = getDb();

  if (db) {
    try {
      const updateData: Record<string, unknown> = {};
      switch (body.action) {
        case 'notify':
          updateData.notifiedAt = new Date();
          break;
        case 'acknowledge':
          updateData.status = 'acknowledged';
          break;
        case 'resolve':
          updateData.status = 'resolved';
          break;
      }

      await db
        .update(retentionAlerts)
        .set(updateData)
        .where(eq(retentionAlerts.id, body.id));

      const rows = await db.select().from(retentionAlerts).where(eq(retentionAlerts.id, body.id));
      if (rows.length > 0) {
        return json({ data: rows[0], ok: true });
      }
    } catch {
      // fallback to in-memory
    }
  }

  const idx = mockRetentionAlerts.findIndex((a) => a.id === body.id);
  if (idx < 0) {
    return json({ error: '预警不存在' }, { status: 404 });
  }

  switch (body.action) {
    case 'notify':
      mockRetentionAlerts[idx] = {
        ...mockRetentionAlerts[idx],
        notifiedAt: new Date().toISOString()
      };
      break;
    case 'acknowledge':
      mockRetentionAlerts[idx] = {
        ...mockRetentionAlerts[idx],
        status: 'acknowledged'
      };
      break;
    case 'resolve':
      mockRetentionAlerts[idx] = {
        ...mockRetentionAlerts[idx],
        status: 'resolved'
      };
      break;
  }

  return json({ data: mockRetentionAlerts[idx], ok: true });
};
