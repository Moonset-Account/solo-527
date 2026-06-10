import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { deposits, apartments, customers, leases, depositDisputes, todos } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware, adminMiddleware, AuthUser } from '../middleware/auth';

const app = new Hono();

app.use('*', authMiddleware);

const depositRefundSchema = z.object({
  refundDate: z.string().min(1, '请填写退款日期'),
  refundAmount: z.number().min(0, '退款金额不能为负'),
  deductionReason: z.string().optional(),
  note: z.string().optional(),
});

const disputeSchema = z.object({
  title: z.string().min(1, '请填写争议标题'),
  description: z.string().min(1, '请填写争议详情'),
  disputedAmount: z.number().min(0, '争议金额不能为负'),
  assigneeId: z.number().optional(),
});

const disputeCloseSchema = z.object({
  closeNote: z.string().min(1, '请填写处理说明'),
  resolution: z.enum(['customer_wins', 'company_wins', 'partial', 'other']),
});

app.get('/', async (c) => {
  const { page = '1', pageSize = '20', status, apartmentId, customerId, hasDispute, startDate, endDate } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  const conditions = [];
  if (status) conditions.push(eq(deposits.status, status));
  if (apartmentId) conditions.push(eq(deposits.apartmentId, parseInt(apartmentId)));
  if (customerId) conditions.push(eq(deposits.customerId, parseInt(customerId)));
  if (hasDispute === 'true') conditions.push(eq(deposits.hasDispute, true));
  if (hasDispute === 'false') conditions.push(eq(deposits.hasDispute, false));
  if (startDate) conditions.push(sql`${deposits.receivedDate} >= ${startDate}`);
  if (endDate) conditions.push(sql`${deposits.receivedDate} <= ${endDate}`);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = await db.select({
    id: deposits.id,
    amount: deposits.amount,
    receivedDate: deposits.receivedDate,
    status: deposits.status,
    refundDate: deposits.refundDate,
    refundAmount: deposits.refundAmount,
    deductionReason: deposits.deductionReason,
    hasDispute: deposits.hasDispute,
    note: deposits.note,
    apartment: apartments,
    customer: customers,
    lease: leases,
  }).from(deposits)
    .leftJoin(apartments, eq(deposits.apartmentId, apartments.id))
    .leftJoin(customers, eq(deposits.customerId, customers.id))
    .leftJoin(leases, eq(deposits.leaseId, leases.id))
    .where(where)
    .orderBy(desc(deposits.createdAt))
    .limit(parseInt(pageSize))
    .offset(offset);

  const [count] = await db.select({ count: sql`count(*)` }).from(deposits).where(where);

  return c.json({
    list,
    total: parseInt(count.count as string),
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
});

app.post('/:id/refund', adminMiddleware, zValidator('json', depositRefundSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');

  const [deposit] = await db.update(deposits).set({
    status: 'refunded',
    refundDate: data.refundDate,
    refundAmount: data.refundAmount,
    deductionReason: data.deductionReason,
    note: data.note,
    updatedAt: new Date(),
  }).where(eq(deposits.id, id)).returning();

  if (!deposit) {
    return c.json({ error: '押金记录不存在' }, 404);
  }

  return c.json(deposit);
});

app.post('/:id/dispute', zValidator('json', disputeSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user') as AuthUser;
  const data = c.req.valid('json');

  const result = await db.transaction(async (tx) => {
    const [deposit] = await tx.update(deposits).set({ hasDispute: true, updatedAt: new Date() }).where(eq(deposits.id, id)).returning();
    if (!deposit) {
      throw new Error('押金记录不存在');
    }

    const [dispute] = await tx.insert(depositDisputes).values({
      depositId: id,
      title: data.title,
      description: data.description,
      disputedAmount: data.disputedAmount,
      handlerId: data.assigneeId,
      status: 'pending',
    }).returning();

    await tx.insert(todos).values({
      type: 'deposit_dispute',
      refId: dispute.id,
      title: `押金争议: ${data.title}`,
      description: data.description,
      priority: 'high',
      assigneeId: data.assigneeId || user.id,
      status: 'pending',
    });

    return dispute;
  });

  return c.json(result);
});

app.get('/disputes', async (c) => {
  const { page = '1', pageSize = '20', status, handlerId } = c.req.query();
  const user = c.get('user') as AuthUser;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  const conditions = [];
  if (user.role !== 'admin') {
    conditions.push(eq(depositDisputes.handlerId, user.id));
  }
  if (handlerId) conditions.push(eq(depositDisputes.handlerId, parseInt(handlerId)));
  if (status) conditions.push(eq(depositDisputes.status, status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = await db.select({
    id: depositDisputes.id,
    title: depositDisputes.title,
    description: depositDisputes.description,
    disputedAmount: depositDisputes.disputedAmount,
    status: depositDisputes.status,
    closeNote: depositDisputes.closeNote,
    closedAt: depositDisputes.closedAt,
    createdAt: depositDisputes.createdAt,
    deposit: deposits,
    apartment: apartments,
    customer: customers,
  }).from(depositDisputes)
    .leftJoin(deposits, eq(depositDisputes.depositId, deposits.id))
    .leftJoin(apartments, eq(deposits.apartmentId, apartments.id))
    .leftJoin(customers, eq(deposits.customerId, customers.id))
    .where(where)
    .orderBy(desc(depositDisputes.createdAt))
    .limit(parseInt(pageSize))
    .offset(offset);

  const [count] = await db.select({ count: sql`count(*)` }).from(depositDisputes).where(where);

  return c.json({
    list,
    total: parseInt(count.count as string),
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
});

app.post('/disputes/:id/close', zValidator('json', disputeCloseSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user') as AuthUser;
  const { closeNote } = c.req.valid('json');

  const result = await db.transaction(async (tx) => {
    const [dispute] = await tx.update(depositDisputes).set({
      status: 'closed',
      closeNote,
      closedAt: new Date(),
      closedBy: user.id,
    }).where(eq(depositDisputes.id, id)).returning();

    if (!dispute) {
      throw new Error('争议记录不存在');
    }

    await tx.update(todos).set({
      status: 'completed',
      closeNote,
      closedAt: new Date(),
      closedBy: user.id,
    }).where(and(eq(todos.type, 'deposit_dispute'), eq(todos.refId, id)));

    const [deposit] = await tx.select().from(deposits).where(eq(deposits.id, dispute.depositId));
    if (deposit) {
      await tx.update(deposits).set({ hasDispute: false, updatedAt: new Date() }).where(eq(deposits.id, deposit.id));
    }

    return dispute;
  });

  return c.json(result);
});

export default app;
