import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { pricingRules } from '../db/schema';
import { eq, and, desc, sql, isNull, or, gte, lte } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { logOperation } from '../utils/logger';

export const pricingRoutes = new Hono();

pricingRoutes.use('*', authMiddleware);

const pricingSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().min(1).max(50),
  price: z.string(),
  duration: z.number().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

pricingRoutes.get('/', async (c) => {
  const type = c.req.query('type');
  const isActive = c.req.query('isActive');
  const search = c.req.query('search') || '';
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  const conditions = [];
  if (type) {
    conditions.push(eq(pricingRules.type, type));
  }
  if (isActive) {
    conditions.push(eq(pricingRules.isActive, isActive === 'true'));
  }

  let query = db.select().from(pricingRules).where(and(...conditions));

  if (search) {
    query = query.where(
      sql`(${pricingRules.name} ILIKE ${`%${search}%`} OR ${pricingRules.type} ILIKE ${`%${search}%`})`
    );
  }

  const [rules, total] = await Promise.all([
    query.orderBy(desc(pricingRules.createdAt)).limit(limit).offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(pricingRules)
      .where(and(...conditions))
      .then((res) => res[0].count),
  ]);

  return c.json({ data: rules, total, page, limit });
});

pricingRoutes.get('/active', async (c) => {
  const type = c.req.query('type');
  const now = new Date();

  const conditions = [eq(pricingRules.isActive, true)];
  if (type) {
    conditions.push(eq(pricingRules.type, type));
  }

  const rules = await db
    .select()
    .from(pricingRules)
    .where(
      and(
        ...conditions,
        or(
          isNull(pricingRules.validFrom),
          lte(pricingRules.validFrom, now)
        ),
        or(
          isNull(pricingRules.validTo),
          gte(pricingRules.validTo, now)
        )
      )
    )
    .orderBy(pricingRules.name);

  return c.json(rules);
});

pricingRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [rule] = await db.select().from(pricingRules).where(eq(pricingRules.id, id)).limit(1);
  if (!rule) {
    return c.json({ error: 'Pricing rule not found' }, 404);
  }
  return c.json(rule);
});

pricingRoutes.post('/', zValidator('json', pricingSchema), async (c) => {
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  const values: any = {
    name: data.name,
    type: data.type,
    price: data.price,
    duration: data.duration,
    description: data.description,
    isActive: data.isActive,
  };
  if (data.validFrom) values.validFrom = new Date(data.validFrom);
  if (data.validTo) values.validTo = new Date(data.validTo);

  const [newRule] = await db.insert(pricingRules).values(values).returning();

  await logOperation(payload.userId, 'create_pricing', 'pricing', newRule.id, {
    name: data.name,
    price: data.price,
  });

  return c.json(newRule, 201);
});

pricingRoutes.put('/:id', zValidator('json', pricingSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  const values: any = {
    name: data.name,
    type: data.type,
    price: data.price,
    duration: data.duration,
    description: data.description,
    isActive: data.isActive,
    updatedAt: new Date(),
  };
  if (data.validFrom) values.validFrom = new Date(data.validFrom);
  if (data.validTo) values.validTo = new Date(data.validTo);

  const [updated] = await db
    .update(pricingRules)
    .set(values)
    .where(eq(pricingRules.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Pricing rule not found' }, 404);
  }

  await logOperation(payload.userId, 'update_pricing', 'pricing', id, {});

  return c.json(updated);
});

pricingRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const payload = c.get('jwtPayload');

  const result = await db.delete(pricingRules).where(eq(pricingRules.id, id));

  if (result.rowCount === 0) {
    return c.json({ error: 'Pricing rule not found' }, 404);
  }

  await logOperation(payload.userId, 'delete_pricing', 'pricing', id, {});

  return c.json({ message: 'Pricing rule deleted' });
});
