import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { memberBenefits, members, users } from '../db/schema.js';
import { paginate, parsePagination } from '../lib/utils.js';

const benefitsRouter = new Hono();

const createBenefitSchema = z.object({
  memberId: z.string().uuid(),
  type: z.enum(['discount', 'gift', 'service', 'other']),
  name: z.string().min(1),
  description: z.string().optional(),
  value: z.number().min(0).optional(),
  expiresAt: z.string().optional().transform((s) => (s ? new Date(s) : undefined)),
});

const useBenefitSchema = z.object({
  usedAt: z.string().optional().transform((s) => (s ? new Date(s) : new Date())),
});

benefitsRouter.get('/', async (c) => {
  const { page, pageSize } = parsePagination(c.req.query());
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];

  if (query.memberId) {
    conditions.push(eq(memberBenefits.memberId, query.memberId));
  }
  if (query.type) {
    conditions.push(eq(memberBenefits.type, query.type as any));
  }
  if (query.isUsed === 'true') {
    conditions.push(eq(memberBenefits.isUsed, true));
  } else if (query.isUsed === 'false') {
    conditions.push(eq(memberBenefits.isUsed, false));
  }
  if (query.expiresBefore) {
    conditions.push(
      and(
        eq(memberBenefits.isUsed, false),
        gte(memberBenefits.expiresAt, new Date()),
        lte(memberBenefits.expiresAt, new Date(query.expiresBefore)),
      ),
    );
  }
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const allBenefits = await db
    .select({
      id: memberBenefits.id,
      memberId: memberBenefits.memberId,
      type: memberBenefits.type,
      name: memberBenefits.name,
      description: memberBenefits.description,
      value: memberBenefits.value,
      isUsed: memberBenefits.isUsed,
      usedAt: memberBenefits.usedAt,
      expiresAt: memberBenefits.expiresAt,
      createdAt: memberBenefits.createdAt,
      memberNo: members.memberNo,
      userName: users.name,
    })
    .from(memberBenefits)
    .leftJoin(members, eq(members.id, memberBenefits.memberId))
    .leftJoin(users, eq(users.id, members.userId))
    .where(where)
    .orderBy(desc(memberBenefits.createdAt));

  return c.json(paginate(allBenefits, page, pageSize));
});

benefitsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const benefit = await db
    .select({
      id: memberBenefits.id,
      memberId: memberBenefits.memberId,
      type: memberBenefits.type,
      name: memberBenefits.name,
      description: memberBenefits.description,
      value: memberBenefits.value,
      isUsed: memberBenefits.isUsed,
      usedAt: memberBenefits.usedAt,
      expiresAt: memberBenefits.expiresAt,
      createdAt: memberBenefits.createdAt,
      memberNo: members.memberNo,
      userName: users.name,
      userPhone: users.phone,
    })
    .from(memberBenefits)
    .leftJoin(members, eq(members.id, memberBenefits.memberId))
    .leftJoin(users, eq(users.id, members.userId))
    .where(eq(memberBenefits.id, id));

  if (benefit.length === 0) {
    return c.json({ message: '权益不存在' }, 404);
  }
  return c.json(benefit[0]);
});

benefitsRouter.post('/', zValidator('json', createBenefitSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db
    .insert(memberBenefits)
    .values({
      ...data,
      value: data.value !== undefined ? String(data.value) : undefined,
    })
    .returning();
  return c.json(result[0], 201);
});

benefitsRouter.patch('/:id/use', zValidator('json', useBenefitSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db
    .update(memberBenefits)
    .set({
      isUsed: true,
      usedAt: data.usedAt,
    })
    .where(and(eq(memberBenefits.id, id), eq(memberBenefits.isUsed, false)))
    .returning();
  if (result.length === 0) {
    return c.json({ message: '权益不存在或已使用' }, 404);
  }
  return c.json(result[0]);
});

benefitsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(memberBenefits).where(eq(memberBenefits.id, id)).returning();
  if (result.length === 0) {
    return c.json({ message: '权益不存在' }, 404);
  }
  return c.json({ deleted: true, item: result[0] });
});

export { benefitsRouter };
