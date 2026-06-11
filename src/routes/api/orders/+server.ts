import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { mockOrders } from '$lib/mock-data';
import { orders, members, brands, deliveryNodes, users } from '$lib/drizzle/schema';
import { inArray, asc } from 'drizzle-orm';
import type { Order } from '$lib/types';

function formatDate(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export const GET: RequestHandler = async () => {
  const db = getDb();

  if (db) {
    try {
      const orderRows = await db.select().from(orders);

      const orderIds = orderRows.map((o) => o.id);
      const memberIds = orderRows.map((o) => o.memberId);
      const brandIds = orderRows.map((o) => o.brandId);

      const memberRows = memberIds.length > 0 ? await db.select().from(members).where(inArray(members.id, memberIds)) : [];
      const brandRows = brandIds.length > 0 ? await db.select().from(brands).where(inArray(brands.id, brandIds)) : [];

      const nodeRows = orderIds.length > 0
        ? await db.select().from(deliveryNodes).where(inArray(deliveryNodes.orderId, orderIds)).orderBy(asc(deliveryNodes.sortOrder))
        : [];

      const assigneeIds = nodeRows.filter((n) => n.assigneeId).map((n) => n.assigneeId as string);
      const assigneeRows = assigneeIds.length > 0 ? await db.select().from(users).where(inArray(users.id, assigneeIds)) : [];

      const memberMap = new Map(memberRows.map((m) => [m.id, m]));
      const brandMap = new Map(brandRows.map((b) => [b.id, b]));
      const assigneeMap = new Map(assigneeRows.map((u) => [u.id, u]));

      const nodesByOrder = new Map<string, typeof nodeRows>();
      for (const node of nodeRows) {
        if (!nodesByOrder.has(node.orderId)) {
          nodesByOrder.set(node.orderId, []);
        }
        nodesByOrder.get(node.orderId)!.push(node);
      }

      const formattedOrders: Order[] = orderRows.map((o) => {
        const member = memberMap.get(o.memberId);
        const brand = brandMap.get(o.brandId);
        const nodes = nodesByOrder.get(o.id) ?? [];

        return {
          id: o.id,
          orderNo: o.orderNo,
          memberId: o.memberId,
          memberName: member?.name ?? '',
          brandId: o.brandId,
          brandName: brand?.name ?? '',
          amount: String(o.amount),
          status: o.status,
          paidAt: formatDate(o.paidAt),
          createdAt: formatDate(o.createdAt) ?? '',
          deliveryNodes: nodes.map((node) => {
            const assignee = node.assigneeId ? assigneeMap.get(node.assigneeId) : undefined;
            return {
              id: node.id,
              orderId: node.orderId,
              name: node.name,
              status: node.status,
              assigneeId: node.assigneeId,
              assigneeName: assignee?.name ?? null,
              completedAt: formatDate(node.completedAt),
              deadline: formatDate(node.deadline) ?? '',
              sortOrder: node.sortOrder
            };
          })
        };
      });

      return json({ data: formattedOrders, ok: true });
    } catch {
      // fallback to mock
    }
  }

  return json({ data: mockOrders, ok: true });
};
