import { Hono } from 'hono';
import { db } from '../db/index';
import { meterOfflineRecords, meters, zones, users, auditLogs } from '../db/schema';
import { eq, and, or, like, desc, gte, lte, sql, isNull, count } from 'drizzle-orm';

const app = new Hono();

async function getCurrentUser() {
  const [user] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  return user;
}

function parseNum(val: any): number {
  if (val === null || val === undefined) return 0;
  return Number(val);
}

async function writeAudit(userId: string, userName: string, action: string, entityType: string, entityId: string, oldValue?: any, newValue?: any) {
  await db.insert(auditLogs).values({
    userId,
    userName,
    action,
    entityType,
    entityId,
    oldValue: oldValue || null,
    newValue: newValue || null,
    ip: '127.0.0.1',
  });
}

app.get('/', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  const keyword = c.req.query('keyword');
  const zoneId = c.req.query('zoneId');
  const meterId = c.req.query('meterId');
  const reasonCategory = c.req.query('reasonCategory');
  const status = c.req.query('status');
  const assignee = c.req.query('assignee');
  const from = c.req.query('from');
  const to = c.req.query('to');

  const conditions: any[] = [];
  if (keyword) {
    conditions.push(or(
      like(meterOfflineRecords.reason, `%${keyword}%`),
      like(meterOfflineRecords.resolutionNote, `%${keyword}%`)
    ));
  }
  if (zoneId) conditions.push(eq(meterOfflineRecords.zoneId, zoneId));
  if (meterId) conditions.push(eq(meterOfflineRecords.meterId, meterId));
  if (reasonCategory) conditions.push(eq(meterOfflineRecords.reasonCategory, reasonCategory));
  if (status) {
    if (status === 'open') {
      conditions.push(isNull(meterOfflineRecords.onlineAt));
    } else if (status === 'resolved') {
      conditions.push(sql`${meterOfflineRecords.onlineAt} IS NOT NULL`);
    }
  }
  if (assignee) conditions.push(like(meterOfflineRecords.assignee, `%${assignee}%`));
  if (from) conditions.push(gte(meterOfflineRecords.offlineAt, new Date(from)));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(meterOfflineRecords.offlineAt, end));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalResult = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(meterOfflineRecords)
    .where(where);
  const total = totalResult[0]?.count || 0;

  const data = await db
    .select({
      id: meterOfflineRecords.id,
      meterId: meterOfflineRecords.meterId,
      zoneId: meterOfflineRecords.zoneId,
      offlineAt: meterOfflineRecords.offlineAt,
      onlineAt: meterOfflineRecords.onlineAt,
      durationMinutes: meterOfflineRecords.durationMinutes,
      reason: meterOfflineRecords.reason,
      reasonCategory: meterOfflineRecords.reasonCategory,
      assignee: meterOfflineRecords.assignee,
      acknowledgedAt: meterOfflineRecords.acknowledgedAt,
      resolvedAt: meterOfflineRecords.resolvedAt,
      responseMinutes: meterOfflineRecords.responseMinutes,
      resolutionNote: meterOfflineRecords.resolutionNote,
      createdAt: meterOfflineRecords.createdAt,
      zoneName: zones.name,
      meterName: meters.name,
      serialNumber: meters.serialNumber,
    })
    .from(meterOfflineRecords)
    .leftJoin(zones, eq(meterOfflineRecords.zoneId, zones.id))
    .leftJoin(meters, eq(meterOfflineRecords.meterId, meters.id))
    .where(where)
    .orderBy(desc(meterOfflineRecords.offlineAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return c.json({
    success: true,
    data: {
      data,
      total,
      page,
      pageSize,
    },
  });
});

app.get('/summary', async (c) => {
  const totalResult = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(meterOfflineRecords);
  const total = totalResult[0]?.count || 0;

  const openResult = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(meterOfflineRecords)
    .where(isNull(meterOfflineRecords.onlineAt));
  const open = openResult[0]?.count || 0;

  const resolvedResult = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(meterOfflineRecords)
    .where(sql`${meterOfflineRecords.onlineAt} IS NOT NULL`);
  const resolved = resolvedResult[0]?.count || 0;

  const durationResult = await db
    .select({
      totalDuration: sql<number>`COALESCE(sum(${meterOfflineRecords.durationMinutes}), 0)`.mapWith(Number),
      avgDuration: sql<number>`COALESCE(avg(${meterOfflineRecords.durationMinutes}), 0)`.mapWith(Number),
    })
    .from(meterOfflineRecords)
    .where(sql`${meterOfflineRecords.onlineAt} IS NOT NULL`);
  const totalDurationMinutes = durationResult[0]?.totalDuration || 0;
  const avgDurationMinutes = Math.round(durationResult[0]?.avgDuration || 0);

  const responseResult = await db
    .select({
      avgResponse: sql<number>`COALESCE(avg(${meterOfflineRecords.responseMinutes}), 0)`.mapWith(Number),
    })
    .from(meterOfflineRecords)
    .where(sql`${meterOfflineRecords.responseMinutes} IS NOT NULL`);
  const avgResponseMinutes = Math.round(responseResult[0]?.avgResponse || 0);

  const categoriesResult = await db
    .select({
      reasonCategory: meterOfflineRecords.reasonCategory,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(meterOfflineRecords)
    .groupBy(meterOfflineRecords.reasonCategory);
  const categories: Record<string, number> = {};
  for (const row of categoriesResult) {
    categories[row.reasonCategory] = row.count;
  }

  const assigneesResult = await db
    .select({
      assignee: meterOfflineRecords.assignee,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(meterOfflineRecords)
    .where(sql`${meterOfflineRecords.assignee} IS NOT NULL`)
    .groupBy(meterOfflineRecords.assignee);
  const assignees: Record<string, number> = {};
  for (const row of assigneesResult) {
    if (row.assignee) assignees[row.assignee] = row.count;
  }

  const openRecords = await db
    .select({
      id: meterOfflineRecords.id,
      meterId: meterOfflineRecords.meterId,
      zoneId: meterOfflineRecords.zoneId,
      offlineAt: meterOfflineRecords.offlineAt,
      onlineAt: meterOfflineRecords.onlineAt,
      durationMinutes: meterOfflineRecords.durationMinutes,
      reason: meterOfflineRecords.reason,
      reasonCategory: meterOfflineRecords.reasonCategory,
      assignee: meterOfflineRecords.assignee,
      acknowledgedAt: meterOfflineRecords.acknowledgedAt,
      resolvedAt: meterOfflineRecords.resolvedAt,
      responseMinutes: meterOfflineRecords.responseMinutes,
      resolutionNote: meterOfflineRecords.resolutionNote,
      createdAt: meterOfflineRecords.createdAt,
      zoneName: zones.name,
      meterName: meters.name,
    })
    .from(meterOfflineRecords)
    .leftJoin(zones, eq(meterOfflineRecords.zoneId, zones.id))
    .leftJoin(meters, eq(meterOfflineRecords.meterId, meters.id))
    .where(isNull(meterOfflineRecords.onlineAt))
    .orderBy(desc(meterOfflineRecords.offlineAt));

  return c.json({
    success: true,
    data: {
      total,
      open,
      resolved,
      totalDurationHours: Number((totalDurationMinutes / 60).toFixed(1)),
      avgDurationMinutes,
      avgResponseMinutes,
      categories,
      assignees,
      openRecords,
    },
  });
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [record] = await db
    .select({
      id: meterOfflineRecords.id,
      meterId: meterOfflineRecords.meterId,
      zoneId: meterOfflineRecords.zoneId,
      offlineAt: meterOfflineRecords.offlineAt,
      onlineAt: meterOfflineRecords.onlineAt,
      durationMinutes: meterOfflineRecords.durationMinutes,
      reason: meterOfflineRecords.reason,
      reasonCategory: meterOfflineRecords.reasonCategory,
      assignee: meterOfflineRecords.assignee,
      acknowledgedAt: meterOfflineRecords.acknowledgedAt,
      resolvedAt: meterOfflineRecords.resolvedAt,
      responseMinutes: meterOfflineRecords.responseMinutes,
      resolutionNote: meterOfflineRecords.resolutionNote,
      createdAt: meterOfflineRecords.createdAt,
      zoneName: zones.name,
      meterName: meters.name,
      meterModel: meters.model,
    })
    .from(meterOfflineRecords)
    .leftJoin(zones, eq(meterOfflineRecords.zoneId, zones.id))
    .leftJoin(meters, eq(meterOfflineRecords.meterId, meters.id))
    .where(eq(meterOfflineRecords.id, id))
    .limit(1);

  if (!record) return c.json({ success: false, error: '记录不存在' }, 404);

  return c.json({ success: true, data: record });
});

app.post('/', async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [inserted] = await db
    .insert(meterOfflineRecords)
    .values({
      meterId: body.meterId,
      zoneId: body.zoneId,
      offlineAt: body.offlineAt ? new Date(body.offlineAt) : new Date(),
      reason: body.reason,
      reasonCategory: body.reasonCategory || 'unknown',
      assignee: body.assignee,
      acknowledgedAt: body.acknowledgedAt ? new Date(body.acknowledgedAt) : null,
      responseMinutes: body.responseMinutes,
    })
    .returning();

  await writeAudit(currentUser.id, currentUser.name, 'create', 'offline', inserted.id, null, inserted);

  return c.json({ success: true, data: inserted });
});

app.post('/:id/acknowledge', async (c) => {
  const id = c.req.param('id');
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [old] = await db.select().from(meterOfflineRecords).where(eq(meterOfflineRecords.id, id)).limit(1);
  if (!old) return c.json({ success: false, error: '记录不存在' }, 404);

  const body: any = await c.req.json().catch(() => ({}));

  const offlineTime = new Date(old.offlineAt).getTime();
  const nowTime = new Date().getTime();
  const respMin = Math.max(0, Math.round((nowTime - offlineTime) / 60000));

  await db
    .update(meterOfflineRecords)
    .set({
      acknowledgedAt: new Date(),
      assignee: body.assignee || old.assignee || currentUser.name,
      responseMinutes: respMin,
    })
    .where(eq(meterOfflineRecords.id, id));

  const [updated] = await db.select().from(meterOfflineRecords).where(eq(meterOfflineRecords.id, id)).limit(1);

  await writeAudit(currentUser.id, currentUser.name, 'acknowledge', 'offline', id, old, updated);

  return c.json({ success: true, data: updated });
});

app.post('/:id/resolve', async (c) => {
  const id = c.req.param('id');
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [old] = await db.select().from(meterOfflineRecords).where(eq(meterOfflineRecords.id, id)).limit(1);
  if (!old) return c.json({ success: false, error: '记录不存在' }, 404);

  const body: any = await c.req.json().catch(() => ({}));
  const onlineAt = body.onlineAt ? new Date(body.onlineAt) : new Date();

  const offlineTime = new Date(old.offlineAt).getTime();
  const onlineTime = onlineAt.getTime();
  const duration = Math.max(0, Math.round((onlineTime - offlineTime) / 60000));

  await db
    .update(meterOfflineRecords)
    .set({
      onlineAt,
      resolvedAt: onlineAt,
      durationMinutes: duration,
      resolutionNote: body.resolutionNote || old.resolutionNote,
    })
    .where(eq(meterOfflineRecords.id, id));

  await db
    .update(meters)
    .set({
      status: 'online',
      lastHeartbeat: onlineAt,
      updatedAt: new Date(),
    })
    .where(eq(meters.id, old.meterId));

  const [updated] = await db.select().from(meterOfflineRecords).where(eq(meterOfflineRecords.id, id)).limit(1);

  await writeAudit(currentUser.id, currentUser.name, 'resolve', 'offline', id, old, updated);

  return c.json({ success: true, data: updated });
});

export default app;
