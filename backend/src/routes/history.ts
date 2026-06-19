import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { auditLogs } from '../db/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';

const app = new Hono();

app.get('/', async (c) => {
  const { entityType, entityId, operator, from, to, page, limit } = c.req.query();
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
  if (entityId) conditions.push(eq(auditLogs.entityId, entityId));
  if (operator) conditions.push(eq(auditLogs.operator, operator));
  if (from) conditions.push(sql`${auditLogs.createdAt} >= ${new Date(from)}`);
  if (to) conditions.push(sql`${auditLogs.createdAt} <= ${new Date(to)}`);

  const result = await db
    .select()
    .from(auditLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limitNum)
    .offset(offset);

  return c.json({ data: result, page: pageNum, limit: limitNum });
});

app.get('/entity/:entityType/:entityId', async (c) => {
  const { entityType, entityId } = c.req.param();
  const result = await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
    .orderBy(desc(auditLogs.createdAt));
  return c.json({ data: result });
});

export default app;
