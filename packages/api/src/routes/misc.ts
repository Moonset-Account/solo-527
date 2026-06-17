import { Hono } from 'hono';
import { db } from '../db/index';
import { auditLogs, savedFilters, users, energyRecords, zones, meters } from '../db/schema';
import { eq, and, like, desc, asc, sql, gte, lte } from 'drizzle-orm';

const app = new Hono();

async function getCurrentUser() {
  const user = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  return user[0] || { id: '00000000-0000-0000-0000-000000000000', name: '系统管理员' };
}

function parseNum(v: any): number {
  if (v == null) return 0;
  return Number(v);
}

app.get('/audit-logs', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  const userId = c.req.query('userId');
  const entityType = c.req.query('entityType');
  const action = c.req.query('action');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const p = Math.max(1, page);
  const ps = Math.max(1, Math.min(100, pageSize));

  const conditions: any[] = [];
  if (userId) conditions.push(eq(auditLogs.userId, userId));
  if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
  if (action) conditions.push(eq(auditLogs.action, action));
  if (from) conditions.push(gte(auditLogs.createdAt, new Date(from)));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(auditLogs.createdAt, end));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, listResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where),
    db
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(ps)
      .offset((p - 1) * ps),
  ]);

  const total = Number(totalResult[0]?.count || 0);
  const data = listResult.map((log) => ({
    ...log,
    oldValue: log.oldValue,
    newValue: log.newValue,
  }));

  return c.json({ success: true, data: { data, total, page: p, pageSize: ps } });
});

app.get('/saved-filters', async (c) => {
  const currentUser = await getCurrentUser();
  const pageKey = c.req.query('pageKey');
  const pageParam = c.req.query('page') ? Number(c.req.query('page')) : undefined;
  const pageSize = c.req.query('pageSize') ? Number(c.req.query('pageSize')) : undefined;

  const conditions: any[] = [eq(savedFilters.userId, currentUser.id)];
  if (pageKey) conditions.push(eq(savedFilters.page, pageKey));
  const where = and(...conditions);

  if (pageParam && pageSize) {
    const p = Math.max(1, pageParam);
    const ps = Math.max(1, Math.min(100, pageSize));

    const [totalResult, listResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(savedFilters).where(where),
      db
        .select()
        .from(savedFilters)
        .where(where)
        .orderBy(desc(savedFilters.createdAt))
        .limit(ps)
        .offset((p - 1) * ps),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const data = listResult.map((f) => ({
      ...f,
      filters: f.filters,
    }));

    return c.json({ success: true, data: { data, total, page: p, pageSize: ps } });
  }

  const list = await db
    .select()
    .from(savedFilters)
    .where(where)
    .orderBy(desc(savedFilters.createdAt));

  const data = list.map((f) => ({
    ...f,
    filters: f.filters,
  }));

  return c.json({ success: true, data });
});

app.post('/saved-filters', async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  const currentUser = await getCurrentUser();

  const result = await db
    .insert(savedFilters)
    .values({
      name: body.name,
      page: body.page,
      filters: body.filters || {},
      userId: currentUser.id,
    })
    .returning();

  const f = result[0];
  const filterData = {
    ...f,
    filters: f.filters,
  };

  return c.json({ success: true, data: filterData });
});

app.put('/saved-filters/:id', async (c) => {
  const id = c.req.param('id');
  const currentUser = await getCurrentUser();

  const oldResult = await db
    .select()
    .from(savedFilters)
    .where(and(eq(savedFilters.id, id), eq(savedFilters.userId, currentUser.id)))
    .limit(1);

  if (!oldResult[0]) return c.json({ success: false, error: '筛选方案不存在' }, 404);

  const body: any = await c.req.json().catch(() => ({}));

  const updateData: any = {};
  if (body.name != null) updateData.name = body.name;
  if (body.filters != null) updateData.filters = body.filters;
  if (body.page != null) updateData.page = body.page;

  const result = await db
    .update(savedFilters)
    .set(updateData)
    .where(and(eq(savedFilters.id, id), eq(savedFilters.userId, currentUser.id)))
    .returning();

  const updated = result[0];
  const updatedData = {
    ...updated,
    filters: updated.filters,
  };

  return c.json({ success: true, data: updatedData });
});

app.delete('/saved-filters/:id', async (c) => {
  const id = c.req.param('id');
  const currentUser = await getCurrentUser();

  const oldResult = await db
    .select()
    .from(savedFilters)
    .where(and(eq(savedFilters.id, id), eq(savedFilters.userId, currentUser.id)))
    .limit(1);

  if (!oldResult[0]) return c.json({ success: false, error: '筛选方案不存在' }, 404);

  await db
    .delete(savedFilters)
    .where(and(eq(savedFilters.id, id), eq(savedFilters.userId, currentUser.id)));

  return c.json({ success: true });
});

app.get('/energy-records', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '100');
  const zoneId = c.req.query('zoneId');
  const meterId = c.req.query('meterId');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const p = Math.max(1, page);
  const ps = Math.max(1, Math.min(500, pageSize));

  const conditions: any[] = [];
  if (zoneId) conditions.push(eq(energyRecords.zoneId, zoneId));
  if (meterId) conditions.push(eq(energyRecords.meterId, meterId));
  if (from) conditions.push(gte(energyRecords.timestamp, new Date(from)));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(energyRecords.timestamp, end));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, listResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(energyRecords).where(where),
    db
      .select({
        record: energyRecords,
        zoneName: zones.name,
        meterName: meters.name,
      })
      .from(energyRecords)
      .leftJoin(zones, eq(energyRecords.zoneId, zones.id))
      .leftJoin(meters, eq(energyRecords.meterId, meters.id))
      .where(where)
      .orderBy(desc(energyRecords.timestamp))
      .limit(ps)
      .offset((p - 1) * ps),
  ]);

  const total = Number(totalResult[0]?.count || 0);
  const data = listResult.map((row) => ({
    ...row.record,
    zoneName: row.zoneName,
    meterName: row.meterName,
    production: parseNum(row.record.production),
    consumption: parseNum(row.record.consumption),
    gridExport: parseNum(row.record.gridExport),
    gridImport: parseNum(row.record.gridImport),
    efficiency: parseNum(row.record.efficiency),
  }));

  return c.json({ success: true, data: { data, total, page: p, pageSize: ps } });
});

export default app;
