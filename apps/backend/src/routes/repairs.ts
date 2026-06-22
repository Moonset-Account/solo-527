import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { repairOrders, devices, users } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { logOperation } from '../utils/logger';

export const repairRoutes = new Hono();

repairRoutes.use('*', authMiddleware);

const createRepairSchema = z.object({
  deviceId: z.number(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.number().optional().default(1),
});

const assignRepairSchema = z.object({
  assigneeId: z.number(),
});

const updateRepairSchema = z.object({
  status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'verified', 'closed']),
  repairNotes: z.string().optional(),
  verificationNotes: z.string().optional(),
});

repairRoutes.get('/', async (c) => {
  const status = c.req.query('status');
  const assigneeId = c.req.query('assigneeId');
  const reporterId = c.req.query('reporterId');
  const priority = c.req.query('priority');
  const search = c.req.query('search') || '';
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) {
    conditions.push(eq(repairOrders.status, status as any));
  }
  if (assigneeId) {
    conditions.push(eq(repairOrders.assigneeId, parseInt(assigneeId)));
  }
  if (reporterId) {
    conditions.push(eq(repairOrders.reporterId, parseInt(reporterId)));
  }
  if (priority) {
    conditions.push(eq(repairOrders.priority, parseInt(priority)));
  }

  let query = db
    .select({
      id: repairOrders.id,
      deviceId: repairOrders.deviceId,
      deviceName: devices.name,
      deviceCode: devices.code,
      title: repairOrders.title,
      description: repairOrders.description,
      priority: repairOrders.priority,
      status: repairOrders.status,
      reporterId: repairOrders.reporterId,
      reporterName: users.name,
      assigneeId: repairOrders.assigneeId,
      assigneeName: sql<string>`(SELECT name FROM users WHERE id = ${repairOrders.assigneeId})`.as('assignee_name'),
      reportedAt: repairOrders.reportedAt,
      assignedAt: repairOrders.assignedAt,
      completedAt: repairOrders.completedAt,
    })
    .from(repairOrders)
    .leftJoin(devices, eq(repairOrders.deviceId, devices.id))
    .leftJoin(users, eq(repairOrders.reporterId, users.id))
    .where(and(...conditions));

  if (search) {
    query = query.where(
      sql`(${repairOrders.title} ILIKE ${`%${search}%`} OR ${devices.name}::text ILIKE ${`%${search}%`})`
    );
  }

  const [orders, total] = await Promise.all([
    query.orderBy(desc(repairOrders.createdAt)).limit(limit).offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(repairOrders)
      .leftJoin(devices, eq(repairOrders.deviceId, devices.id))
      .where(and(...conditions))
      .then((res) => res[0].count),
  ]);

  return c.json({ data: orders, total, page, limit });
});

repairRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [order] = await db
    .select({
      id: repairOrders.id,
      deviceId: repairOrders.deviceId,
      deviceName: devices.name,
      deviceCode: devices.code,
      inspectionRecordId: repairOrders.inspectionRecordId,
      title: repairOrders.title,
      description: repairOrders.description,
      priority: repairOrders.priority,
      status: repairOrders.status,
      reporterId: repairOrders.reporterId,
      reporterName: users.name,
      assigneeId: repairOrders.assigneeId,
      reportedAt: repairOrders.reportedAt,
      assignedAt: repairOrders.assignedAt,
      startedAt: repairOrders.startedAt,
      completedAt: repairOrders.completedAt,
      verifiedAt: repairOrders.verifiedAt,
      closedAt: repairOrders.closedAt,
      repairNotes: repairOrders.repairNotes,
      verificationNotes: repairOrders.verificationNotes,
    })
    .from(repairOrders)
    .leftJoin(devices, eq(repairOrders.deviceId, devices.id))
    .leftJoin(users, eq(repairOrders.reporterId, users.id))
    .where(eq(repairOrders.id, id))
    .limit(1);

  if (!order) {
    return c.json({ error: 'Repair order not found' }, 404);
  }
  return c.json(order);
});

repairRoutes.post('/', zValidator('json', createRepairSchema), async (c) => {
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  const [newOrder] = await db
    .insert(repairOrders)
    .values({
      ...data,
      reporterId: payload.userId,
    })
    .returning();

  await db.update(devices).set({ status: 'fault' }).where(eq(devices.id, data.deviceId));

  await logOperation(payload.userId, 'create_repair_order', 'repairs', newOrder.id, {
    deviceId: data.deviceId,
    title: data.title,
  });

  return c.json(newOrder, 201);
});

repairRoutes.put('/:id/assign', zValidator('json', assignRepairSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const { assigneeId } = c.req.valid('json');
  const payload = c.get('jwtPayload');

  const [updated] = await db
    .update(repairOrders)
    .set({
      assigneeId,
      status: 'assigned',
      assignedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(repairOrders.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Repair order not found' }, 404);
  }

  await logOperation(payload.userId, 'assign_repair', 'repairs', id, { assigneeId });

  return c.json(updated);
});

repairRoutes.put('/:id', zValidator('json', updateRepairSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  const updates: Record<string, unknown> = {
    status: data.status,
    updatedAt: new Date(),
  };

  if (data.status === 'in_progress') {
    updates.startedAt = new Date();
  }
  if (data.status === 'completed') {
    updates.completedAt = new Date();
  }
  if (data.status === 'verified') {
    updates.verifiedAt = new Date();
  }
  if (data.status === 'closed') {
    updates.closedAt = new Date();
  }
  if (data.repairNotes !== undefined) {
    updates.repairNotes = data.repairNotes;
  }
  if (data.verificationNotes !== undefined) {
    updates.verificationNotes = data.verificationNotes;
  }

  const [updated] = await db
    .update(repairOrders)
    .set(updates as any)
    .where(eq(repairOrders.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Repair order not found' }, 404);
  }

  if (data.status === 'closed') {
    await db.update(devices).set({ status: 'normal' }).where(eq(devices.id, updated.deviceId));
  }

  await logOperation(payload.userId, `update_repair_status_${data.status}`, 'repairs', id, {
    status: data.status,
  });

  return c.json(updated);
});
