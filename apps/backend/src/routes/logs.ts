import { Hono } from 'hono';
import { db } from '../db';
import { operationLogs, users } from '../db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

export const logRoutes = new Hono();

logRoutes.use('*', authMiddleware);

logRoutes.get('/', async (c) => {
  const module = c.req.query('module');
  const action = c.req.query('action');
  const userId = c.req.query('userId');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  const conditions = [];
  if (module) {
    conditions.push(eq(operationLogs.module, module));
  }
  if (action) {
    conditions.push(eq(operationLogs.action, action));
  }
  if (userId) {
    conditions.push(eq(operationLogs.userId, parseInt(userId)));
  }
  if (startDate) {
    conditions.push(gte(operationLogs.createdAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(operationLogs.createdAt, new Date(endDate + ' 23:59:59')));
  }

  const [logs, total] = await Promise.all([
    db
      .select({
        id: operationLogs.id,
        userId: operationLogs.userId,
        userName: users.name,
        action: operationLogs.action,
        module: operationLogs.module,
        targetId: operationLogs.targetId,
        details: operationLogs.details,
        ip: operationLogs.ip,
        createdAt: operationLogs.createdAt,
      })
      .from(operationLogs)
      .leftJoin(users, eq(operationLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(operationLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(operationLogs)
      .where(and(...conditions))
      .then((res) => res[0].count),
  ]);

  return c.json({ data: logs, total, page, limit });
});
