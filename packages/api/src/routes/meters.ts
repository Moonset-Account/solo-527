import { Hono } from 'hono';
import { db } from '../db/index';
import { meters, zones, devices, energyRecords, auditLogs, users } from '../db/schema';
import { eq, and, or, like, desc, asc, sql, gte } from 'drizzle-orm';

const app = new Hono();

async function getCurrentUser() {
  const user = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  return user[0] || { id: '00000000-0000-0000-0000-000000000000', name: '系统管理员' };
}

async function addAuditLog(input: {
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
}) {
  await db.insert(auditLogs).values({
    userId: input.userId,
    userName: input.userName,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId as any,
    oldValue: input.oldValue,
    newValue: input.newValue,
    ip: input.ip || '127.0.0.1',
  });
}

function parseNum(v: any): number {
  if (v == null) return 0;
  return Number(v);
}

app.get('/', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  const keyword = c.req.query('keyword');
  const zoneId = c.req.query('zoneId');
  const status = c.req.query('status');
  const p = Math.max(1, page);
  const ps = Math.max(1, Math.min(100, pageSize));

  const conditions: any[] = [];
  if (keyword) {
    conditions.push(
      or(
        like(meters.name, `%${keyword}%`),
        like(meters.serialNumber, `%${keyword}%`),
        like(meters.model, `%${keyword}%`)
      )
    );
  }
  if (zoneId) conditions.push(eq(meters.zoneId, zoneId));
  if (status) conditions.push(eq(meters.status, status));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, listResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(meters).where(where),
    db
      .select({
        meter: meters,
        zoneName: zones.name,
      })
      .from(meters)
      .leftJoin(zones, eq(meters.zoneId, zones.id))
      .where(where)
      .orderBy(desc(meters.createdAt))
      .limit(ps)
      .offset((p - 1) * ps),
  ]);

  const total = Number(totalResult[0]?.count || 0);
  const data = listResult.map((row) => ({
    ...row.meter,
    zoneName: row.zoneName,
  }));

  return c.json({ success: true, data: { data, total, page: p, pageSize: ps } });
});

app.get('/list', async (c) => {
  const zoneId = c.req.query('zoneId');
  const conditions: any[] = [];
  if (zoneId) conditions.push(eq(meters.zoneId, zoneId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = await db
    .select()
    .from(meters)
    .where(where)
    .orderBy(asc(meters.name));

  const data = list.map((m) => ({
    ...m,
  }));

  return c.json({ success: true, data });
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db
    .select({
      meter: meters,
      zoneName: zones.name,
    })
    .from(meters)
    .leftJoin(zones, eq(meters.zoneId, zones.id))
    .where(eq(meters.id, id))
    .limit(1);

  const row = result[0];
  if (!row) return c.json({ success: false, error: '表计不存在' }, 404);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [devicesResult, todayRecsResult] = await Promise.all([
    db.select().from(devices).where(eq(devices.meterId, id)).orderBy(asc(devices.name)),
    db
      .select({
        production: sql<string>`sum(${energyRecords.production})`,
        consumption: sql<string>`sum(${energyRecords.consumption})`,
        avgEfficiency: sql<string>`avg(${energyRecords.efficiency})`,
        count: sql<number>`count(*)`,
      })
      .from(energyRecords)
      .where(and(eq(energyRecords.meterId, id), gte(energyRecords.timestamp, today))),
  ]);

  const devicesData = devicesResult.map((d) => ({
    ...d,
    capacity: parseNum(d.capacity),
  }));

  const todayStats = {
    production: Number(todayRecsResult[0]?.production || 0),
    consumption: Number(todayRecsResult[0]?.consumption || 0),
    efficiency: todayRecsResult[0]?.count && todayRecsResult[0].count > 0
      ? Number(todayRecsResult[0].avgEfficiency || 0)
      : 0,
  };

  return c.json({
    success: true,
    data: {
      ...row.meter,
      zoneName: row.zoneName,
      devices: devicesData,
      todayStats: {
        production: Number(todayStats.production.toFixed(1)),
        consumption: Number(todayStats.consumption.toFixed(1)),
        efficiency: Number(todayStats.efficiency.toFixed(2)),
      },
    },
  });
});

app.get('/:id/devices', async (c) => {
  const id = c.req.param('id');
  const meterResult = await db.select().from(meters).where(eq(meters.id, id)).limit(1);
  if (!meterResult[0]) return c.json({ success: false, error: '表计不存在' }, 404);

  const list = await db
    .select({
      device: devices,
      zoneName: zones.name,
    })
    .from(devices)
    .leftJoin(zones, eq(devices.zoneId, zones.id))
    .where(eq(devices.meterId, id))
    .orderBy(asc(devices.name));

  const data = list.map((row) => ({
    ...row.device,
    zoneName: row.zoneName,
    capacity: parseNum(row.device.capacity),
  }));

  return c.json({ success: true, data });
});

app.post('/', async (c) => {
  const body = (c.req as any).valid || (await c.req.json().catch(() => ({})));
  const currentUser = await getCurrentUser();

  const result = await db
    .insert(meters)
    .values({
      zoneId: body.zoneId,
      name: body.name,
      model: body.model || '',
      serialNumber: body.serialNumber || '',
      status: body.status || 'online',
      lastHeartbeat: body.lastHeartbeat ? new Date(body.lastHeartbeat) : new Date(),
      installedAt: body.installedAt ? new Date(body.installedAt) : new Date(),
    })
    .returning();

  const meter = result[0];

  await addAuditLog({
    userId: currentUser.id,
    userName: currentUser.name,
    action: 'create',
    entityType: 'meter',
    entityId: meter.id,
    newValue: meter,
  });

  return c.json({ success: true, data: meter });
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const oldResult = await db.select().from(meters).where(eq(meters.id, id)).limit(1);
  const old = oldResult[0];
  if (!old) return c.json({ success: false, error: '表计不存在' }, 404);

  const body = (c.req as any).valid || (await c.req.json().catch(() => ({})));
  const currentUser = await getCurrentUser();

  const updateData: any = { ...body };
  if (body.lastHeartbeat) updateData.lastHeartbeat = new Date(body.lastHeartbeat);
  if (body.installedAt) updateData.installedAt = new Date(body.installedAt);
  delete updateData.id;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  delete updateData.zoneId;

  const result = await db.update(meters).set(updateData).where(eq(meters.id, id)).returning();
  const updated = result[0];

  await addAuditLog({
    userId: currentUser.id,
    userName: currentUser.name,
    action: 'update',
    entityType: 'meter',
    entityId: id,
    oldValue: old,
    newValue: updated,
  });

  return c.json({ success: true, data: updated });
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const oldResult = await db.select().from(meters).where(eq(meters.id, id)).limit(1);
  const old = oldResult[0];
  if (!old) return c.json({ success: false, error: '表计不存在' }, 404);

  const currentUser = await getCurrentUser();

  await db.delete(meters).where(eq(meters.id, id));

  await addAuditLog({
    userId: currentUser.id,
    userName: currentUser.name,
    action: 'delete',
    entityType: 'meter',
    entityId: id,
    oldValue: old,
  });

  return c.json({ success: true });
});

export default app;
