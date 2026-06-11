import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { ticketTypes, attendances, users } from '../db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { authMiddleware, staffMiddleware, adminMiddleware, type Env } from '../middleware/auth';
import { auditTicketTypeChange } from './audit';

const app = new Hono<Env>();

app.get('/', authMiddleware, async (c) => {
  const { showId, isActive } = c.req.query();
  let query = db.select().from(ticketTypes);
  if (showId) query = query.where(eq(ticketTypes.showId, parseInt(showId)));
  if (isActive !== undefined) query = query.where(eq(ticketTypes.isActive, isActive === 'true'));
  const list = await query.orderBy(desc(ticketTypes.createdAt));
  return c.json(list);
});

app.get('/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  const [tt] = await db.select().from(ticketTypes).where(eq(ticketTypes.id, id));
  if (!tt) return c.json({ error: '票种不存在' }, 404);
  return c.json(tt);
});

app.post('/', authMiddleware, adminMiddleware,
  zValidator('json', z.object({
    showId: z.number(),
    zoneId: z.number().optional(),
    name: z.string(),
    description: z.string().optional(),
    price: z.string(),
    originalStock: z.number().min(0),
    maxPerOrder: z.number().default(4),
    requireRealName: z.boolean().default(true),
    salesStartAt: z.string().optional(),
    salesEndAt: z.string().optional(),
  })),
  async (c) => {
    const admin = c.get('user')!;
    const data = c.req.valid('json');

    const [tt] = await db.insert(ticketTypes).values({
      ...data,
      remainingStock: data.originalStock,
      heldStock: 0,
      soldCount: 0,
      refundedCount: 0,
      isActive: true,
    }).returning();

    await auditTicketTypeChange(tt.id, admin.userId, admin.name, 'create', null, null, data, `创建票种：${tt.name}`);
    return c.json(tt, 201);
  }
);

app.put('/:id', authMiddleware, adminMiddleware,
  zValidator('json', z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.string().optional(),
    maxPerOrder: z.number().optional(),
    requireRealName: z.boolean().optional(),
    isActive: z.boolean().optional(),
    salesStartAt: z.string().optional(),
    salesEndAt: z.string().optional(),
  })),
  async (c) => {
    const admin = c.get('user')!;
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    const [old] = await db.select().from(ticketTypes).where(eq(ticketTypes.id, id));
    if (!old) return c.json({ error: '票种不存在' }, 404);

    const [updated] = await db.update(ticketTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ticketTypes.id, id))
      .returning();

    const fieldChanges: Record<string, { old: any; new: any }> = {};
    for (const key of Object.keys(data) as (keyof typeof data)[]) {
      if (data[key] !== undefined && data[key] !== (old as any)[key]) {
        fieldChanges[key] = { old: (old as any)[key], new: (data as any)[key] };
      }
    }

    if (Object.keys(fieldChanges).length > 0) {
      await auditTicketTypeChange(id, admin.userId, admin.name, 'update', null,
        fieldChanges, updated, `修改票种信息：${updated.name}`);
    }

    return c.json(updated);
  }
);

app.post('/:id/adjust-stock', authMiddleware, adminMiddleware,
  zValidator('json', z.object({
    adjustment: z.number(),
    reason: z.string().min(1),
  })),
  async (c) => {
    const admin = c.get('user')!;
    const id = parseInt(c.req.param('id'));
    const { adjustment, reason } = c.req.valid('json');

    const [old] = await db.select().from(ticketTypes).where(eq(ticketTypes.id, id)).for('update');
    if (!old) return c.json({ error: '票种不存在' }, 404);

    const newOriginal = Math.max(0, old.originalStock + adjustment);
    const newRemaining = Math.max(0, old.remainingStock + adjustment);

    if (newRemaining < 0 || newOriginal < 0) {
      return c.json({ error: '库存调整后不能为负数' }, 400);
    }

    const [updated] = await db.update(ticketTypes).set({
      originalStock: newOriginal,
      remainingStock: newRemaining,
      updatedAt: new Date(),
    }).where(eq(ticketTypes.id, id)).returning();

    await auditTicketTypeChange(id, admin.userId, admin.name, 'stock_adjust', null,
      { originalStock: old.originalStock, remainingStock: old.remainingStock, adjustment },
      { originalStock: newOriginal, remainingStock: newRemaining },
      `调整库存：${adjustment > 0 ? '+' : ''}${adjustment}，原因：${reason}`
    );

    return c.json(updated);
  }
);

const attendanceApp = new Hono<Env>();

attendanceApp.get('/', authMiddleware, staffMiddleware, async (c) => {
  const { showId, hasAttended = 'all', page = '1', pageSize = '50' } = c.req.query();
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);

  let query = db
    .select({
      id: attendances.id,
      orderItemId: attendances.orderItemId,
      seatId: attendances.seatId,
      userId: attendances.userId,
      showId: attendances.showId,
      scanCode: attendances.scanCode,
      scanType: attendances.scanType,
      scannedAt: attendances.scannedAt,
      hasAttended: attendances.hasAttended,
      feedbackScore: attendances.feedbackScore,
      feedbackComment: attendances.feedbackComment,
      feedbackSubmittedAt: attendances.feedbackSubmittedAt,
      userName: sql<string>`(SELECT ${users.fullName} FROM ${users} WHERE ${users.id} = ${attendances.userId})`.as('user_name'),
      scannedByName: sql<string>`(SELECT ${users.fullName} FROM ${users} WHERE ${users.id} = ${attendances.scannedBy})`.as('scanned_by_name'),
    })
    .from(attendances);

  if (showId) query = query.where(eq(attendances.showId, parseInt(showId)));
  if (hasAttended !== 'all') query = query.where(eq(attendances.hasAttended, hasAttended === 'true'));

  const totalQ = await db.select({ count: sql<number>`COUNT(*)`.as('count') }).from(query.as('base'));
  const list = await query
    .orderBy(desc(attendances.scannedAt))
    .limit(size)
    .offset((pageNum - 1) * size);

  return c.json({ list, total: totalQ[0].count, page: pageNum, pageSize: size });
});

attendanceApp.get('/stats', authMiddleware, staffMiddleware, async (c) => {
  const { showId } = c.req.query();
  if (!showId) return c.json({ error: '需要showId参数' }, 400);

  const sid = parseInt(showId);
  const counts = await db
    .select({
      total: sql<number>`COUNT(*)`.as('total'),
      attended: sql<number>`COUNT(CASE WHEN ${attendances.hasAttended} = true THEN 1 END)`.as('attended'),
      withFeedback: sql<number>`COUNT(CASE WHEN ${attendances.feedbackScore} IS NOT NULL THEN 1 END)`.as('with_feedback'),
      avgScore: sql<string>`COALESCE(AVG(${attendances.feedbackScore}::numeric), '0')::text`.as('avg_score'),
    })
    .from(attendances)
    .where(eq(attendances.showId, sid));

  const feedbackComments = await db
    .select({
      id: attendances.id,
      userName: sql<string>`(SELECT ${users.fullName} FROM ${users} WHERE ${users.id} = ${attendances.userId})`.as('user_name'),
      feedbackScore: attendances.feedbackScore,
      feedbackComment: attendances.feedbackComment,
      feedbackSubmittedAt: attendances.feedbackSubmittedAt,
    })
    .from(attendances)
    .where(and(eq(attendances.showId, sid), attendances.feedbackComment.isNotNull()))
    .orderBy(desc(attendances.feedbackSubmittedAt))
    .limit(50);

  return c.json({
    ...counts[0],
    attendanceRate: counts[0].total > 0 ? ((counts[0].attended / counts[0].total) * 100).toFixed(2) : '0.00',
    recentFeedbacks: feedbackComments,
  });
});

attendanceApp.post('/scan', authMiddleware, staffMiddleware,
  zValidator('json', z.object({
    ticketNo: z.string(),
    scanType: z.enum(['entry', 'exit']).default('entry'),
  })),
  async (c) => {
    const staff = c.get('user')!;
    const { ticketNo, scanType } = c.req.valid('json');

    const [oi] = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.ticketNo, ticketNo));

    if (!oi) return c.json({ error: '无效的票号' }, 404);
    if (oi.ticketStatus === 'refunded') return c.json({ error: '该票已退票' }, 400);

    const existing = await db
      .select()
      .from(attendances)
      .where(and(eq(attendances.orderItemId, oi.id), eq(attendances.scanType, scanType)));

    if (existing.length > 0) {
      return c.json({ error: `已${scanType === 'entry' ? '入场' : '出场'}，请勿重复扫码` }, 409);
    }

    const [seat] = await db.select().from(seats).where(eq(seats.id, oi.seatId || 0));
    const [order] = await db.select().from(orders).where(eq(orders.id, oi.orderId));

    const [record] = await db.insert(attendances).values({
      orderItemId: oi.id,
      seatId: oi.seatId,
      userId: order?.userId,
      showId: order?.showId,
      scanCode: ticketNo,
      scanType,
      scannedBy: staff.userId,
      hasAttended: scanType === 'entry',
    }).returning();

    if (scanType === 'entry') {
      await db.update(orderItemsTable).set({
        ticketStatus: 'scanned',
        scannedAt: new Date(),
      }).where(eq(orderItemsTable.id, oi.id));

      if (oi.seatId) {
        await db.update(seats).set({
          status: 'scanned',
          updatedAt: new Date(),
        }).where(eq(seats.id, oi.seatId));
      }
    }

    return c.json({
      ...record,
      ticketHolderName: oi.ticketHolderName,
      ticketHolderIdCard: oi.ticketHolderIdCard,
      seatLabel: seat?.seatLabel,
    });
  }
);

attendanceApp.post('/:id/feedback', authMiddleware,
  zValidator('json', z.object({
    score: z.number().min(1).max(5),
    comment: z.string().optional(),
  })),
  async (c) => {
    const user = c.get('user')!;
    const id = parseInt(c.req.param('id'));
    const { score, comment } = c.req.valid('json');

    const [record] = await db.select().from(attendances).where(eq(attendances.id, id));
    if (!record) return c.json({ error: '记录不存在' }, 404);
    if (record.userId !== user.userId && user.role === 'audience') {
      return c.json({ error: '无权限提交反馈' }, 403);
    }

    const [updated] = await db.update(attendances).set({
      feedbackScore: score,
      feedbackComment: comment,
      feedbackSubmittedAt: new Date(),
    }).where(eq(attendances.id, id)).returning();

    return c.json(updated);
  }
);

export default app;
export { attendanceApp };

import { orders, seats, orderItems as orderItemsTable } from '../db/schema';
