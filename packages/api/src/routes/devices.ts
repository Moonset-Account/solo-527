import { Hono } from 'hono';
import { db } from '../db/index';
import { devices, zones, meters, alerts, auditLogs, users } from '../db/schema';
import { eq, and, or, like, desc, asc, sql } from 'drizzle-orm';

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
  const meterId = c.req.query('meterId');
  const type = c.req.query('type');
  const status = c.req.query('status');
  const p = Math.max(1, page);
  const ps = Math.max(1, Math.min(100, pageSize));

  const conditions: any[] = [];
  if (keyword) {
    conditions.push(
      or(
        like(devices.name, `%${keyword}%`),
        like(devices.serialNumber, `%${keyword}%`),
        like(devices.model, `%${keyword}%`)
      )
    );
  }
  if (zoneId) conditions.push(eq(devices.zoneId, zoneId));
  if (meterId) conditions.push(eq(devices.meterId, meterId));
  if (type) conditions.push(eq(devices.type, type));
  if (status) conditions.push(eq(devices.status, status));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, listResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(devices).where(where),
    db
      .select({
        device: devices,
        zoneName: zones.name,
        meterName: meters.name,
        activeAlerts: sql<number>`count(${alerts.id}) filter (where ${alerts.status} in ('pending', 'processing'))`,
      })
      .from(devices)
      .leftJoin(zones, eq(devices.zoneId, zones.id))
      .leftJoin(meters, eq(devices.meterId, meters.id))
      .leftJoin(alerts, eq(alerts.deviceId, devices.id))
      .where(where)
      .groupBy(devices.id, zones.name, meters.name)
      .orderBy(desc(devices.createdAt))
      .limit(ps)
      .offset((p - 1) * ps),
  ]);

  const total = Number(totalResult[0]?.count || 0);
  const data = listResult.map((row) => ({
    ...row.device,
    zoneName: row.zoneName,
    meterName: row.meterName,
    capacity: parseNum(row.device.capacity),
    activeAlerts: Number(row.activeAlerts || 0),
  }));

  return c.json({ success: true, data: { data, total, page: p, pageSize: ps } });
});

app.get('/list', async (c) => {
  const zoneId = c.req.query('zoneId');
  const conditions: any[] = [];
  if (zoneId) conditions.push(eq(devices.zoneId, zoneId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = await db
    .select()
    .from(devices)
    .where(where)
    .orderBy(asc(devices.name));

  const data = list.map((d) => ({
    ...d,
    capacity: parseNum(d.capacity),
  }));

  return c.json({ success: true, data });
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db
    .select({
      device: devices,
      zoneName: zones.name,
      meterName: meters.name,
    })
    .from(devices)
    .leftJoin(zones, eq(devices.zoneId, zones.id))
    .leftJoin(meters, eq(devices.meterId, meters.id))
    .where(eq(devices.id, id))
    .limit(1);

  const row = result[0];
  if (!row) return c.json({ success: false, error: '设备不存在' }, 404);

  const alertsResult = await db
    .select()
    .from(alerts)
    .where(eq(alerts.deviceId, id))
    .orderBy(desc(alerts.createdAt))
    .limit(20);

  return c.json({
    success: true,
    data: {
      ...row.device,
      zoneName: row.zoneName,
      meterName: row.meterName,
      capacity: parseNum(row.device.capacity),
      alerts: alertsResult,
    },
  });
});

app.post('/', async (c) => {
  const body = (c.req as any).valid || (await c.req.json().catch(() => ({})));
  const currentUser = await getCurrentUser();

  const result = await db
    .insert(devices)
    .values({
      zoneId: body.zoneId,
      meterId: body.meterId || null,
      name: body.name,
      type: body.type,
      model: body.model || '',
      serialNumber: body.serialNumber || '',
      status: body.status || 'running',
      capacity: String(body.capacity || 0),
      installedAt: body.installedAt ? new Date(body.installedAt) : new Date(),
    })
    .returning();

  const device = result[0];
  const deviceData = {
    ...device,
    capacity: parseNum(device.capacity),
  };

  await addAuditLog({
    userId: currentUser.id,
    userName: currentUser.name,
    action: 'create',
    entityType: 'device',
    entityId: device.id,
    newValue: deviceData,
  });

  return c.json({ success: true, data: deviceData });
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const oldResult = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
  const old = oldResult[0];
  if (!old) return c.json({ success: false, error: '设备不存在' }, 404);

  const body = (c.req as any).valid || (await c.req.json().catch(() => ({})));
  const currentUser = await getCurrentUser();

  const updateData: any = { ...body };
  if (body.capacity != null) updateData.capacity = String(body.capacity);
  if (body.installedAt) updateData.installedAt = new Date(body.installedAt);
  if (body.meterId === null || body.meterId === '') updateData.meterId = null;
  delete updateData.id;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  delete updateData.zoneId;

  const result = await db.update(devices).set(updateData).where(eq(devices.id, id)).returning();
  const updated = result[0];
  const updatedData = {
    ...updated,
    capacity: parseNum(updated.capacity),
  };

  const oldData = {
    ...old,
    capacity: parseNum(old.capacity),
  };

  await addAuditLog({
    userId: currentUser.id,
    userName: currentUser.name,
    action: 'update',
    entityType: 'device',
    entityId: id,
    oldValue: oldData,
    newValue: updatedData,
  });

  return c.json({ success: true, data: updatedData });
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const oldResult = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
  const old = oldResult[0];
  if (!old) return c.json({ success: false, error: '设备不存在' }, 404);

  const currentUser = await getCurrentUser();

  await db.delete(devices).where(eq(devices.id, id));

  const oldData = {
    ...old,
    capacity: parseNum(old.capacity),
  };

  await addAuditLog({
    userId: currentUser.id,
    userName: currentUser.name,
    action: 'delete',
    entityType: 'device',
    entityId: id,
    oldValue: oldData,
  });

  return c.json({ success: true });
});

export default app;
