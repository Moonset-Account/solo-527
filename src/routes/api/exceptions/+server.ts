import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { mockExceptions } from '$lib/mock-data';
import { exceptions, brands, users } from '$lib/drizzle/schema';
import { inArray } from 'drizzle-orm';
import type { ExceptionRecord } from '$lib/types';

function formatDate(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export const GET: RequestHandler = async () => {
  const db = getDb();

  if (db) {
    try {
      const excs = await db.select().from(exceptions);

      const brandIds = excs.map((e) => e.brandId);
      const hostIds = excs.filter((e) => e.hostId).map((e) => e.hostId as string);

      const brandRows = brandIds.length > 0 ? await db.select().from(brands).where(inArray(brands.id, brandIds)) : [];
      const hostRows = hostIds.length > 0 ? await db.select().from(users).where(inArray(users.id, hostIds)) : [];

      const brandMap = new Map(brandRows.map((b) => [b.id, b]));
      const hostMap = new Map(hostRows.map((u) => [u.id, u]));

      const formattedExceptions: ExceptionRecord[] = excs.map((e) => {
        const brand = brandMap.get(e.brandId);
        const host = e.hostId ? hostMap.get(e.hostId) : undefined;
        return {
          id: e.id,
          brandId: e.brandId,
          brandName: brand?.name ?? '',
          title: e.title,
          description: e.description,
          category: e.category,
          status: e.status,
          result: e.result,
          remark: e.remark,
          hostId: e.hostId,
          hostName: host?.name ?? null,
          resolvedAt: formatDate(e.resolvedAt),
          createdAt: formatDate(e.createdAt) ?? ''
        };
      });

      return json({ data: formattedExceptions, ok: true });
    } catch {
      // fallback to mock
    }
  }

  return json({ data: mockExceptions, ok: true });
};
