import { Hono } from 'hono';
import { db } from '../db/index';
import { alerts, alertActivities, users, zones, devices, auditLogs } from '../db/schema';
import { eq, and, or, like, desc, gte, lte, isNull, sql } from 'drizzle-orm';

const app = new Hono();

async function getCurrentUser() {
  const [user] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  return user;
}

function parseNum(val: any): number {
  if (val === null || val === undefined) return 0;
  return Number(val);
}

app.get('/', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  const keyword = c.req.query('keyword');
  const zoneId = c.req.query('zoneId');
  const deviceId = c.req.query('deviceId');
  const level = c.req.query('level');
  const status = c.req.query('status');
  const assignee = c.req.query('assignee');
  const from = c.req.query('from');
  const to = c.req.query('to');

  const conditions: any[] = [];
  if (keyword) {
    conditions.push(or(like(alerts.title, `%${keyword}%`), like(alerts.description, `%${keyword}%`)));
  }
  if (zoneId) conditions.push(eq(alerts.zoneId, zoneId));
  if (deviceId) conditions.push(eq(alerts.deviceId, deviceId));
  if (level) conditions.push(eq(alerts.level, level));
  if (status) conditions.push(eq(alerts.status, status));
  if (assignee) conditions.push(like(alerts.assignee, `%${assignee}%`));
  if (from) conditions.push(gte(alerts.createdAt, new Date(from)));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(alerts.createdAt, end));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const levelOrder = sql`CASE ${alerts.level}
    WHEN 'critical' THEN 0
    WHEN 'warning' THEN 1
    WHEN 'info' THEN 2
    ELSE 3 END`;

  const totalResult = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(alerts)
    .where(where);
  const total = totalResult[0]?.count || 0;

  const data = await db
    .select({
      id: alerts.id,
      deviceId: alerts.deviceId,
      zoneId: alerts.zoneId,
      level: alerts.level,
      title: alerts.title,
      description: alerts.description,
      status: alerts.status,
      assignee: alerts.assignee,
      acknowledgedBy: alerts.acknowledgedBy,
      acknowledgedAt: alerts.acknowledgedAt,
      resolvedBy: alerts.resolvedBy,
      resolvedAt: alerts.resolvedAt,
      sourceData: alerts.sourceData,
      createdAt: alerts.createdAt,
      updatedAt: alerts.updatedAt,
      zoneName: zones.name,
      deviceName: devices.name,
    })
    .from(alerts)
    .leftJoin(zones, eq(alerts.zoneId, zones.id))
    .leftJoin(devices, eq(alerts.deviceId, devices.id))
    .where(where)
    .orderBy(levelOrder, desc(alerts.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const summary = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      critical: sql<number>`sum(case when ${alerts.level} = 'critical' then 1 else 0 end)`.mapWith(Number),
      warning: sql<number>`sum(case when ${alerts.level} = 'warning' then 1 else 0 end)`.mapWith(Number),
      info: sql<number>`sum(case when ${alerts.level} = 'info' then 1 else 0 end)`.mapWith(Number),
      pending: sql<number>`sum(case when ${alerts.status} = 'pending' then 1 else 0 end)`.mapWith(Number),
      processing: sql<number>`sum(case when ${alerts.status} = 'processing' then 1 else 0 end)`.mapWith(Number),
      resolved: sql<number>`sum(case when ${alerts.status} = 'resolved' then 1 else 0 end)`.mapWith(Number),
    })
    .from(alerts)
    .where(where);

  return c.json({
    success: true,
    data: {
      data,
      total,
      page,
      pageSize,
      summary: summary[0] || { total: 0, critical: 0, warning: 0, info: 0, pending: 0, processing: 0, resolved: 0 },
    },
  });
});

app.get('/pending-reminders', async (c) => {
  const thresholdMinutes = Number(c.req.query('threshold') || '30');
  const thresholdMs = thresholdMinutes * 60 * 1000;
  const now = new Date();

  const data = await db
    .select({
      id: alerts.id,
      deviceId: alerts.deviceId,
      zoneId: alerts.zoneId,
      level: alerts.level,
      title: alerts.title,
      description: alerts.description,
      status: alerts.status,
      assignee: alerts.assignee,
      createdAt: alerts.createdAt,
      zoneName: zones.name,
      deviceName: devices.name,
      waitingMinutes: sql<number>`EXTRACT(EPOCH FROM (${now} - ${alerts.createdAt})) / 60`.mapWith(Number),
    })
    .from(alerts)
    .leftJoin(zones, eq(alerts.zoneId, zones.id))
    .leftJoin(devices, eq(alerts.deviceId, devices.id))
    .where(
      and(
        or(eq(alerts.status, 'pending'), eq(alerts.status, 'processing')),
        sql`EXTRACT(EPOCH FROM (NOW() - ${alerts.createdAt})) > ${thresholdMinutes * 60}`
      )
    )
    .orderBy(desc(sql`waiting_minutes`))
    .limit(20);

  return c.json({ success: true, data });
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [alert] = await db
    .select({
      id: alerts.id,
      deviceId: alerts.deviceId,
      zoneId: alerts.zoneId,
      level: alerts.level,
      title: alerts.title,
      description: alerts.description,
      status: alerts.status,
      assignee: alerts.assignee,
      acknowledgedBy: alerts.acknowledgedBy,
      acknowledgedAt: alerts.acknowledgedAt,
      resolvedBy: alerts.resolvedBy,
      resolvedAt: alerts.resolvedAt,
      sourceData: alerts.sourceData,
      createdAt: alerts.createdAt,
      updatedAt: alerts.updatedAt,
      zoneName: zones.name,
      deviceName: devices.name,
    })
    .from(alerts)
    .leftJoin(zones, eq(alerts.zoneId, zones.id))
    .leftJoin(devices, eq(alerts.deviceId, devices.id))
    .where(eq(alerts.id, id))
    .limit(1);

  if (!alert) return c.json({ success: false, error: '告警不存在' }, 404);

  const [device] = await db.select().from(devices).where(eq(devices.id, alert.deviceId)).limit(1);

  const activities = await db
    .select()
    .from(alertActivities)
    .where(eq(alertActivities.alertId, id))
    .orderBy(alertActivities.createdAt);

  return c.json({
    success: true,
    data: {
      ...alert,
      device,
      activities,
    },
  });
});

async function addActivity(alertId: string, operatorId: string, operatorName: string, action: string, note?: string) {
  await db.insert(alertActivities).values({
    alertId,
    operatorId,
    operatorName,
    action,
    note,
  });
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

app.post('/:id/acknowledge', async (c) => {
  const id = c.req.param('id');
  const body: any = await c.req.json().catch(() => ({}));
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [old] = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
  if (!old) return c.json({ success: false, error: '告警不存在' }, 404);

  await db
    .update(alerts)
    .set({
      status: 'processing',
      acknowledgedBy: currentUser.id,
      acknowledgedAt: new Date(),
      assignee: body?.assignee || currentUser.name,
      updatedAt: new Date(),
    })
    .where(eq(alerts.id, id));

  const [updated] = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);

  await addActivity(id, currentUser.id, currentUser.name, 'acknowledge', body?.note || '已确认告警，开始处理');
  await writeAudit(currentUser.id, currentUser.name, 'acknowledge', 'alert', id, old, updated);

  return c.json({ success: true, data: updated });
});

app.post('/:id/assign', async (c) => {
  const id = c.req.param('id');
  const body: any = await c.req.json().catch(() => ({}));
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [old] = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
  if (!old) return c.json({ success: false, error: '告警不存在' }, 404);
  if (!body?.assignee) return c.json({ success: false, error: '请指定处理人' }, 400);

  const newStatus = old.status === 'pending' ? 'processing' : old.status;
  await db
    .update(alerts)
    .set({
      assignee: body.assignee,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(alerts.id, id));

  const [updated] = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);

  await addActivity(id, currentUser.id, currentUser.name, 'assign', `指派给：${body.assignee}。${body.note || ''}`);
  await writeAudit(currentUser.id, currentUser.name, 'assign', 'alert', id, old, updated);

  return c.json({ success: true, data: updated });
});

app.post('/:id/resolve', async (c) => {
  const id = c.req.param('id');
  const body: any = await c.req.json().catch(() => ({}));
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [old] = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
  if (!old) return c.json({ success: false, error: '告警不存在' }, 404);

  await db
    .update(alerts)
    .set({
      status: 'resolved',
      resolvedBy: currentUser.id,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(alerts.id, id));

  const [updated] = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);

  await addActivity(id, currentUser.id, currentUser.name, 'resolve', body?.note || '问题已修复并确认恢复');
  await writeAudit(currentUser.id, currentUser.name, 'resolve', 'alert', id, old, updated);

  return c.json({ success: true, data: updated });
});

app.post('/:id/ignore', async (c) => {
  const id = c.req.param('id');
  const body: any = await c.req.json().catch(() => ({}));
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [old] = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
  if (!old) return c.json({ success: false, error: '告警不存在' }, 404);

  await db
    .update(alerts)
    .set({
      status: 'ignored',
      acknowledgedBy: currentUser.id,
      acknowledgedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(alerts.id, id));

  const [updated] = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);

  await addActivity(id, currentUser.id, currentUser.name, 'ignore', body?.note || '经确认属于误报，忽略此告警');
  await writeAudit(currentUser.id, currentUser.name, 'ignore', 'alert', id, old, updated);

  return c.json({ success: true, data: updated });
});

app.post('/:id/comment', async (c) => {
  const id = c.req.param('id');
  const body: any = await c.req.json().catch(() => ({}));
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [exists] = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
  if (!exists) return c.json({ success: false, error: '告警不存在' }, 404);
  if (!body?.note) return c.json({ success: false, error: '请输入备注内容' }, 400);

  await addActivity(id, currentUser.id, currentUser.name, 'comment', body.note);
  return c.json({ success: true });
});

app.post('/', async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const now = new Date();
  const [inserted] = await db
    .insert(alerts)
    .values({
      deviceId: body.deviceId,
      zoneId: body.zoneId,
      level: body.level || 'warning',
      title: body.title,
      description: body.description,
      status: 'pending',
      sourceData: body.sourceData,
    })
    .returning();

  await addActivity(inserted.id, currentUser.id, currentUser.name, 'create', '人工上报告警');
  await writeAudit(currentUser.id, currentUser.name, 'create', 'alert', inserted.id, null, inserted);

  return c.json({ success: true, data: inserted });
});

export default app;
