import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { retentionAlerts, brands, users } from '$lib/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import { mockRetentionAlerts } from '$lib/mock-data';
import type { RetentionAlert } from '$lib/types';

function formatDate(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export const GET: RequestHandler = async () => {
  const db = getDb();

  if (db) {
    try {
      const alerts = await db.select().from(retentionAlerts);

      const brandIds = alerts.map((a) => a.brandId);
      const ownerIds = alerts.map((a) => a.ownerId);

      const brandRows = brandIds.length > 0 ? await db.select().from(brands).where(inArray(brands.id, brandIds)) : [];
      const ownerRows = ownerIds.length > 0 ? await db.select().from(users).where(inArray(users.id, ownerIds)) : [];

      const brandMap = new Map(brandRows.map((b) => [b.id, b]));
      const ownerMap = new Map(ownerRows.map((u) => [u.id, u]));

      const formattedAlerts: RetentionAlert[] = alerts.map((a) => {
        const brand = brandMap.get(a.brandId);
        const owner = ownerMap.get(a.ownerId);
        return {
          id: a.id,
          brandId: a.brandId,
          brandName: brand?.name ?? '',
          metric: a.metric,
          currentValue: String(a.currentValue),
          threshold: String(a.threshold),
          ownerId: a.ownerId,
          ownerName: owner?.name ?? '',
          notifiedAt: formatDate(a.notifiedAt),
          status: a.status,
          createdAt: formatDate(a.createdAt) ?? ''
        };
      });

      return json({ data: formattedAlerts, ok: true });
    } catch {
      // fallback to mock
    }
  }

  return json({ data: mockRetentionAlerts, ok: true });
};

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
