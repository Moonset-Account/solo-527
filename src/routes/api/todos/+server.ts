import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { mockTodos } from '$lib/mock-data';
import { todoItems, users, brands, members } from '$lib/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import type { TodoItem } from '$lib/types';

function formatDate(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export const GET: RequestHandler = async ({ url }) => {
  const assigneeId = url.searchParams.get('assigneeId');
  const db = getDb();

  if (db) {
    try {
      const todos = assigneeId
        ? await db.select().from(todoItems).where(eq(todoItems.assigneeId, assigneeId))
        : await db.select().from(todoItems);

      const assigneeIds = todos.map((t) => t.assigneeId);
      const brandIds = todos.filter((t) => t.relatedBrandId).map((t) => t.relatedBrandId as string);
      const memberIds = todos.filter((t) => t.relatedMemberId).map((t) => t.relatedMemberId as string);

      const assigneeRows = assigneeIds.length > 0 ? await db.select().from(users).where(inArray(users.id, assigneeIds)) : [];
      const brandRows = brandIds.length > 0 ? await db.select().from(brands).where(inArray(brands.id, brandIds)) : [];
      const memberRows = memberIds.length > 0 ? await db.select().from(members).where(inArray(members.id, memberIds)) : [];

      const assigneeMap = new Map(assigneeRows.map((u) => [u.id, u]));
      const brandMap = new Map(brandRows.map((b) => [b.id, b]));
      const memberMap = new Map(memberRows.map((m) => [m.id, m]));

      const formattedTodos: TodoItem[] = todos.map((t) => {
        const assignee = assigneeMap.get(t.assigneeId);
        const brand = t.relatedBrandId ? brandMap.get(t.relatedBrandId) : undefined;
        const member = t.relatedMemberId ? memberMap.get(t.relatedMemberId) : undefined;
        return {
          id: t.id,
          title: t.title,
          type: t.type,
          priority: t.priority,
          materialAuthStatus: t.materialAuthStatus ?? undefined,
          invoiceCycle: t.invoiceCycle ?? undefined,
          subscriptionStatus: t.subscriptionStatus ?? undefined,
          relatedBrandId: t.relatedBrandId ?? undefined,
          relatedBrandName: brand?.name ?? '',
          relatedMemberId: t.relatedMemberId ?? undefined,
          relatedMemberName: member?.name,
          dueDate: formatDate(t.dueDate) ?? '',
          status: t.status,
          assigneeId: t.assigneeId,
          createdAt: formatDate(t.createdAt) ?? ''
        };
      });

      return json({ data: formattedTodos, ok: true });
    } catch {
      // fallback to mock
    }
  }

  let data = mockTodos;
  if (assigneeId) {
    data = mockTodos.filter((t) => t.assigneeId === assigneeId);
  }

  return json({ data, ok: true });
};
