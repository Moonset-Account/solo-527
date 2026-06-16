import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { refundRules, refundRequests, members, users, trainingCamps } from '../db/schema';
import { paginate, parsePagination } from '../lib/utils';

const refundsRouter = new Hono();

const createRuleSchema = z.object({
  campId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  daysFromJoin: z.number().int().min(0).default(0),
  refundRate: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

const createRequestSchema = z.object({
  memberId: z.string().uuid(),
  ruleId: z.string().uuid().optional(),
  reason: z.string().min(1),
  amount: z.number().min(0),
});

const processRequestSchema = z.object({
  status: z.enum(['approved', 'rejected', 'processed']),
  processComment: z.string().optional(),
  processedBy: z.string().uuid().optional(),
});

refundsRouter.get('/rules', async (c) => {
  const { campId } = c.req.query();
  let where: any = undefined;
  if (campId) {
    where = eq(refundRules.campId, campId);
  }
  const rules = await db
    .select()
    .from(refundRules)
    .where(where)
    .orderBy(refundRules.daysFromJoin);
  return c.json(rules);
});

refundsRouter.post('/rules', zValidator('json', createRuleSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db
    .insert(refundRules)
    .values({
      ...data,
      refundRate: data.refundRate !== undefined ? String(data.refundRate) : undefined,
    })
    .returning();
  return c.json(result[0], 201);
});

refundsRouter.put('/rules/:id', zValidator('json', createRuleSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const updateData: any = { ...data, updatedAt: new Date() };
  if (data.refundRate !== undefined) {
    updateData.refundRate = String(data.refundRate);
  }
  const result = await db
    .update(refundRules)
    .set(updateData)
    .where(eq(refundRules.id, id))
    .returning();
  if (result.length === 0) {
    return c.json({ message: '退款规则不存在' }, 404);
  }
  return c.json(result[0]);
});

refundsRouter.delete('/rules/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(refundRules).where(eq(refundRules.id, id)).returning();
  if (result.length === 0) {
    return c.json({ message: '退款规则不存在' }, 404);
  }
  return c.json({ deleted: true, item: result[0] });
});

refundsRouter.get('/requests', async (c) => {
  const { page, pageSize } = parsePagination(c.req.query());
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];

  if (query.status) {
    conditions.push(eq(refundRequests.status, query.status as any));
  }
  if (query.campId) {
    conditions.push(eq(members.campId, query.campId));
  }
  if (query.processedBy) {
    conditions.push(eq(refundRequests.processedBy, query.processedBy));
  }
  if (query.startDate) {
    conditions.push(gte(refundRequests.requestedAt, new Date(query.startDate)));
  }
  if (query.endDate) {
    conditions.push(lte(refundRequests.requestedAt, new Date(query.endDate)));
  }
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const allRequests = await db
    .select({
      id: refundRequests.id,
      memberId: refundRequests.memberId,
      ruleId: refundRequests.ruleId,
      reason: refundRequests.reason,
      amount: refundRequests.amount,
      status: refundRequests.status,
      requestedAt: refundRequests.requestedAt,
      processedBy: refundRequests.processedBy,
      processedAt: refundRequests.processedAt,
      processComment: refundRequests.processComment,
      createdAt: refundRequests.createdAt,
      memberNo: members.memberNo,
      userName: users.name,
      campId: members.campId,
      campName: trainingCamps.name,
      ruleName: refundRules.name,
    })
    .from(refundRequests)
    .leftJoin(members, eq(members.id, refundRequests.memberId))
    .leftJoin(users, eq(users.id, members.userId))
    .leftJoin(trainingCamps, eq(trainingCamps.id, members.campId))
    .leftJoin(refundRules, eq(refundRules.id, refundRequests.ruleId))
    .where(where)
    .orderBy(desc(refundRequests.requestedAt));

  return c.json(paginate(allRequests, page, pageSize));
});

refundsRouter.get('/requests/:id', async (c) => {
  const id = c.req.param('id');
  const req = await db
    .select({
      id: refundRequests.id,
      memberId: refundRequests.memberId,
      ruleId: refundRequests.ruleId,
      reason: refundRequests.reason,
      amount: refundRequests.amount,
      status: refundRequests.status,
      requestedAt: refundRequests.requestedAt,
      processedBy: refundRequests.processedBy,
      processedAt: refundRequests.processedAt,
      processComment: refundRequests.processComment,
      createdAt: refundRequests.createdAt,
      memberNo: members.memberNo,
      userName: users.name,
      userPhone: users.phone,
      campId: members.campId,
      campName: trainingCamps.name,
      ruleName: refundRules.name,
      ruleDays: refundRules.daysFromJoin,
      ruleRate: refundRules.refundRate,
    })
    .from(refundRequests)
    .leftJoin(members, eq(members.id, refundRequests.memberId))
    .leftJoin(users, eq(users.id, members.userId))
    .leftJoin(trainingCamps, eq(trainingCamps.id, members.campId))
    .leftJoin(refundRules, eq(refundRules.id, refundRequests.ruleId))
    .where(eq(refundRequests.id, id));

  if (req.length === 0) {
    return c.json({ message: '退款申请不存在' }, 404);
  }
  return c.json(req[0]);
});

refundsRouter.post('/requests', zValidator('json', createRequestSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db
    .insert(refundRequests)
    .values({
      ...data,
      amount: String(data.amount),
      status: 'pending',
      requestedAt: new Date(),
    })
    .returning();

  return c.json(result[0], 201);
});

refundsRouter.patch('/requests/:id/process', zValidator('json', processRequestSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const updates: any = {
    status: data.status,
    processComment: data.processComment,
    processedBy: data.processedBy,
    processedAt: new Date(),
  };

  const result = await db
    .update(refundRequests)
    .set(updates)
    .where(eq(refundRequests.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ message: '退款申请不存在' }, 404);
  }

  if (data.status === 'approved' || data.status === 'processed') {
    await db
      .update(members)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(eq(members.id, result[0].memberId));
  }

  return c.json(result[0]);
});

export { refundsRouter };
