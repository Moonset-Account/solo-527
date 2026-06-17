import { Hono } from 'hono';
import { store, paginate, uid, nowISO, CURRENT_USER_ID } from '../store';

const app = new Hono();

app.get('/audit-logs', (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  const userId = c.req.query('userId');
  const entityType = c.req.query('entityType');
  const action = c.req.query('action');
  const from = c.req.query('from');
  const to = c.req.query('to');
  let list = [...store.auditLogs];
  if (userId) list = list.filter((l) => l.userId === userId);
  if (entityType) list = list.filter((l) => l.entityType === entityType);
  if (action) list = list.filter((l) => l.action === action);
  if (from) list = list.filter((l) => new Date(l.createdAt) >= new Date(from));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    list = list.filter((l) => new Date(l.createdAt) <= end);
  }
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return c.json({ success: true, data: paginate(list, page, pageSize) });
});

app.get('/saved-filters', (c) => {
  const page = c.req.query('page');
  const pageParam = page ? Number(page) : undefined;
  const pageSize = c.req.query('pageSize') ? Number(c.req.query('pageSize')) : undefined;
  const pageKey = c.req.query('page');
  let list = store.savedFilters.filter((f) => f.userId === CURRENT_USER_ID);
  const targetPage = c.req.query('pageKey');
  if (targetPage) list = list.filter((f) => f.page === targetPage);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (pageParam && pageSize) {
    return c.json({ success: true, data: paginate(list, pageParam, pageSize) });
  }
  return c.json({ success: true, data: list });
});

app.post('/saved-filters', async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  const f = {
    id: uid(),
    name: body.name,
    page: body.page,
    filters: body.filters || {},
    userId: CURRENT_USER_ID,
    createdAt: nowISO(),
  };
  store.savedFilters.unshift(f);
  return c.json({ success: true, data: f });
});

app.put('/saved-filters/:id', async (c) => {
  const id = c.req.param('id');
  const idx = store.savedFilters.findIndex((f) => f.id === id && f.userId === CURRENT_USER_ID);
  if (idx === -1) return c.json({ success: false, error: '筛选方案不存在' }, 404);
  const body: any = await c.req.json().catch(() => ({}));
  store.savedFilters[idx] = { ...store.savedFilters[idx], ...body };
  return c.json({ success: true, data: store.savedFilters[idx] });
});

app.delete('/saved-filters/:id', (c) => {
  const id = c.req.param('id');
  const idx = store.savedFilters.findIndex((f) => f.id === id && f.userId === CURRENT_USER_ID);
  if (idx === -1) return c.json({ success: false, error: '筛选方案不存在' }, 404);
  store.savedFilters.splice(idx, 1);
  return c.json({ success: true });
});

app.get('/energy-records', (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '100');
  const zoneId = c.req.query('zoneId');
  const meterId = c.req.query('meterId');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const granularity = c.req.query('granularity') || 'hour';
  let list = [...store.energyRecords];
  if (zoneId) list = list.filter((r) => r.zoneId === zoneId);
  if (meterId) list = list.filter((r) => r.meterId === meterId);
  if (from) list = list.filter((r) => new Date(r.timestamp) >= new Date(from));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    list = list.filter((r) => new Date(r.timestamp) <= end);
  }
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const enriched = list.map((r) => ({
    ...r,
    zoneName: store.zones.find((z) => z.id === r.zoneId)?.name,
    meterName: store.meters.find((m) => m.id === r.meterId)?.name,
  }));
  return c.json({ success: true, data: paginate(enriched, page, pageSize) });
});

export default app;
