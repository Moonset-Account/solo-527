import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { devices, inspectionRecords, users } from '../db/schema';
import { eq, and, ilike, desc, gte, lte, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { logOperation } from '../utils/logger';

export const deviceRoutes = new Hono();

deviceRoutes.use('*', authMiddleware);

const deviceSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  category: z.string().min(1).max(50),
  location: z.string().min(1).max(100),
  status: z.enum(['normal', 'warning', 'fault', 'maintenance']).optional(),
  description: z.string().optional(),
  purchaseDate: z.string().optional(),
  lastInspectionDate: z.string().optional(),
  nextInspectionDate: z.string().optional(),
});

deviceRoutes.get('/', async (c) => {
  const search = c.req.query('search') || '';
  const category = c.req.query('category');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(ilike(devices.name, `%${search}%`));
  }
  if (category) {
    conditions.push(eq(devices.category, category));
  }
  if (status) {
    conditions.push(eq(devices.status, status as any));
  }

  const [allDevices, total] = await Promise.all([
    db
      .select()
      .from(devices)
      .where(and(...conditions))
      .orderBy(desc(devices.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(devices)
      .where(and(...conditions))
      .then((res) => res[0].count),
  ]);

  return c.json({ data: allDevices, total, page, limit });
});

deviceRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [device] = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
  if (!device) {
    return c.json({ error: 'Device not found' }, 404);
  }
  return c.json(device);
});

deviceRoutes.post('/', zValidator('json', deviceSchema), async (c) => {
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload') as any;

  const [newDevice] = await db.insert(devices).values(data as any).returning();

  await logOperation(payload.userId, 'create_device', 'devices', newDevice.id, { name: data.name });

  return c.json(newDevice, 201);
});

deviceRoutes.put('/:id', zValidator('json', deviceSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  const [updated] = await db
    .update(devices)
    .set({ ...(data as any), updatedAt: new Date() })
    .where(eq(devices.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Device not found' }, 404);
  }

  await logOperation(payload.userId, 'update_device', 'devices', id, { name: data.name });

  return c.json(updated);
});

deviceRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const payload = c.get('jwtPayload');

  const result = await db.delete(devices).where(eq(devices.id, id));

  if (result.rowCount === 0) {
    return c.json({ error: 'Device not found' }, 404);
  }

  await logOperation(payload.userId, 'delete_device', 'devices', id, {});

  return c.json({ message: 'Device deleted' });
});

deviceRoutes.get('/categories/list', async (c) => {
  const result = await db
    .selectDistinct({ category: devices.category })
    .from(devices)
    .where(sql`${devices.category} is not null`);
  return c.json(result.map((r) => r.category));
});
