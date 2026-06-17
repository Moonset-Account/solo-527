import { Hono } from 'hono';
import { store, paginate, auditLog, CURRENT_USER_ID, uid, nowISO } from '../store';

const app = new Hono();

app.get('/', (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  const keyword = c.req.query('keyword')?.toLowerCase();
  const zoneId = c.req.query('zoneId');
  const meterId = c.req.query('meterId');
  const type = c.req.query('type');
  const status = c.req.query('status');
  let list = [...store.devices];
  if (keyword)
    list = list.filter(
      (d) =>
        d.name.toLowerCase().includes(keyword) ||
        d.serialNumber?.toLowerCase().includes(keyword) ||
        d.model?.toLowerCase().includes(keyword)
    );
  if (zoneId) list = list.filter((d) => d.zoneId === zoneId);
  if (meterId) list = list.filter((d) => d.meterId === meterId);
  if (type) list = list.filter((d) => d.type === type);
  if (status) list = list.filter((d) => d.status === status);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const enriched = list.map((d) => ({
    ...d,
    zoneName: store.zones.find((z) => z.id === d.zoneId)?.name,
    meterName: store.meters.find((m) => m.id === d.meterId)?.name,
    activeAlerts: store.alerts.filter((a) => a.deviceId === d.id && (a.status === 'pending' || a.status === 'processing')).length,
  }));
  return c.json({ success: true, data: paginate(enriched, page, pageSize) });
});

app.get('/list', (c) => {
  const zoneId = c.req.query('zoneId');
  let list = store.devices;
  if (zoneId) list = list.filter((d) => d.zoneId === zoneId);
  return c.json({ success: true, data: list });
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const device = store.devices.find((d) => d.id === id);
  if (!device) return c.json({ success: false, error: '设备不存在' }, 404);
  return c.json({
    success: true,
    data: {
      ...device,
      zoneName: store.zones.find((z) => z.id === device.zoneId)?.name,
      meterName: store.meters.find((m) => m.id === device.meterId)?.name,
      alerts: store.alerts.filter((a) => a.deviceId === id).slice(0, 20),
    },
  });
});

app.post('/', (c) => {
  const body = (c.req as any).valid || {};
  const device = {
    id: uid(),
    zoneId: body.zoneId,
    meterId: body.meterId,
    name: body.name,
    type: body.type,
    model: body.model || '',
    serialNumber: body.serialNumber || '',
    status: body.status || 'running',
    capacity: Number(body.capacity || 0),
    installedAt: body.installedAt || nowISO(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  store.devices.unshift(device);
  auditLog({ userId: CURRENT_USER_ID, action: 'create', entityType: 'device', entityId: device.id, newValue: device });
  return c.json({ success: true, data: device });
});

app.put('/:id', (c) => {
  const id = c.req.param('id');
  const idx = store.devices.findIndex((d) => d.id === id);
  if (idx === -1) return c.json({ success: false, error: '设备不存在' }, 404);
  const old = { ...store.devices[idx] };
  const body = (c.req as any).valid || {};
  store.devices[idx] = {
    ...store.devices[idx],
    ...body,
    capacity: body.capacity != null ? Number(body.capacity) : store.devices[idx].capacity,
    updatedAt: nowISO(),
  };
  auditLog({
    userId: CURRENT_USER_ID,
    action: 'update',
    entityType: 'device',
    entityId: id,
    oldValue: old,
    newValue: store.devices[idx],
  });
  return c.json({ success: true, data: store.devices[idx] });
});

app.delete('/:id', (c) => {
  const id = c.req.param('id');
  const idx = store.devices.findIndex((d) => d.id === id);
  if (idx === -1) return c.json({ success: false, error: '设备不存在' }, 404);
  const old = store.devices.splice(idx, 1)[0];
  auditLog({ userId: CURRENT_USER_ID, action: 'delete', entityType: 'device', entityId: id, oldValue: old });
  return c.json({ success: true });
});

export default app;
