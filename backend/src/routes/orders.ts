import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { orders, orderItems, seats, ticketTypes, verifications, refundStatusEnum, refunds } from '../db/schema';
import { eq, and, desc, asc, inArray, sql, ne } from 'drizzle-orm';
import { authMiddleware, staffMiddleware, adminMiddleware, type Env } from '../middleware/auth';
import { generateOrderNo, generateTicketNo, generateRefundNo } from '../utils/auth';
import { auditOrderChange } from '../routes/audit';

const app = new Hono<Env>();

app.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const { status = 'all', showId, page = '1', pageSize = '20' } = c.req.query();
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);

  let query: any = db
    .select({
      id: orders.id,
      orderNo: orders.orderNo,
      userId: orders.userId,
      showId: orders.showId,
      totalAmount: orders.totalAmount,
      payAmount: orders.payAmount,
      ticketCount: orders.ticketCount,
      status: orders.status,
      paidAt: orders.paidAt,
      cancelledAt: orders.cancelledAt,
      verificationStatus: orders.verificationStatus,
      verificationNote: orders.verificationNote,
      verifiedAt: orders.verifiedAt,
      remark: orders.remark,
      createdAt: orders.createdAt,
      userName: sql<string>`(SELECT ${users.fullName} FROM ${users} WHERE ${users.id} = ${orders.userId})`.as('user_name'),
      userPhone: sql<string>`(SELECT ${users.phone} FROM ${users} WHERE ${users.id} = ${orders.userId})`.as('user_phone'),
    })
    .from(orders);

  if (user?.role === 'audience') {
    query = query.where(eq(orders.userId, user.userId));
  }

  if (status !== 'all') query = query.where(eq(orders.status, status as any));
  if (showId) query = query.where(eq(orders.showId, parseInt(showId)));

  const totalResult = await db
    .select({ count: sql<number>`COUNT(*)`.as('count') })
    .from(query.as('base'));

  const orderList = await query
    .orderBy(desc(orders.createdAt))
    .limit(size)
    .offset((pageNum - 1) * size);

  return c.json({
    list: orderList,
    total: totalResult[0].count,
    page: pageNum,
    pageSize: size,
  });
});

app.post('/', authMiddleware,
  zValidator('json', z.object({
    showId: z.number(),
    seatIds: z.array(z.number()).min(1),
    ticketHolders: z.array(z.object({
      name: z.string().min(2),
      idCard: z.string().min(15).max(30),
      phone: z.string().optional(),
    })),
    remark: z.string().optional(),
  })),
  async (c) => {
    const user = c.get('user')!;
    const data = c.req.valid('json');

    if (data.seatIds.length !== data.ticketHolders.length) {
      return c.json({ error: '座位数与持票人信息不匹配' }, 400);
    }

    const availableSeats = await db
      .select()
      .from(seats)
      .where(and(
        inArray(seats.id, data.seatIds),
        eq(seats.status, 'available')
      ))
      .for('update');

    if (availableSeats.length !== data.seatIds.length) {
      return c.json({ error: '所选座位中部分已被锁定或已售出，请重新选择' }, 409);
    }

    const totalAmount = availableSeats.reduce((sum, s) => sum + parseFloat(s.price as string || '0'), 0);

    const orderNo = generateOrderNo();
    const ticketCount = availableSeats.length;

    const [newOrder] = await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values({
        orderNo,
        userId: user.userId,
        showId: data.showId,
        totalAmount: totalAmount.toFixed(2),
        discountAmount: '0.00',
        payAmount: totalAmount.toFixed(2),
        ticketCount,
        status: 'pending',
        remark: data.remark,
      }).returning();

      const orderItemData = availableSeats.map((seat, idx) => ({
        orderId: order.id,
        seatId: seat.id,
        ticketHolderName: data.ticketHolders[idx].name,
        ticketHolderIdCard: data.ticketHolders[idx].idCard,
        ticketHolderPhone: data.ticketHolders[idx].phone,
        unitPrice: seat.price,
        quantity: 1,
        subtotal: seat.price,
        ticketNo: generateTicketNo(order.id, idx),
        ticketStatus: 'sold' as const,
      }));

      const items = await tx.insert(orderItems).values(orderItemData).returning();

      for (let i = 0; i < availableSeats.length; i++) {
        await tx.update(seats)
          .set({ status: 'sold', orderItemId: items[i].id, updatedAt: new Date() } as any)
          .where(eq(seats.id, availableSeats[i].id));
      }

      for (const seat of availableSeats) {
        const zoneId = seat.zoneId;
        await tx.execute(
          sql`UPDATE ${seatZones} SET ${seatZones.soldSeats} = ${seatZones.soldSeats} + 1, ${seatZones.availableSeats} = ${seatZones.availableSeats} - 1 WHERE ${seatZones.id} = ${zoneId}`
        );
      }

      await tx.insert(verifications).values({
        orderId: order.id,
        userId: user.userId,
        realName: data.ticketHolders[0].name,
        idCardNumber: data.ticketHolders[0].idCard,
        phone: data.ticketHolders[0].phone,
        status: 'pending',
      });

      return [order];
    });

    const finalOrder = await getOrderDetail(newOrder.id);

    await auditOrderChange(newOrder.id, user.userId, user.name, 'create', null, {
      orderNo: newOrder.orderNo,
      ticketCount,
      payAmount: newOrder.payAmount,
    }, `创建订单 ${newOrder.orderNo}`);

    return c.json(finalOrder, 201);
  }
);

app.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));
  const order = await getOrderDetail(id);

  if (!order) return c.json({ error: '订单不存在' }, 404);
  if (user?.role === 'audience' && order.userId !== user.userId) {
    return c.json({ error: '无权限查看此订单' }, 403);
  }

  return c.json(order);
});

async function getOrderDetail(id: number) {
  const [order] = await db
    .select({
      id: orders.id,
      orderNo: orders.orderNo,
      userId: orders.userId,
      showId: orders.showId,
      totalAmount: orders.totalAmount,
      discountAmount: orders.discountAmount,
      payAmount: orders.payAmount,
      ticketCount: orders.ticketCount,
      status: orders.status,
      paidAt: orders.paidAt,
      cancelledAt: orders.cancelledAt,
      cancelledReason: orders.cancelledReason,
      verificationStatus: orders.verificationStatus,
      verificationNote: orders.verificationNote,
      verifiedAt: orders.verifiedAt,
      verifiedBy: orders.verifiedBy,
      remark: orders.remark,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userName: sql<string>`(SELECT ${users.fullName} FROM ${users} WHERE ${users.id} = ${orders.userId})`.as('user_name'),
      userEmail: sql<string>`(SELECT ${users.email} FROM ${users} WHERE ${users.id} = ${orders.userId})`.as('user_email'),
      userPhone: sql<string>`(SELECT ${users.phone} FROM ${users} WHERE ${users.id} = ${orders.userId})`.as('user_phone'),
      userRealName: sql<string>`(SELECT ${users.realName} FROM ${users} WHERE ${users.id} = ${orders.userId})`.as('user_real_name'),
      userIsVerified: sql<boolean>`(SELECT ${users.isVerified} FROM ${users} WHERE ${users.id} = ${orders.userId})`.as('user_is_verified'),
    })
    .from(orders)
    .where(eq(orders.id, id));

  if (!order) return null;

  const items = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      seatId: orderItems.seatId,
      ticketHolderName: orderItems.ticketHolderName,
      ticketHolderIdCard: orderItems.ticketHolderIdCard,
      ticketHolderPhone: orderItems.ticketHolderPhone,
      unitPrice: orderItems.unitPrice,
      subtotal: orderItems.subtotal,
      ticketNo: orderItems.ticketNo,
      ticketStatus: orderItems.ticketStatus,
      scannedAt: orderItems.scannedAt,
      rowNumber: seats.rowNumber,
      seatNumber: seats.seatNumber,
      seatLabel: seats.seatLabel,
      zoneName: sql<string>`(SELECT ${seatZones.name} FROM ${seatZones} WHERE ${seatZones.id} = ${seats.zoneId})`.as('zone_name'),
      zoneType: sql<string>`(SELECT ${seatZones.zoneType} FROM ${seatZones} WHERE ${seatZones.id} = ${seats.zoneId})`.as('zone_type'),
    })
    .from(orderItems)
    .leftJoin(seats, eq(orderItems.seatId, seats.id))
    .where(eq(orderItems.orderId, id));

  const verificationList = await db
    .select()
    .from(verifications)
    .where(eq(verifications.orderId, id))
    .orderBy(desc(verifications.createdAt));

  return { ...order, items, verifications: verificationList };
}

app.post('/:id/pay', authMiddleware,
  zValidator('json', z.object({
    paymentMethod: z.string().default('mock_payment'),
  })),
  async (c) => {
    const user = c.get('user')!;
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).for('update');
    if (!order) return c.json({ error: '订单不存在' }, 404);
    if (user.role === 'audience' && order.userId !== user.userId) {
      return c.json({ error: '无权限操作此订单' }, 403);
    }
    if (order.status !== 'pending') return c.json({ error: `订单状态为 ${order.status}，无法支付` }, 400);

    const oldStatus = order.status;
    const [updated] = await db
      .update(orders)
      .set({
        status: 'paid',
        paymentMethod: data.paymentMethod,
        paidAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(orders.id, id))
      .returning();

    await auditOrderChange(id, user.userId, user.name, 'update',
      { status: oldStatus },
      { status: 'paid', paidAt: new Date() },
      `订单支付完成`
    );

    return c.json(await getOrderDetail(id));
  }
);

app.post('/:id/cancel', authMiddleware,
  zValidator('json', z.object({
    reason: z.string().optional(),
  })),
  async (c) => {
    const user = c.get('user')!;
    const id = parseInt(c.req.param('id'));
    const { reason } = c.req.valid('json');

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).for('update');
    if (!order) return c.json({ error: '订单不存在' }, 404);
    if (user.role === 'audience' && order.userId !== user.userId) {
      return c.json({ error: '无权限操作此订单' }, 403);
    }
    if (!['pending', 'paid'].includes(order.status)) {
      return c.json({ error: `订单状态为 ${order.status}，无法取消` }, 400);
    }

    await db.transaction(async (tx) => {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
      for (const item of items) {
        if (item.seatId) {
          const [seat] = await tx.select().from(seats).where(eq(seats.id, item.seatId)).for('update');
          if (seat) {
            await tx.update(seats)
              .set({ status: 'available', orderItemId: null, updatedAt: new Date() } as any)
              .where(eq(seats.id, item.seatId));
            await tx.execute(
              sql`UPDATE ${seatZones} SET ${seatZones.soldSeats} = GREATEST(${seatZones.soldSeats} - 1, 0), ${seatZones.availableSeats} = ${seatZones.availableSeats} + 1 WHERE ${seatZones.id} = ${seat.zoneId}`
            );
          }
        }
        await tx.update(orderItems).set({ ticketStatus: 'refunded' as any, updatedAt: new Date() })
          .where(eq(orderItems.id, item.id));
      }

      await tx.update(orders).set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledReason: reason,
        updatedAt: new Date(),
      } as any).where(eq(orders.id, id));
    });

    await auditOrderChange(id, user.userId, user.name, 'cancel',
      { status: order.status },
      { status: 'cancelled', cancelledReason: reason },
      `取消订单，原因：${reason || '用户取消'}`
    );

    return c.json(await getOrderDetail(id));
  }
);

app.post('/:id/verify', authMiddleware, staffMiddleware,
  zValidator('json', z.object({
    status: z.enum(['approved', 'rejected']),
    note: z.string().optional(),
  })),
  async (c) => {
    const staff = c.get('user')!;
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return c.json({ error: '订单不存在' }, 404);
    if (order.status !== 'paid') return c.json({ error: '未支付的订单无法审核' }, 400);

    const oldStatus = order.verificationStatus;
    const [updated] = await db.update(orders).set({
      verificationStatus: data.status,
      verificationNote: data.note,
      verifiedAt: new Date(),
      verifiedBy: staff.userId,
      status: data.status === 'approved' ? 'verified' : order.status,
      updatedAt: new Date(),
    } as any).where(eq(orders.id, id)).returning();

    await db.update(verifications).set({
      status: data.status,
      reviewedBy: staff.userId,
      reviewedAt: new Date(),
      reviewNote: data.note,
    } as any).where(eq(verifications.orderId, id));

    await auditOrderChange(id, staff.userId, staff.name, 'verify',
      { verificationStatus: oldStatus },
      { verificationStatus: data.status, note: data.note },
      `${data.status === 'approved' ? '通过' : '驳回'}实名审核`
    );

    return c.json(await getOrderDetail(id));
  }
);

app.get('/verifications/list', authMiddleware, staffMiddleware, async (c) => {
  const { status = 'pending', showId, page = '1', pageSize = '20' } = c.req.query();
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);

  let query: any = db
    .select({
      id: verifications.id,
      orderId: verifications.orderId,
      userId: verifications.userId,
      realName: verifications.realName,
      idCardNumber: verifications.idCardNumber,
      status: verifications.status,
      submittedAt: verifications.submittedAt,
      reviewedAt: verifications.reviewedAt,
      orderNo: orders.orderNo,
      orderStatus: orders.status,
      orderCreatedAt: orders.createdAt,
      userName: sql<string>`(SELECT ${users.fullName} FROM ${users} WHERE ${users.id} = ${verifications.userId})`.as('user_name'),
      userPhone: sql<string>`(SELECT ${users.phone} FROM ${users} WHERE ${users.id} = ${verifications.userId})`.as('user_phone'),
    })
    .from(verifications)
    .leftJoin(orders, eq(verifications.orderId, orders.id));

  if (status !== 'all') query = query.where(eq(verifications.status, status as any));
  if (showId) query = query.where(eq(orders.showId, parseInt(showId)));

  const totalResult = await db.select({ count: sql<number>`COUNT(*)`.as('count') }).from(query.as('base'));
  const list = await query.orderBy(asc(verifications.submittedAt)).limit(size).offset((pageNum - 1) * size);

  return c.json({ list, total: totalResult[0].count, page: pageNum, pageSize: size });
});

export default app;

import { users, seatZones } from '../db/schema';
