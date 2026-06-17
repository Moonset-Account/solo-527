import { Hono } from 'hono';
import { store, paginate, auditLog, CURRENT_USER_ID, uid, nowISO } from '../store';

const app = new Hono();

app.get('/', (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  const keyword = c.req.query('keyword')?.toLowerCase();
  const zoneId = c.req.query('zoneId');
  const status = c.req.query('status');
  let list = [...store.meters];
  if (keyword)
    list = list.filter(
      (m) =>
        m.name.toLowerCase().includes(keyword) ||
        m.serialNumber?.toLowerCase().includes(keyword) ||
        m.model?.toLowerCase().includes(keyword)
    );
  if (zoneId) list = list.filter((m) => m.zoneId === zoneId);
  if (status) list = list.filter((m) => m.status === status);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const enriched = list.map((m) => ({
    ...m,
    zoneName: store.zones.find((z) => z.id === m.zoneId)?.name,
  }));
  return c.json({ success: true, data: paginate(enriched, page, pageSize) });
});

app.get('/list', (c) => {
  const zoneId = c.req.query('zoneId');
  let list = store.meters;
  if (zoneId) list = list.filter((m) => m.zoneId === zoneId);
  return c.json({ success: true, data: list });
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const meter = store.meters.find((m) => m.id === id);
  if (!meter) return c.json({ success: false, error: '表计不存在' }, 404);
  const devices = store.devices.filter((d) => d.meterId === id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRecs = store.energyRecords.filter((r) => r.meterId === id && new Date(r.timestamp) >= today);
  return c.json({
    success: true,
    data: {
      ...meter,
      zoneName: store.zones.find((z) => z.id === meter.zoneId)?.name,
      devices,
      todayStats: {
        production: Number(todayRecs.reduce((s, r) => s + Number(r.production), 0).toFixed(1)),
        consumption: Number(todayRecs.reduce((s, r) => s + Number(r.consumption), 0).toFixed(1)),
        efficiency:
          todayRecs.length > 0
            ? Number((todayRecs.reduce((s, r) => s + Number(r.efficiency), 0) / todayRecs.length).toFixed(2))
            : 0,
      },
    },
  });
});

app.post('/', (c) => {
  const body = (c.req as any).valid || {};
  const meter = {
    id: uid(),
    zoneId: body.zoneId,
    name: body.name,
    model: body.model || '',
    serialNumber: body.serialNumber || '',
    status: (body.status as any) || 'online',
    lastHeartbeat: body.lastHeartbeat || nowISO(),
    installedAt: body.installedAt || nowISO(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  store.meters.unshift(meter);
  auditLog({ userId: CURRENT_USER_ID, action: 'create', entityType: 'meter', entityId: meter.id, newValue: meter });
  return c.json({ success: true, data: meter });
});

app.put('/:id', (c) => {
  const id = c.req.param('id');
  const idx = store.meters.findIndex((m) => m.id === id);
  if (idx === -1) return c.json({ success: false, error: '表计不存在' }, 404);
  const old = { ...store.meters[idx] };
  const body = (c.req as any).valid || {};
  store.meters[idx] = { ...store.meters[idx], ...body, updatedAt: nowISO() };
  auditLog({
    userId: CURRENT_USER_ID,
    action: 'update',
    entityType: 'meter',
    entityId: id,
    oldValue: old,
    newValue: store.meters[idx],
  });
  return c.json({ success: true, data: store.meters[idx] });
});

app.delete('/:id', (c) => {
  const id = c.req.param('id');
  const idx = store.meters.findIndex((m) => m.id === id);
  if (idx === -1) return c.json({ success: false, error: '表计不存在' }, 404);
  const old = store.meters.splice(idx, 1)[0];
  auditLog({ userId: CURRENT_USER_ID, action: 'delete', entityType: 'meter', entityId: id, oldValue: old });
  return c.json({ success: true });
});

export default app;
