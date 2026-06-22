import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { waitlist } from '../db/schema';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { logOperation } from '../utils/logger';

export const waitlistRoutes = new Hono();

waitlistRoutes.use('*', authMiddleware);

const waitlistSchema = z.object({
  customerName: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  courseType: z.string().optional(),
  preferredCoach: z.string().optional(),
  preferredTime: z.string().optional(),
  status: z.enum(['waiting', 'notified', 'enrolled', 'cancelled']).optional(),
  notes: z.string().optional(),
});

waitlistRoutes.get('/', async (c) => {
  const status = c.req.query('status');
  const courseType = c.req.query('courseType');
  const preferredCoach = c.req.query('preferredCoach');
  const search = c.req.query('search') || '';
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) {
    conditions.push(eq(waitlist.status, status as any));
  }
  if (courseType) {
    conditions.push(eq(waitlist.courseType, courseType));
  }
  if (preferredCoach) {
    conditions.push(eq(waitlist.preferredCoach, preferredCoach));
  }

  let query = db.select().from(waitlist).where(and(...conditions));

  if (search) {
    query = query.where(
      sql`(${waitlist.customer_name} ILIKE ${`%${search}%`} OR ${waitlist.phone} ILIKE ${`%${search}%`})`
    );
  }

  const [items, total] = await Promise.all([
    query.orderBy(desc(waitlist.createdAt)).limit(limit).offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(waitlist)
      .where(and(...conditions))
      .then((res) => res[0].count),
  ]);

  return c.json({ data: items, total, page, limit });
});

waitlistRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [item] = await db.select().from(waitlist).where(eq(waitlist.id, id)).limit(1);
  if (!item) {
    return c.json({ error: 'Waitlist entry not found' }, 404);
  }
  return c.json(item);
});

waitlistRoutes.post('/', zValidator('json', waitlistSchema), async (c) => {
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  const [newItem] = await db.insert(waitlist).values(data as any).returning();

  await logOperation(payload.userId, 'create_waitlist', 'waitlist', newItem.id, {
    customerName: data.customerName,
  });

  return c.json(newItem, 201);
});

waitlistRoutes.put('/:id', zValidator('json', waitlistSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  const [updated] = await db
    .update(waitlist)
    .set({ ...(data as any), updatedAt: new Date() })
    .where(eq(waitlist.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Waitlist entry not found' }, 404);
  }

  await logOperation(payload.userId, 'update_waitlist', 'waitlist', id, {
    status: data.status,
  });

  return c.json(updated);
});

waitlistRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const payload = c.get('jwtPayload');

  const result = await db.delete(waitlist).where(eq(waitlist.id, id));

  if (result.rowCount === 0) {
    return c.json({ error: 'Waitlist entry not found' }, 404);
  }

  await logOperation(payload.userId, 'delete_waitlist', 'waitlist', id, {});

  return c.json({ message: 'Waitlist entry deleted' });
});
