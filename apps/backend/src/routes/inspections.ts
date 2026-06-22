import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { inspectionRecords, devices, users, repairOrders } from '../db/schema';
import { eq, and, desc, gte, lte, ilike, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { logOperation } from '../utils/logger';

export const inspectionRoutes = new Hono();

inspectionRoutes.use('*', authMiddleware);

const inspectionSchema = z.object({
  deviceId: z.number(),
  status: z.enum(['normal', 'abnormal']),
  description: z.string().optional(),
  temperature: z.string().optional(),
  phValue: z.string().optional(),
  chlorineLevel: z.string().optional(),
  images: z.array(z.string()).optional(),
});

inspectionRoutes.get('/', async (c) => {
  const search = c.req.query('search') || '';
  const status = c.req.query('status');
  const deviceId = c.req.query('deviceId');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) {
    conditions.push(eq(inspectionRecords.status, status as any));
  }
  if (deviceId) {
    conditions.push(eq(inspectionRecords.deviceId, parseInt(deviceId)));
  }
  if (startDate) {
    conditions.push(gte(inspectionRecords.inspectionDate, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(inspectionRecords.inspectionDate, new Date(endDate + ' 23:59:59')));
  }

  let query = db
    .select({
      id: inspectionRecords.id,
      deviceId: inspectionRecords.deviceId,
      deviceName: devices.name,
      deviceCode: devices.code,
      inspectorId: inspectionRecords.inspectorId,
      inspectorName: users.name,
      inspectionDate: inspectionRecords.inspectionDate,
      status: inspectionRecords.status,
      description: inspectionRecords.description,
      temperature: inspectionRecords.temperature,
      phValue: inspectionRecords.phValue,
      chlorineLevel: inspectionRecords.chlorineLevel,
    })
    .from(inspectionRecords)
    .leftJoin(devices, eq(inspectionRecords.deviceId, devices.id))
    .leftJoin(users, eq(inspectionRecords.inspectorId, users.id))
    .where(and(...conditions));

  if (search) {
    query = query.where(
      sql`(${devices.name}::text ILIKE ${`%${search}%`} OR ${users.name}::text ILIKE ${`%${search}%`})`
    );
  }

  const [records, total] = await Promise.all([
    query.orderBy(desc(inspectionRecords.inspectionDate)).limit(limit).offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(inspectionRecords)
      .leftJoin(devices, eq(inspectionRecords.deviceId, devices.id))
      .leftJoin(users, eq(inspectionRecords.inspectorId, users.id))
      .where(and(...conditions))
      .then((res) => res[0].count),
  ]);

  return c.json({ data: records, total, page, limit });
});

inspectionRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [record] = await db
    .select({
      id: inspectionRecords.id,
      deviceId: inspectionRecords.deviceId,
      deviceName: devices.name,
      deviceCode: devices.code,
      inspectorId: inspectionRecords.inspectorId,
      inspectorName: users.name,
      inspectionDate: inspectionRecords.inspectionDate,
      status: inspectionRecords.status,
      description: inspectionRecords.description,
      temperature: inspectionRecords.temperature,
      phValue: inspectionRecords.phValue,
      chlorineLevel: inspectionRecords.chlorineLevel,
      images: inspectionRecords.images,
    })
    .from(inspectionRecords)
    .leftJoin(devices, eq(inspectionRecords.deviceId, devices.id))
    .leftJoin(users, eq(inspectionRecords.inspectorId, users.id))
    .where(eq(inspectionRecords.id, id))
    .limit(1);

  if (!record) {
    return c.json({ error: 'Inspection record not found' }, 404);
  }
  return c.json(record);
});

inspectionRoutes.post('/', zValidator('json', inspectionSchema), async (c) => {
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  const [newRecord] = await db
    .insert(inspectionRecords)
    .values({
      ...(data as any),
      inspectorId: payload.userId,
    })
    .returning();

  await db
    .update(devices)
    .set({
      lastInspectionDate: new Date(),
      status: data.status === 'abnormal' ? 'fault' : 'normal',
    })
    .where(eq(devices.id, data.deviceId));

  if (data.status === 'abnormal') {
    await db.insert(repairOrders).values({
      deviceId: data.deviceId,
      inspectionRecordId: newRecord.id,
      reporterId: payload.userId,
      title: `设备异常 - ${data.description || '巡检发现'}`,
      description: data.description || '',
      status: 'pending',
    });
  }

  await logOperation(payload.userId, 'create_inspection', 'inspections', newRecord.id, {
    deviceId: data.deviceId,
    status: data.status,
  });

  return c.json(newRecord, 201);
});
