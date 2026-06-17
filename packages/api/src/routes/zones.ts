import { Hono } from 'hono';
import { db } from '../db/index';
import { zones, meters, devices, alerts, energyRecords, auditLogs, users } from '../db/schema';
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
  const p = Math.max(1, page);
  const ps = Math.max(1, Math.min(100, pageSize));

  const conditions: any[] = [];
  if (keyword) {
    conditions.push(
      or(
        like(zones.name, `%${keyword}%`),
        like(zones.description, `%${keyword}%`)
      )
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, listResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(zones).where(where),
    db
      .select()
      .from(zones)
      .where(where)
      .orderBy(desc(zones.createdAt))
      .limit(ps)
      .offset((p - 1) * ps),
  ]);

  const total = Number(totalResult[0]?.count || 0);
  const data = listResult.map((z) => ({
    ...z,
    capacity: parseNum(z.capacity),
  }));

  return c.json({ success: true, data: { data, total, page: p, pageSize: ps } });
});

app.get('/list', async (c) => {
  const list = await db.select().from(zones).orderBy(asc(zones.name));
  const data = list.map((z) => ({
    ...z,
    capacity: parseNum(z.capacity),
  }));
  return c.json({ success: true, data });
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const zoneResult = await db.select().from(zones).where(eq(zones.id, id)).limit(1);
  const zone = zoneResult[0];
  if (!zone) return c.json({ success: false, error: '分区不存在' }, 404);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [meterCountResult, deviceCountResult, prodTodayResult, activeAlertsResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(meters).where(eq(meters.zoneId, id)),
    db.select({ count: sql<number>`count(*)` }).from(devices).where(eq(devices.zoneId, id)),
    db
      .select({ sum: sql<string>`sum(${energyRecords.production})` })
      .from(energyRecords)
      .where(and(eq(energyRecords.zoneId, id), gte(energyRecords.timestamp, today))),
    db
      .select({ count: sql<number>`count(*)`, criticalCount: sql<number>`sum(case when ${alerts.level} = 'critical' then 1 else 0 end)` })
      .from(alerts)
      .where(and(eq(alerts.zoneId, id), or(eq(alerts.status, 'pending'), eq(alerts.status, 'processing')))),
  ]);

  const meterCount = Number(meterCountResult[0]?.count || 0);
  const deviceCount = Number(deviceCountResult[0]?.count || 0);
  const productionToday = Number(prodTodayResult[0]?.sum || 0);
  const activeAlerts = Number(activeAlertsResult[0]?.count || 0);
  const activeCriticalAlerts = Number(activeAlertsResult[0]?.criticalCount || 0);

  return c.json({
    success: true,
    data: {
      ...zone,
      capacity: parseNum(zone.capacity),
      stats: {
        meterCount,
        deviceCount,
        productionToday: Number(productionToday.toFixed(1)),
        activeAlerts,
        activeCriticalAlerts,
      },
    },
  });
});

app.post('/', async (c) => {
  const body = (c.req as any).valid || (await c.req.json().catch(() => ({})));
  const currentUser = await getCurrentUser();

  const result = await db
    .insert(zones)
    .values({
      name: body.name,
      description: body.description,
      capacity: String(body.capacity || 0),
    })
    .returning();

  const zone = result[0];
  const zoneData = {
    ...zone,
    capacity: parseNum(zone.capacity),
  };

  await addAuditLog({
    userId: currentUser.id,
    userName: currentUser.name,
    action: 'create',
    entityType: 'zone',
    entityId: zone.id,
    newValue: zoneData,
  });

  return c.json({ success: true, data: zoneData });
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const oldResult = await db.select().from(zones).where(eq(zones.id, id)).limit(1);
  const old = oldResult[0];
  if (!old) return c.json({ success: false, error: '分区不存在' }, 404);

  const body = (c.req as any).valid || (await c.req.json().catch(() => ({})));
  const currentUser = await getCurrentUser();

  const updateData: any = { ...body };
  if (body.capacity != null) updateData.capacity = String(body.capacity);
  delete updateData.id;
  delete updateData.createdAt;
  delete updateData.updatedAt;

  const result = await db.update(zones).set(updateData).where(eq(zones.id, id)).returning();
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
    entityType: 'zone',
    entityId: id,
    oldValue: oldData,
    newValue: updatedData,
  });

  return c.json({ success: true, data: updatedData });
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const oldResult = await db.select().from(zones).where(eq(zones.id, id)).limit(1);
  const old = oldResult[0];
  if (!old) return c.json({ success: false, error: '分区不存在' }, 404);

  const currentUser = await getCurrentUser();

  await db.delete(zones).where(eq(zones.id, id));

  const oldData = {
    ...old,
    capacity: parseNum(old.capacity),
  };

  await addAuditLog({
    userId: currentUser.id,
    userName: currentUser.name,
    action: 'delete',
    entityType: 'zone',
    entityId: id,
    oldValue: oldData,
  });

  return c.json({ success: true });
});

export default app;
