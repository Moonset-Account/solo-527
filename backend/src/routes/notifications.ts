import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { notifications, users } from '../db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { authMiddleware, staffMiddleware, type Env } from '../middleware/auth';

const app = new Hono<Env>();

app.get('/', authMiddleware, staffMiddleware, async (c) => {
  const { status = 'all', type = 'all', page = '1', pageSize = '30' } = c.req.query();
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);

  let query: any = db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      content: notifications.content,
      entityType: notifications.entityType,
      entityId: notifications.entityId,
      status: notifications.status,
      priority: notifications.priority,
      triggeredAt: notifications.triggeredAt,
      readAt: notifications.readAt,
      resolvedAt: notifications.resolvedAt,
      resolutionNote: notifications.resolutionNote,
      resolverName: sql<string>`(SELECT ${users.fullName} FROM ${users} WHERE ${users.id} = ${notifications.resolvedBy})`.as('resolver_name'),
      readerName: sql<string>`(SELECT ${users.fullName} FROM ${users} WHERE ${users.id} = ${notifications.readBy})`.as('reader_name'),
    })
    .from(notifications);

  if (status !== 'all') query = query.where(eq(notifications.status, status as any));
  if (type !== 'all') query = query.where(eq(notifications.type, type as any));

  const totalQ = await db.select({ count: sql<number>`COUNT(*)`.as('count') }).from(query.as('base'));
  const list = await query
    .orderBy(desc(notifications.priority), desc(notifications.triggeredAt))
    .limit(size)
    .offset((pageNum - 1) * size);

  const unreadCount = await db
    .select({ count: sql<number>`COUNT(*)`.as('count') })
    .from(notifications)
    .where(eq(notifications.status, 'unread'));

  return c.json({
    list,
    total: totalQ[0].count,
    unreadCount: unreadCount[0].count,
    page: pageNum,
    pageSize: size,
  });
});

app.get('/unread-count', authMiddleware, staffMiddleware, async (c) => {
  const result = await db
    .select({ count: sql<number>`COUNT(*)`.as('count') })
    .from(notifications)
    .where(eq(notifications.status, 'unread'));
  return c.json({ count: result[0].count });
});

app.post('/:id/read', authMiddleware, staffMiddleware, async (c) => {
  const staff = c.get('user')!;
  const id = parseInt(c.req.param('id'));

  const [notif] = await db.select().from(notifications).where(eq(notifications.id, id));
  if (!notif) return c.json({ error: '通知不存在' }, 404);

  const [updated] = await db.update(notifications).set({
    status: notif.status === 'unread' ? 'read' : notif.status,
    readBy: staff.userId,
    readAt: new Date(),
  } as any).where(eq(notifications.id, id)).returning();

  return c.json(updated);
});

app.post('/read-all', authMiddleware, staffMiddleware, async (c) => {
  const staff = c.get('user')!;
  await db.update(notifications).set({
    status: 'read',
    readBy: staff.userId,
    readAt: new Date(),
  } as any).where(eq(notifications.status, 'unread'));
  return c.json({ success: true });
});

app.post('/:id/resolve', authMiddleware, staffMiddleware,
  zValidator('json', z.object({
    note: z.string().optional(),
  })),
  async (c) => {
    const staff = c.get('user')!;
    const id = parseInt(c.req.param('id'));
    const { note } = c.req.valid('json');

    const [notif] = await db.select().from(notifications).where(eq(notifications.id, id));
    if (!notif) return c.json({ error: '通知不存在' }, 404);

    const [updated] = await db.update(notifications).set({
      status: 'resolved',
      resolvedBy: staff.userId,
      resolvedAt: new Date(),
      resolutionNote: note,
    } as any).where(eq(notifications.id, id)).returning();

    return c.json(updated);
  }
);

app.post('/batch/resolve', authMiddleware, staffMiddleware,
  zValidator('json', z.object({
    ids: z.array(z.number()),
    note: z.string().optional(),
  })),
  async (c) => {
    const staff = c.get('user')!;
    const { ids, note } = c.req.valid('json');

    await db.update(notifications).set({
      status: 'resolved',
      resolvedBy: staff.userId,
      resolvedAt: new Date(),
      resolutionNote: note,
    } as any).where(inArray(notifications.id, ids));

    return c.json({ success: true, count: ids.length });
  }
);

export default app;
