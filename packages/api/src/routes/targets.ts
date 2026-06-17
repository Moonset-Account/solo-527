import { Hono } from 'hono';
import { db } from '../db/index';
import { energySavingTargets, energySavingDetails, zones, users, auditLogs, devices } from '../db/schema';
import { eq, and, or, like, ilike, desc, gte, lte, sql, count, isNull, asc, inArray } from 'drizzle-orm';

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
  const keyword = c.req.query('keyword')?.toLowerCase();
  const zoneId = c.req.query('zoneId');
  const period = c.req.query('period');

  const conditions: any[] = [];
  if (keyword) {
    conditions.push(ilike(energySavingTargets.name, `%${keyword}%`));
  }
  if (zoneId) {
    conditions.push(or(eq(energySavingTargets.zoneId, zoneId), isNull(energySavingTargets.zoneId)));
  }
  if (period) conditions.push(eq(energySavingTargets.period, period));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalResult = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(energySavingTargets)
    .where(where);
  const total = totalResult[0]?.count || 0;

  const targets = await db
    .select({
      id: energySavingTargets.id,
      zoneId: energySavingTargets.zoneId,
      name: energySavingTargets.name,
      period: energySavingTargets.period,
      targetKwh: energySavingTargets.targetKwh,
      baselineKwh: energySavingTargets.baselineKwh,
      startDate: energySavingTargets.startDate,
      endDate: energySavingTargets.endDate,
      createdAt: energySavingTargets.createdAt,
      updatedAt: energySavingTargets.updatedAt,
      zoneName: zones.name,
    })
    .from(energySavingTargets)
    .leftJoin(zones, eq(energySavingTargets.zoneId, zones.id))
    .where(where)
    .orderBy(desc(energySavingTargets.startDate))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const targetIds = targets.map((t) => t.id);
  let savedData: Record<string, number> = {};
  if (targetIds.length > 0) {
    const savedResults = await db
      .select({
        targetId: energySavingDetails.targetId,
        savedKwh: sql<number>`sum(${energySavingDetails.savedKwh})`.mapWith(Number),
      })
      .from(energySavingDetails)
      .where(inArray(energySavingDetails.targetId, targetIds))
      .groupBy(energySavingDetails.targetId);
    for (const row of savedResults) {
      savedData[row.targetId] = parseNum(row.savedKwh);
    }
  }

  const data = targets.map((t) => {
    const saved = savedData[t.id] || 0;
    const targetKwhNum = parseNum(t.targetKwh);
    const progress = targetKwhNum > 0 ? Math.min(100, (saved / targetKwhNum) * 100) : 0;
    const endDate = new Date(t.endDate);
    const startDate = new Date(t.startDate);
    const now = new Date();
    const effectiveEnd = endDate < now ? endDate : now;
    const totalDays = Math.max(1, Math.floor((effectiveEnd.getTime() - startDate.getTime()) / 86400000) + 1);

    return {
      ...t,
      targetKwh: targetKwhNum,
      baselineKwh: parseNum(t.baselineKwh),
      zoneName: t.zoneId ? t.zoneName : '全站',
      savedKwh: Number(saved.toFixed(2)),
      progress: Number(progress.toFixed(1)),
      completion: totalDays,
    };
  });

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

app.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [target] = await db
    .select({
      id: energySavingTargets.id,
      zoneId: energySavingTargets.zoneId,
      name: energySavingTargets.name,
      period: energySavingTargets.period,
      targetKwh: energySavingTargets.targetKwh,
      baselineKwh: energySavingTargets.baselineKwh,
      startDate: energySavingTargets.startDate,
      endDate: energySavingTargets.endDate,
      createdAt: energySavingTargets.createdAt,
      updatedAt: energySavingTargets.updatedAt,
      zoneName: zones.name,
    })
    .from(energySavingTargets)
    .leftJoin(zones, eq(energySavingTargets.zoneId, zones.id))
    .where(eq(energySavingTargets.id, id))
    .limit(1);

  if (!target) return c.json({ success: false, error: '目标不存在' }, 404);

  const details = await db
    .select({
      savedKwh: energySavingDetails.savedKwh,
      actualKwh: energySavingDetails.actualKwh,
      baselineKwh: energySavingDetails.baselineKwh,
    })
    .from(energySavingDetails)
    .where(eq(energySavingDetails.targetId, id));

  const saved = details.reduce((s, d) => s + parseNum(d.savedKwh), 0);
  const actualTotal = details.reduce((s, d) => s + parseNum(d.actualKwh), 0);
  const baselineTotal = details.reduce((s, d) => s + parseNum(d.baselineKwh), 0);
  const targetKwhNum = parseNum(target.targetKwh);
  const progress = targetKwhNum > 0 ? Math.min(100, (saved / targetKwhNum) * 100) : 0;

  const data = {
    ...target,
    targetKwh: targetKwhNum,
    baselineKwh: parseNum(target.baselineKwh),
    zoneName: target.zoneId ? target.zoneName : '全站',
    savedKwh: Number(saved.toFixed(2)),
    actualKwh: Number(actualTotal.toFixed(2)),
    baselineKwhTotal: Number(baselineTotal.toFixed(2)),
    progress: Number(progress.toFixed(1)),
    detailCount: details.length,
  };

  return c.json({ success: true, data });
});

app.get('/:id/details', async (c) => {
  const id = c.req.param('id');
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '30');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const groupBy = c.req.query('groupBy') || 'day';

  const conditions: any[] = [eq(energySavingDetails.targetId, id)];
  if (from) conditions.push(gte(energySavingDetails.date, new Date(from)));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(energySavingDetails.date, end));
  }
  const where = and(...conditions);

  const totalResult = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(energySavingDetails)
    .where(where);
  const total = totalResult[0]?.count || 0;

  const details = await db
    .select({
      id: energySavingDetails.id,
      targetId: energySavingDetails.targetId,
      date: energySavingDetails.date,
      actualKwh: energySavingDetails.actualKwh,
      baselineKwh: energySavingDetails.baselineKwh,
      savedKwh: energySavingDetails.savedKwh,
      zoneId: energySavingDetails.zoneId,
      deviceId: energySavingDetails.deviceId,
      zoneName: zones.name,
      deviceName: devices.name,
    })
    .from(energySavingDetails)
    .leftJoin(zones, eq(energySavingDetails.zoneId, zones.id))
    .leftJoin(devices, eq(energySavingDetails.deviceId, devices.id))
    .where(where)
    .orderBy(desc(energySavingDetails.date))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const data = details.map((d) => ({
    ...d,
    actualKwh: parseNum(d.actualKwh),
    baselineKwh: parseNum(d.baselineKwh),
    savedKwh: parseNum(d.savedKwh),
  }));

  const allDetails = await db
    .select({
      savedKwh: energySavingDetails.savedKwh,
      baselineKwh: energySavingDetails.baselineKwh,
      actualKwh: energySavingDetails.actualKwh,
    })
    .from(energySavingDetails)
    .where(where);

  const totalSaved = allDetails.reduce((s, d) => s + parseNum(d.savedKwh), 0);
  const totalBaseline = allDetails.reduce((s, d) => s + parseNum(d.baselineKwh), 0);
  const totalActual = allDetails.reduce((s, d) => s + parseNum(d.actualKwh), 0);
  const avgSavedPerDay = allDetails.length > 0 ? totalSaved / allDetails.length : 0;
  const savingRate = totalBaseline > 0 ? (totalSaved / totalBaseline) * 100 : 0;

  const summary = {
    totalSaved: Number(totalSaved.toFixed(2)),
    totalBaseline: Number(totalBaseline.toFixed(2)),
    totalActual: Number(totalActual.toFixed(2)),
    avgSavedPerDay: Number(avgSavedPerDay.toFixed(2)),
    savingRate: Number(savingRate.toFixed(2)),
  };

  return c.json({
    success: true,
    data: {
      data,
      total,
      page,
      pageSize,
      summary,
    },
  });
});

app.get('/:id/trend', async (c) => {
  const id = c.req.param('id');

  const details = await db
    .select({
      date: energySavingDetails.date,
      actualKwh: energySavingDetails.actualKwh,
      baselineKwh: energySavingDetails.baselineKwh,
      savedKwh: energySavingDetails.savedKwh,
    })
    .from(energySavingDetails)
    .where(eq(energySavingDetails.targetId, id))
    .orderBy(asc(energySavingDetails.date));

  const daily = details.map((d) => ({
    date: new Date(d.date).toISOString().slice(0, 10),
    actualKwh: parseNum(d.actualKwh),
    baselineKwh: parseNum(d.baselineKwh),
    savedKwh: parseNum(d.savedKwh),
  }));

  const cumulative: Array<{ date: string; cumulativeSaved: number }> = [];
  let acc = 0;
  for (const d of daily) {
    acc += d.savedKwh;
    cumulative.push({ date: d.date, cumulativeSaved: Number(acc.toFixed(2)) });
  }

  return c.json({ success: true, data: { daily, cumulative } });
});

app.post('/', async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [inserted] = await db
    .insert(energySavingTargets)
    .values({
      zoneId: body.zoneId || null,
      name: body.name,
      period: body.period,
      targetKwh: String(body.targetKwh || 0),
      baselineKwh: String(body.baselineKwh || 0),
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    })
    .returning();

  await writeAudit(currentUser.id, currentUser.name, 'create', 'target', inserted.id, null, inserted);

  return c.json({ success: true, data: inserted });
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [old] = await db.select().from(energySavingTargets).where(eq(energySavingTargets.id, id)).limit(1);
  if (!old) return c.json({ success: false, error: '目标不存在' }, 404);

  const body: any = await c.req.json().catch(() => ({}));

  const updateData: any = {
    updatedAt: new Date(),
  };
  if (body.zoneId !== undefined) updateData.zoneId = body.zoneId || null;
  if (body.name !== undefined) updateData.name = body.name;
  if (body.period !== undefined) updateData.period = body.period;
  if (body.targetKwh !== undefined) updateData.targetKwh = String(body.targetKwh);
  if (body.baselineKwh !== undefined) updateData.baselineKwh = String(body.baselineKwh);
  if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
  if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);

  await db.update(energySavingTargets).set(updateData).where(eq(energySavingTargets.id, id));

  const [updated] = await db.select().from(energySavingTargets).where(eq(energySavingTargets.id, id)).limit(1);

  await writeAudit(currentUser.id, currentUser.name, 'update', 'target', id, old, updated);

  return c.json({ success: true, data: updated });
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [old] = await db.select().from(energySavingTargets).where(eq(energySavingTargets.id, id)).limit(1);
  if (!old) return c.json({ success: false, error: '目标不存在' }, 404);

  await db.delete(energySavingTargets).where(eq(energySavingTargets.id, id));

  await writeAudit(currentUser.id, currentUser.name, 'delete', 'target', id, old, null);

  return c.json({ success: true });
});

export default app;
