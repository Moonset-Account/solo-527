import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { refunds, orders, orderItems, seats, seatZones, participationStats, notifications } from '../db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { authMiddleware, staffMiddleware, adminMiddleware, type Env } from '../middleware/auth';
import { generateRefundNo } from '../utils/auth';
import { auditOrderChange } from './audit';

const app = new Hono<Env>();

app.get('/', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const { status = 'all', showId, isAbnormal, page = '1', pageSize = '20' } = c.req.query();
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);

  let query = db
    .select({
      id: refunds.id,
      refundNo: refunds.refundNo,
      orderId: refunds.orderId,
      userId: refunds.userId,
      orderItemId: refunds.orderItemId,
      refundAmount: refunds.refundAmount,
      serviceFee: refunds.serviceFee,
      actualRefundAmount: refunds.actualRefundAmount,
      refundReason: refunds.refundReason,
      refundType: refunds.refundType,
      status: refunds.status,
      submittedAt: refunds.submittedAt,
      reviewedAt: refunds.reviewedAt,
      completedAt: refunds.completedAt,
      isAbnormal: refunds.isAbnormal,
      abnormalReason: refunds.abnormalReason,
      orderNo: orders.orderNo,
      orderStatus: orders.status,
      showId: orders.showId,
      userName: sql<string>`(SELECT ${users.fullName} FROM ${users} WHERE ${users.id} = ${refunds.userId})`.as('user_name'),
      userPhone: sql<string>`(SELECT ${users.phone} FROM ${users} WHERE ${users.id} = ${refunds.userId})`.as('user_phone'),
    })
    .from(refunds)
    .leftJoin(orders, eq(refunds.orderId, orders.id));

  if (user.role === 'audience') {
    query = query.where(eq(refunds.userId, user.userId));
  }

  if (status !== 'all') query = query.where(eq(refunds.status, status));
  if (showId) query = query.where(eq(orders.showId, parseInt(showId)));
  if (isAbnormal !== undefined) {
    query = query.where(eq(refunds.isAbnormal, isAbnormal === 'true'));
  }

  const totalResult = await db.select({ count: sql<number>`COUNT(*)`.as('count') }).from(query.as('base'));
  const list = await query.orderBy(desc(refunds.submittedAt)).limit(size).offset((pageNum - 1) * size);

  return c.json({ list, total: totalResult[0].count, page: pageNum, pageSize: size });
});

app.post('/', authMiddleware,
  zValidator('json', z.object({
    orderId: z.number(),
    orderItemIds: z.array(z.number()).optional(),
    refundReason: z.string().min(1, '请填写退款原因'),
    bankCard: z.string().optional(),
    accountHolder: z.string().optional(),
    bankName: z.string().optional(),
    serviceFeeRate: z.number().default(0.1),
  })),
  async (c) => {
    const user = c.get('user')!;
    const data = c.req.valid('json');

    const [order] = await db.select().from(orders).where(eq(orders.id, data.orderId)).for('update');
    if (!order) return c.json({ error: '订单不存在' }, 404);
    if (order.userId !== user.userId && user.role === 'audience') {
      return c.json({ error: '无权限操作此订单' }, 403);
    }
    if (!['paid', 'verified'].includes(order.status)) {
      return c.json({ error: `订单状态为 ${order.status}，不能申请退款` }, 400);
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(and(
        eq(orderItems.orderId, data.orderId),
        ne(orderItems.ticketStatus, 'refunded')
      ));

    const refundItems = data.orderItemIds
      ? items.filter(i => data.orderItemIds!.includes(i.id))
      : items;

    if (refundItems.length === 0) {
      return c.json({ error: '没有可退款的票' }, 400);
    }

    const totalRefund = refundItems.reduce((sum, i) => sum + parseFloat(i.subtotal as string || '0'), 0);
    const serviceFee = totalRefund * data.serviceFeeRate;
    const actualRefund = totalRefund - serviceFee;

    const refundNo = generateRefundNo();
    const isFull = refundItems.length === items.length;

    const [refund] = await db.transaction(async (tx) => {
      const [r] = await tx.insert(refunds).values({
        refundNo,
        orderId: order.id,
        userId: user.userId,
        orderItemId: refundItems.length === 1 ? refundItems[0].id : undefined,
        refundAmount: totalRefund.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        actualRefundAmount: actualRefund.toFixed(2),
        refundReason: data.refundReason,
        refundType: isFull ? 'full' : 'partial',
        status: 'pending',
        bankCard: data.bankCard,
        accountHolder: data.accountHolder,
        bankName: data.bankName,
      }).returning();

      for (const item of refundItems) {
        await tx.update(orderItems)
          .set({ ticketStatus: 'refunded', updatedAt: new Date() })
          .where(eq(orderItems.id, item.id));

        if (item.seatId) {
          const [seat] = await tx.select().from(seats).where(eq(seats.id, item.seatId)).for('update');
          if (seat) {
            await tx.update(seats)
              .set({ status: 'refunded', updatedAt: new Date() })
              .where(eq(seats.id, item.seatId));
            await tx.execute(
              sql`UPDATE ${seatZones} SET ${seatZones.soldSeats} = GREATEST(${seatZones.soldSeats} - 1, 0) WHERE ${seatZones.id} = ${seat.zoneId}`
            );
          }
        }
      }

      if (isFull) {
        await tx.update(orders)
          .set({ status: 'refunded', updatedAt: new Date() })
          .where(eq(orders.id, order.id));
      }

      return [r];
    });

    const showDaysUntil = Math.ceil((new Date(order.showDate as unknown as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const isHighRisk = showDaysUntil <= 7 && serviceFee > 0;

    if (isHighRisk) {
      await triggerRefundAbnormal(refund.id, order.id, `临演${showDaysUntil}天申请退款，手续费${serviceFee.toFixed(2)}元`);
    }

    await auditOrderChange(order.id, user.userId, user.name, 'refund_request', null, {
      refundNo,
      refundAmount: totalRefund.toFixed(2),
      refundReason: data.refundReason,
    }, `申请退款 ${refundNo}`);

    return c.json(refund, 201);
  }
);

app.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const id = parseInt(c.req.param('id'));

  const [refund] = await db
    .select({
      id: refunds.id,
      refundNo: refunds.refundNo,
      orderId: refunds.orderId,
      userId: refunds.userId,
      orderItemId: refunds.orderItemId,
      refundAmount: refunds.refundAmount,
      serviceFee: refunds.serviceFee,
      actualRefundAmount: refunds.actualRefundAmount,
      refundReason: refunds.refundReason,
      refundType: refunds.refundType,
      status: refunds.status,
      submittedAt: refunds.submittedAt,
      reviewedBy: refunds.reviewedBy,
      reviewedAt: refunds.reviewedAt,
      reviewNote: refunds.reviewNote,
      approvedAt: refunds.approvedAt,
      processedAt: refunds.processedAt,
      completedAt: refunds.completedAt,
      isAbnormal: refunds.isAbnormal,
      abnormalReason: refunds.abnormalReason,
      paymentRefundId: refunds.paymentRefundId,
      bankCard: refunds.bankCard,
      accountHolder: refunds.accountHolder,
      bankName: refunds.bankName,
      orderNo: orders.orderNo,
      orderStatus: orders.status,
      showId: orders.showId,
      payAmount: orders.payAmount,
      userName: sql<string>`(SELECT ${users.fullName} FROM ${users} WHERE ${users.id} = ${refunds.userId})`.as('user_name'),
      userPhone: sql<string>`(SELECT ${users.phone} FROM ${users} WHERE ${users.id} = ${refunds.userId})`.as('user_phone'),
      reviewerName: sql<string>`(SELECT ${users.fullName} FROM ${users} WHERE ${users.id} = ${refunds.reviewedBy})`.as('reviewer_name'),
    })
    .from(refunds)
    .leftJoin(orders, eq(refunds.orderId, orders.id))
    .where(eq(refunds.id, id));

  if (!refund) return c.json({ error: '退款申请不存在' }, 404);
  if (user.role === 'audience' && refund.userId !== user.userId) {
    return c.json({ error: '无权限查看此退款' }, 403);
  }

  const refundItems = await db
    .select({
      id: orderItems.id,
      ticketHolderName: orderItems.ticketHolderName,
      ticketHolderIdCard: orderItems.ticketHolderIdCard,
      ticketNo: orderItems.ticketNo,
      unitPrice: orderItems.unitPrice,
      seatLabel: seats.seatLabel,
      zoneName: sql<string>`(SELECT ${seatZones.name} FROM ${seatZones} WHERE ${seatZones.id} = ${seats.zoneId})`.as('zone_name'),
    })
    .from(orderItems)
    .leftJoin(seats, eq(orderItems.seatId, seats.id))
    .where(and(
      eq(orderItems.orderId, refund.orderId),
      eq(orderItems.ticketStatus, 'refunded')
    ));

  return c.json({ ...refund, items: refundItems });
});

app.post('/:id/review', authMiddleware, staffMiddleware,
  zValidator('json', z.object({
    action: z.enum(['approve', 'reject', 'flag_abnormal']),
    note: z.string().optional(),
    abnormalReason: z.string().optional(),
  })),
  async (c) => {
    const staff = c.get('user')!;
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    const [refund] = await db.select().from(refunds).where(eq(refunds.id, id)).for('update');
    if (!refund) return c.json({ error: '退款申请不存在' }, 404);

    if (!['pending', 'reviewing'].includes(refund.status)) {
      return c.json({ error: `退款状态为 ${refund.status}，无法审核` }, 400);
    }

    const oldStatus = refund.status;
    let newStatus: any = refund.status;
    const updateData: any = {
      reviewedBy: staff.userId,
      reviewedAt: new Date(),
      reviewNote: data.note,
      updatedAt: new Date(),
    };

    if (data.action === 'approve') {
      newStatus = 'approved';
      updateData.status = newStatus;
      updateData.approvedAt = new Date();
    } else if (data.action === 'reject') {
      newStatus = 'rejected';
      updateData.status = newStatus;
    } else if (data.action === 'flag_abnormal') {
      newStatus = 'abnormal';
      updateData.status = 'reviewing';
      updateData.isAbnormal = true;
      updateData.abnormalReason = data.abnormalReason || '人工标记异常';
      await triggerRefundAbnormal(id, refund.orderId, updateData.abnormalReason);
    }

    await db.update(refunds).set(updateData).where(eq(refunds.id, id));

    if (data.action === 'reject') {
      const orderItemsRej = await db.select().from(orderItems).where(
        and(eq(orderItems.orderId, refund.orderId), eq(orderItems.ticketStatus, 'refunded'))
      );
      for (const item of orderItemsRej) {
        await db.update(orderItems).set({ ticketStatus: 'sold', updatedAt: new Date() })
          .where(eq(orderItems.id, item.id));
        if (item.seatId) {
          const [seat] = await db.select().from(seats).where(eq(seats.id, item.seatId)).for('update');
          if (seat) {
            await db.update(seats).set({ status: 'sold', updatedAt: new Date() })
              .where(eq(seats.id, item.seatId));
            await db.execute(
              sql`UPDATE ${seatZones} SET ${seatZones.soldSeats} = ${seatZones.soldSeats} + 1 WHERE ${seatZones.id} = ${seat.zoneId}`
            );
          }
        }
      }
      const [ord] = await db.select().from(orders).where(eq(orders.id, refund.orderId));
      if (ord && ord.status === 'refunded') {
        await db.update(orders).set({ status: 'verified', updatedAt: new Date() })
          .where(eq(orders.id, refund.orderId));
      }
    }

    await auditOrderChange(refund.orderId, staff.userId, staff.name, 'refund_review',
      { refundStatus: oldStatus },
      { refundStatus: newStatus, action: data.action, note: data.note },
      `审核退款申请：${data.action === 'approve' ? '通过' : data.action === 'reject' ? '驳回' : '标记异常'}`
    );

    if (data.action === 'approve' || data.action === 'reject') {
      await syncParticipationData(refund.orderId);
    }

    const [updated] = await db.select().from(refunds).where(eq(refunds.id, id));
    return c.json(updated);
  }
);

app.post('/:id/process', authMiddleware, adminMiddleware,
  zValidator('json', z.object({
    paymentRefundId: z.string().optional(),
    note: z.string().optional(),
  })),
  async (c) => {
    const admin = c.get('user')!;
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    const [refund] = await db.select().from(refunds).where(eq(refunds.id, id)).for('update');
    if (!refund) return c.json({ error: '退款申请不存在' }, 404);
    if (refund.status !== 'approved') return c.json({ error: '退款未通过审核' }, 400);

    try {
      const [updated] = await db.update(refunds).set({
        status: 'completed',
        processedAt: new Date(),
        completedAt: new Date(),
        paymentRefundId: data.paymentRefundId || `MOCK_REF_${Date.now()}`,
        reviewNote: data.note ? `${refund.reviewNote || ''}\n${data.note}`.trim() : refund.reviewNote,
        updatedAt: new Date(),
      }).where(eq(refunds.id, id)).returning();

      await syncParticipationData(refund.orderId);

      await auditOrderChange(refund.orderId, admin.userId, admin.name, 'refund_complete',
        { refundStatus: 'approved' },
        { refundStatus: 'completed', paymentRefundId: data.paymentRefundId },
        `退款完成，实际退款 ${refund.actualRefundAmount} 元`
      );

      return c.json(updated);
    } catch (e: any) {
      await db.update(refunds).set({
        status: 'abnormal',
        isAbnormal: true,
        abnormalReason: `退款失败：${e.message}`,
        updatedAt: new Date(),
      }).where(eq(refunds.id, id));

      await triggerRefundAbnormal(id, refund.orderId, `处理退款失败：${e.message}`);

      return c.json({ error: '退款处理失败，已标记异常', details: e.message }, 500);
    }
  }
);

async function triggerRefundAbnormal(refundId: number, orderId: number, reason: string) {
  await db.insert(notifications).values({
    type: 'refund_abnormal',
    title: '退票异常提醒',
    content: `退款申请 #${refundId} 出现异常：${reason}`,
    entityType: 'refund',
    entityId: refundId,
    status: 'unread',
    priority: 2,
  });

  const [ord] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (ord) {
    await syncParticipationData(orderId);
  }
}

async function syncParticipationData(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return;

  const showId = order.showId;
  const today = new Date().toISOString().split('T')[0];

  const ticketCountData = await db
    .select({
      sold: sql<number>`COUNT(CASE WHEN ${seats.status} IN ('sold', 'scanned') THEN 1 END)`.as('sold'),
      refunded: sql<number>`COUNT(CASE WHEN ${seats.status} = 'refunded' THEN 1 END)`.as('refunded'),
      scanned: sql<number>`COUNT(CASE WHEN ${seats.status} = 'scanned' THEN 1 END)`.as('scanned'),
    })
    .from(seats)
    .where(eq(seats.showId, showId));

  const zoneSeats = await db
    .select({ total: sql<number>`COALESCE(SUM(${seatZones.totalSeats}), 0)`.as('total') })
    .from(seatZones)
    .where(eq(seatZones.showId, showId));

  const soldN = ticketCountData[0].sold;
  const refundedN = ticketCountData[0].refunded;
  const scannedN = ticketCountData[0].scanned;
  const totalN = zoneSeats[0].total;

  const { revenue, refundAmount } = (await db
    .select({
      revenue: sql<string>`COALESCE(SUM(CASE WHEN ${seats.status} IN ('sold', 'scanned') THEN ${seats.price}::numeric ELSE 0 END), 0)`.as('revenue'),
      refundAmount: sql<string>`COALESCE(SUM(CASE WHEN ${seats.status} = 'refunded' THEN ${seats.price}::numeric ELSE 0 END), 0)`.as('refund_amount'),
    })
    .from(seats)
    .where(eq(seats.showId, showId)))[0] as any;

  const attendanceRate = totalN > 0 ? ((scannedN / totalN) * 100).toFixed(2) : '0.00';

  const existing = await db
    .select()
    .from(participationStats)
    .where(and(eq(participationStats.showId, showId), eq(participationStats.date, today)))
    .limit(1);

  const statData = {
    totalTickets: totalN,
    soldTickets: soldN,
    scannedTickets: scannedN,
    refundedTickets: refundedN,
    attendanceRate,
    revenue,
    refundAmount,
    netRevenue: (parseFloat(revenue || '0') - parseFloat(refundAmount || '0')).toFixed(2),
    lastSyncedAt: new Date(),
  };

  if (existing.length > 0) {
    await db.update(participationStats).set({ ...statData, updatedAt: new Date() })
      .where(eq(participationStats.id, existing[0].id));
  } else {
    await db.insert(participationStats).values({ showId, date: today, ...statData });
  }
}

export default app;

import { users } from '../db/schema';
