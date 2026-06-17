import { Hono } from 'hono';
import { store, paginate, auditLog, CURRENT_USER_ID, uid, nowISO } from '../store';

const app = new Hono();

app.get('/', (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  const keyword = c.req.query('keyword')?.toLowerCase();
  let list = [...store.zones];
  if (keyword) list = list.filter((z) => z.name.toLowerCase().includes(keyword) || z.description?.toLowerCase().includes(keyword));
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return c.json({ success: true, data: paginate(list, page, pageSize) });
});

app.get('/list', (c) => {
  return c.json({ success: true, data: store.zones });
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const zone = store.zones.find((z) => z.id === id);
  if (!zone) return c.json({ success: false, error: '分区不存在' }, 404);
  const meterIds = store.meters.filter((m) => m.zoneId === id).map((m) => m.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const prodToday = store.energyRecords
    .filter((r) => r.zoneId === id && new Date(r.timestamp) >= today)
    .reduce((s, r) => s + Number(r.production), 0);
  const activeAlerts = store.alerts.filter((a) => a.zoneId === id && (a.status === 'pending' || a.status === 'processing'));
  return c.json({
    success: true,
    data: {
      ...zone,
      stats: {
        meterCount: meterIds.length,
        deviceCount: store.devices.filter((d) => d.zoneId === id).length,
        productionToday: Number(prodToday.toFixed(1)),
        activeAlerts: activeAlerts.length,
        activeCriticalAlerts: activeAlerts.filter((a) => a.level === 'critical').length,
      },
    },
  });
});

app.post('/', (c) => {
  const body = (c.req as any).valid || {};
  const zone = {
    id: uid(),
    name: body.name,
    description: body.description,
    capacity: Number(body.capacity || 0),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  store.zones.unshift(zone);
  auditLog({ userId: CURRENT_USER_ID, action: 'create', entityType: 'zone', entityId: zone.id, newValue: zone });
  return c.json({ success: true, data: zone });
});

app.put('/:id', (c) => {
  const id = c.req.param('id');
  const idx = store.zones.findIndex((z) => z.id === id);
  if (idx === -1) return c.json({ success: false, error: '分区不存在' }, 404);
  const old = { ...store.zones[idx] };
  const body = (c.req as any).valid || {};
  store.zones[idx] = {
    ...store.zones[idx],
    ...body,
    capacity: body.capacity != null ? Number(body.capacity) : store.zones[idx].capacity,
    updatedAt: nowISO(),
  };
  auditLog({
    userId: CURRENT_USER_ID,
    action: 'update',
    entityType: 'zone',
    entityId: id,
    oldValue: old,
    newValue: store.zones[idx],
  });
  return c.json({ success: true, data: store.zones[idx] });
});

app.delete('/:id', (c) => {
  const id = c.req.param('id');
  const idx = store.zones.findIndex((z) => z.id === id);
  if (idx === -1) return c.json({ success: false, error: '分区不存在' }, 404);
  const old = store.zones.splice(idx, 1)[0];
  auditLog({ userId: CURRENT_USER_ID, action: 'delete', entityType: 'zone', entityId: id, oldValue: old });
  return c.json({ success: true });
});

export default app;
