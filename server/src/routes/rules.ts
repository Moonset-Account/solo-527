import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { ruleVersions } from '../db/schema.js';
import { eq, and, desc, count } from 'drizzle-orm';

const app = new Hono();

const ruleQuerySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('20'),
  category: z.string().optional(),
  isActive: z.string().optional(),
});

const createRuleSchema = z.object({
  name: z.string(),
  category: z.string(),
  version: z.string(),
  content: z.record(z.any()),
  description: z.string().optional(),
  createdBy: z.string().optional(),
});

const activateRuleSchema = z.object({
  activatedBy: z.string().optional(),
});

app.get('/', async (c) => {
  const query = c.req.query();
  const result = ruleQuerySchema.safeParse(query);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { page, pageSize, category, isActive } = result.data;
  const pageNum = parseInt(page, 10);
  const sizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * sizeNum;

  const conditions = [];
  if (category) {
    conditions.push(eq(ruleVersions.category, category));
  }
  if (isActive !== undefined) {
    conditions.push(eq(ruleVersions.isActive, isActive === 'true'));
  }

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(ruleVersions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(ruleVersions.createdAt))
      .limit(sizeNum)
      .offset(offset),
    db
      .select({ count: count(ruleVersions.id) })
      .from(ruleVersions)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  const total = totalResult[0]?.count || 0;

  return c.json({
    items,
    total,
    page: pageNum,
    pageSize: sizeNum,
    totalPages: Math.ceil(total / sizeNum),
  });
});

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const ruleList = await db
    .select()
    .from(ruleVersions)
    .where(eq(ruleVersions.id, id))
    .limit(1);

  const rule = ruleList[0];

  if (!rule) {
    return c.json({ error: 'Rule version not found' }, 404);
  }

  return c.json({ rule });
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const result = createRuleSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const newRules = await db
    .insert(ruleVersions)
    .values({
      ...result.data,
      isActive: false,
    })
    .returning();

  return c.json({ rule: newRules[0] }, 201);
});

app.post('/:id/activate', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json();
  const result = activateRuleSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const ruleList = await db
    .select()
    .from(ruleVersions)
    .where(eq(ruleVersions.id, id))
    .limit(1);

  const rule = ruleList[0];

  if (!rule) {
    return c.json({ error: 'Rule version not found' }, 404);
  }

  await db
    .update(ruleVersions)
    .set({ isActive: false })
    .where(eq(ruleVersions.category, rule.category));

  const activated = await db
    .update(ruleVersions)
    .set({
      isActive: true,
      activatedAt: new Date(),
    })
    .where(eq(ruleVersions.id, id))
    .returning();

  return c.json({ rule: activated[0] });
});

app.post('/:id/deactivate', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const deactivated = await db
    .update(ruleVersions)
    .set({
      isActive: false,
    })
    .where(eq(ruleVersions.id, id))
    .returning();

  if (deactivated.length === 0) {
    return c.json({ error: 'Rule version not found' }, 404);
  }

  return c.json({ rule: deactivated[0] });
});

app.post('/:id/rollback', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const ruleList = await db
    .select()
    .from(ruleVersions)
    .where(eq(ruleVersions.id, id))
    .limit(1);

  const rule = ruleList[0];

  if (!rule) {
    return c.json({ error: 'Rule version not found' }, 404);
  }

  await db
    .update(ruleVersions)
    .set({ isActive: false })
    .where(eq(ruleVersions.category, rule.category));

  const rolledBack = await db
    .update(ruleVersions)
    .set({
      isActive: true,
      activatedAt: new Date(),
    })
    .where(eq(ruleVersions.id, id))
    .returning();

  return c.json({ rule: rolledBack[0], message: 'Rolled back to previous version' });
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const deleted = await db
    .delete(ruleVersions)
    .where(eq(ruleVersions.id, id))
    .returning();

  if (deleted.length === 0) {
    return c.json({ error: 'Rule version not found' }, 404);
  }

  return c.json({ message: 'Rule version deleted successfully' });
});

app.get('/category/:category/active', async (c) => {
  const category = c.req.param('category');

  const ruleList = await db
    .select()
    .from(ruleVersions)
    .where(
      and(
        eq(ruleVersions.category, category),
        eq(ruleVersions.isActive, true)
      )
    )
    .limit(1);

  const rule = ruleList[0];

  if (!rule) {
    return c.json({ error: 'No active rule version found for this category' }, 404);
  }

  return c.json({ rule });
});

export default app;
