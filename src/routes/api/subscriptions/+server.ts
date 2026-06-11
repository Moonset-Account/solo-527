import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { mockSubscriptions } from '$lib/mock-data';
import { memberSubscriptions, members, brands } from '$lib/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import type { MemberSubscription } from '$lib/types';

function formatDate(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function formatDateOnly(value: Date | string | null): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return typeof value === 'string' ? value.slice(0, 10) : value;
}

export const GET: RequestHandler = async () => {
  const db = getDb();

  if (db) {
    try {
      const subs = await db.select().from(memberSubscriptions);

      const memberIds = subs.map((s) => s.memberId);
      const brandIds = subs.map((s) => s.brandId);

      const memberRows = memberIds.length > 0 ? await db.select().from(members).where(inArray(members.id, memberIds)) : [];
      const brandRows = brandIds.length > 0 ? await db.select().from(brands).where(inArray(brands.id, brandIds)) : [];

      const memberMap = new Map(memberRows.map((m) => [m.id, m]));
      const brandMap = new Map(brandRows.map((b) => [b.id, b]));

      const formattedSubscriptions: MemberSubscription[] = subs.map((s) => {
        const member = memberMap.get(s.memberId);
        const brand = brandMap.get(s.brandId);
        return {
          id: s.id,
          memberId: s.memberId,
          memberName: member?.name ?? '',
          brandId: s.brandId,
          brandName: brand?.name ?? '',
          planType: s.planType,
          materialAuthStatus: s.materialAuthStatus,
          invoiceCycle: s.invoiceCycle,
          subscriptionStatus: s.subscriptionStatus,
          startDate: formatDateOnly(s.startDate) ?? '',
          endDate: formatDateOnly(s.endDate) ?? '',
          createdAt: formatDate(s.createdAt) ?? ''
        };
      });

      return json({ data: formattedSubscriptions, ok: true });
    } catch {
      // fallback to mock
    }
  }

  return json({ data: mockSubscriptions, ok: true });
};
