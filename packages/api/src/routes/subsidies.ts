import { Hono } from 'hono';
import { db } from '../db/index';
import { subsidyRecords, zones, users, auditLogs } from '../db/schema';
import { eq, and, or, like, desc, gte, lte, sql, count } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const app = new Hono();

const approvedByUser = alias(users, 'approvedByUser');
const updatedByUser = alias(users, 'updatedByUser');

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
  const zoneId = c.req.query('zoneId');
  const status = c.req.query('status');
  const year = c.req.query('year');
  const month = c.req.query('month');
  const keyword = c.req.query('keyword');

  const conditions: any[] = [];
  if (zoneId) conditions.push(eq(subsidyRecords.zoneId, zoneId));
  if (status) conditions.push(eq(subsidyRecords.status, status));
  if (year) {
    conditions.push(sql`EXTRACT(YEAR FROM ${subsidyRecords.periodStart}) = ${year}`);
  }
  if (month) {
    conditions.push(sql`EXTRACT(MONTH FROM ${subsidyRecords.periodStart}) = ${month}`);
  }
  if (keyword) {
    conditions.push(or(like(subsidyRecords.remark, `%${keyword}%`)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalResult = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(subsidyRecords)
    .where(where);
  const total = totalResult[0]?.count || 0;

  const data = await db
    .select({
      id: subsidyRecords.id,
      zoneId: subsidyRecords.zoneId,
      periodStart: subsidyRecords.periodStart,
      periodEnd: subsidyRecords.periodEnd,
      productionKwh: subsidyRecords.productionKwh,
      subsidyRate: subsidyRecords.subsidyRate,
      subsidyAmount: subsidyRecords.subsidyAmount,
      status: subsidyRecords.status,
      approvedBy: subsidyRecords.approvedBy,
      approvedAt: subsidyRecords.approvedAt,
      remark: subsidyRecords.remark,
      updatedBy: subsidyRecords.updatedBy,
      createdAt: subsidyRecords.createdAt,
      updatedAt: subsidyRecords.updatedAt,
      zoneName: zones.name,
      approvedByName: approvedByUser.name,
      updatedByName: updatedByUser.name,
    })
    .from(subsidyRecords)
    .leftJoin(zones, eq(subsidyRecords.zoneId, zones.id))
    .leftJoin(approvedByUser, eq(subsidyRecords.approvedBy, approvedByUser.id))
    .leftJoin(updatedByUser, eq(subsidyRecords.updatedBy, updatedByUser.id))
    .where(where)
    .orderBy(desc(subsidyRecords.periodStart))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const transformed = data.map((item) => ({
    ...item,
    productionKwh: parseNum(item.productionKwh),
    subsidyRate: parseNum(item.subsidyRate),
    subsidyAmount: parseNum(item.subsidyAmount),
  }));

  return c.json({
    success: true,
    data: {
      data: transformed,
      total,
      page,
      pageSize,
    },
  });
});

app.get('/summary', async (c) => {
  const byStatusResult = await db
    .select({
      status: subsidyRecords.status,
      totalAmount: sql<number>`sum(${subsidyRecords.subsidyAmount})`.mapWith(Number),
    })
    .from(subsidyRecords)
    .groupBy(subsidyRecords.status);

  const byStatus: Record<string, number> = {};
  for (const row of byStatusResult) {
    byStatus[row.status] = parseNum(row.totalAmount);
  }

  const byZoneResult = await db
    .select({
      zoneId: zones.id,
      zoneName: zones.name,
      totalAmount: sql<number>`sum(${subsidyRecords.subsidyAmount})`.mapWith(Number),
      totalKwh: sql<number>`sum(${subsidyRecords.productionKwh})`.mapWith(Number),
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(subsidyRecords)
    .leftJoin(zones, eq(subsidyRecords.zoneId, zones.id))
    .groupBy(zones.id, zones.name)
    .orderBy(zones.name);

  const byZone = byZoneResult.map((row) => ({
    zoneId: row.zoneId,
    zoneName: row.zoneName,
    totalAmount: parseNum(row.totalAmount),
    totalKwh: parseNum(row.totalKwh),
    count: row.count,
  }));

  const last12Months: Array<{ month: string; amount: number; production: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);

    const [monthResult] = await db
      .select({
        amount: sql<number>`COALESCE(sum(${subsidyRecords.subsidyAmount}), 0)`.mapWith(Number),
        production: sql<number>`COALESCE(sum(${subsidyRecords.productionKwh}), 0)`.mapWith(Number),
      })
      .from(subsidyRecords)
      .where(
        and(
          gte(subsidyRecords.periodStart, d),
          lte(subsidyRecords.periodStart, next)
        )
      );

    last12Months.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      amount: parseNum(monthResult?.amount || 0),
      production: parseNum(monthResult?.production || 0),
    });
  }

  const [totalResult] = await db
    .select({ totalAmount: sql<number>`COALESCE(sum(${subsidyRecords.subsidyAmount}), 0)`.mapWith(Number) })
    .from(subsidyRecords);

  return c.json({
    success: true,
    data: {
      totalAmount: parseNum(totalResult?.totalAmount || 0),
      byStatus,
      byZone,
      last12Months,
    },
  });
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [record] = await db
    .select({
      id: subsidyRecords.id,
      zoneId: subsidyRecords.zoneId,
      periodStart: subsidyRecords.periodStart,
      periodEnd: subsidyRecords.periodEnd,
      productionKwh: subsidyRecords.productionKwh,
      subsidyRate: subsidyRecords.subsidyRate,
      subsidyAmount: subsidyRecords.subsidyAmount,
      status: subsidyRecords.status,
      approvedBy: subsidyRecords.approvedBy,
      approvedAt: subsidyRecords.approvedAt,
      remark: subsidyRecords.remark,
      updatedBy: subsidyRecords.updatedBy,
      createdAt: subsidyRecords.createdAt,
      updatedAt: subsidyRecords.updatedAt,
      zoneName: zones.name,
      approvedByName: approvedByUser.name,
      updatedByName: updatedByUser.name,
    })
    .from(subsidyRecords)
    .leftJoin(zones, eq(subsidyRecords.zoneId, zones.id))
    .leftJoin(approvedByUser, eq(subsidyRecords.approvedBy, approvedByUser.id))
    .leftJoin(updatedByUser, eq(subsidyRecords.updatedBy, updatedByUser.id))
    .where(eq(subsidyRecords.id, id))
    .limit(1);

  if (!record) return c.json({ success: false, error: '补贴记录不存在' }, 404);

  const transformed = {
    ...record,
    productionKwh: parseNum(record.productionKwh),
    subsidyRate: parseNum(record.subsidyRate),
    subsidyAmount: parseNum(record.subsidyAmount),
  };

  return c.json({ success: true, data: transformed });
});

app.post('/', async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [inserted] = await db
    .insert(subsidyRecords)
    .values({
      zoneId: body.zoneId,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      productionKwh: String(body.productionKwh || 0),
      subsidyRate: String(body.subsidyRate || 0),
      subsidyAmount: String(body.subsidyAmount || 0),
      status: body.status || 'pending',
      remark: body.remark,
      updatedBy: currentUser.id,
    })
    .returning();

  await writeAudit(currentUser.id, currentUser.name, 'create', 'subsidy', inserted.id, null, inserted);

  return c.json({ success: true, data: inserted });
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [old] = await db.select().from(subsidyRecords).where(eq(subsidyRecords.id, id)).limit(1);
  if (!old) return c.json({ success: false, error: '记录不存在' }, 404);

  const body: any = await c.req.json().catch(() => ({}));

  const updateData: any = {
    updatedBy: currentUser.id,
    updatedAt: new Date(),
  };
  if (body.zoneId !== undefined) updateData.zoneId = body.zoneId;
  if (body.periodStart !== undefined) updateData.periodStart = new Date(body.periodStart);
  if (body.periodEnd !== undefined) updateData.periodEnd = new Date(body.periodEnd);
  if (body.productionKwh !== undefined) updateData.productionKwh = String(body.productionKwh);
  if (body.subsidyRate !== undefined) updateData.subsidyRate = String(body.subsidyRate);
  if (body.subsidyAmount !== undefined) updateData.subsidyAmount = String(body.subsidyAmount);
  if (body.status !== undefined) updateData.status = body.status;
  if (body.remark !== undefined) updateData.remark = body.remark;

  await db.update(subsidyRecords).set(updateData).where(eq(subsidyRecords.id, id));

  const [updated] = await db.select().from(subsidyRecords).where(eq(subsidyRecords.id, id)).limit(1);

  await writeAudit(currentUser.id, currentUser.name, 'update', 'subsidy', id, old, updated);

  return c.json({ success: true, data: updated });
});

app.post('/:id/approve', async (c) => {
  const id = c.req.param('id');
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [old] = await db.select().from(subsidyRecords).where(eq(subsidyRecords.id, id)).limit(1);
  if (!old) return c.json({ success: false, error: '记录不存在' }, 404);

  await db
    .update(subsidyRecords)
    .set({
      status: 'approved',
      approvedBy: currentUser.id,
      approvedAt: new Date(),
      updatedBy: currentUser.id,
      updatedAt: new Date(),
    })
    .where(eq(subsidyRecords.id, id));

  const [updated] = await db.select().from(subsidyRecords).where(eq(subsidyRecords.id, id)).limit(1);

  await writeAudit(currentUser.id, currentUser.name, 'approve', 'subsidy', id, old, updated);

  return c.json({ success: true, data: updated });
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const currentUser = await getCurrentUser();
  if (!currentUser) return c.json({ success: false, error: '用户未找到' }, 401);

  const [old] = await db.select().from(subsidyRecords).where(eq(subsidyRecords.id, id)).limit(1);
  if (!old) return c.json({ success: false, error: '记录不存在' }, 404);

  await db.delete(subsidyRecords).where(eq(subsidyRecords.id, id));

  await writeAudit(currentUser.id, currentUser.name, 'delete', 'subsidy', id, old, null);

  return c.json({ success: true });
});

export default app;
