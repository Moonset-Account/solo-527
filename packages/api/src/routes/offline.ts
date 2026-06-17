import { Hono } from 'hono';
import { store, paginate, auditLog, CURRENT_USER_ID, uid, nowISO } from '../store';

const app = new Hono();

app.get('/', (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  const keyword = c.req.query('keyword')?.toLowerCase();
  const zoneId = c.req.query('zoneId');
  const meterId = c.req.query('meterId');
  const reasonCategory = c.req.query('reasonCategory');
  const status = c.req.query('status');
  const assignee = c.req.query('assignee');
  const from = c.req.query('from');
  const to = c.req.query('to');
  let list = [...store.meterOfflineRecords];
  if (keyword)
    list = list.filter(
      (r) => r.reason.toLowerCase().includes(keyword) || r.resolutionNote?.toLowerCase().includes(keyword)
    );
  if (zoneId) list = list.filter((r) => r.zoneId === zoneId);
  if (meterId) list = list.filter((r) => r.meterId === meterId);
  if (reasonCategory) list = list.filter((r) => r.reasonCategory === reasonCategory);
  if (status) {
    if (status === 'open') list = list.filter((r) => !r.onlineAt);
    else if (status === 'resolved') list = list.filter((r) => r.onlineAt);
  }
  if (assignee) list = list.filter((r) => r.assignee?.includes(assignee));
  if (from) list = list.filter((r) => new Date(r.offlineAt) >= new Date(from));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    list = list.filter((r) => new Date(r.offlineAt) <= end);
  }
  list.sort((a, b) => new Date(b.offlineAt).getTime() - new Date(a.offlineAt).getTime());
  const enriched = list.map((r) => ({
    ...r,
    zoneName: store.zones.find((z) => z.id === r.zoneId)?.name,
    meterName: store.meters.find((m) => m.id === r.meterId)?.name,
    serialNumber: store.meters.find((m) => m.id === r.meterId)?.serialNumber,
  }));
  return c.json({ success: true, data: paginate(enriched, page, pageSize) });
});

app.get('/summary', (c) => {
  const open = store.meterOfflineRecords.filter((r) => !r.onlineAt);
  const resolved = store.meterOfflineRecords.filter((r) => r.onlineAt);
  const categories = store.meterOfflineRecords.reduce(
    (acc, r) => {
      acc[r.reasonCategory] = (acc[r.reasonCategory] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const avgDuration =
    resolved.length > 0
      ? Math.round(resolved.reduce((s, r) => s + (r.durationMinutes || 0), 0) / resolved.length)
      : 0;
  const avgResponse =
    store.meterOfflineRecords.filter((r) => r.responseMinutes != null).length > 0
      ? Math.round(
          store.meterOfflineRecords
            .filter((r) => r.responseMinutes != null)
            .reduce((s, r) => s + (r.responseMinutes || 0), 0) /
            store.meterOfflineRecords.filter((r) => r.responseMinutes != null).length
        )
      : 0;
  const assignees = store.meterOfflineRecords.reduce(
    (acc, r) => {
      if (r.assignee) acc[r.assignee] = (acc[r.assignee] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  return c.json({
    success: true,
    data: {
      total: store.meterOfflineRecords.length,
      open: open.length,
      resolved: resolved.length,
      totalDurationHours: Number(
        (store.meterOfflineRecords.reduce((s, r) => s + (r.durationMinutes || 0), 0) / 60).toFixed(1)
      ),
      avgDurationMinutes: avgDuration,
      avgResponseMinutes: avgResponse,
      categories,
      assignees,
      openRecords: open.map((r) => ({
        ...r,
        zoneName: store.zones.find((z) => z.id === r.zoneId)?.name,
        meterName: store.meters.find((m) => m.id === r.meterId)?.name,
      })),
    },
  });
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const r = store.meterOfflineRecords.find((x) => x.id === id);
  if (!r) return c.json({ success: false, error: '记录不存在' }, 404);
  return c.json({
    success: true,
    data: {
      ...r,
      zoneName: store.zones.find((z) => z.id === r.zoneId)?.name,
      meterName: store.meters.find((m) => m.id === r.meterId)?.name,
      meterModel: store.meters.find((m) => m.id === r.meterId)?.model,
    },
  });
});

app.post('/', async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  const r = {
    id: uid(),
    meterId: body.meterId,
    zoneId: body.zoneId,
    offlineAt: body.offlineAt || nowISO(),
    reason: body.reason,
    reasonCategory: body.reasonCategory || 'unknown',
    assignee: body.assignee,
    acknowledgedAt: body.acknowledgedAt,
    responseMinutes: body.responseMinutes,
    createdAt: nowISO(),
  };
  store.meterOfflineRecords.unshift(r);
  auditLog({ userId: CURRENT_USER_ID, action: 'create', entityType: 'offline', entityId: r.id, newValue: r });
  return c.json({ success: true, data: r });
});

app.post('/:id/acknowledge', async (c) => {
  const id = c.req.param('id');
  const idx = store.meterOfflineRecords.findIndex((r) => r.id === id);
  if (idx === -1) return c.json({ success: false, error: '记录不存在' }, 404);
  const body: any = await c.req.json().catch(() => ({}));
  const old = { ...store.meterOfflineRecords[idx] };
  const offlineT = new Date(store.meterOfflineRecords[idx].offlineAt).getTime();
  const nowT = new Date().getTime();
  const respMin = Math.max(0, Math.round((nowT - offlineT) / 60000));
  store.meterOfflineRecords[idx] = {
    ...store.meterOfflineRecords[idx],
    acknowledgedAt: nowISO(),
    assignee: body.assignee || store.meterOfflineRecords[idx].assignee || CURRENT_USER.name,
    responseMinutes: respMin,
  };
  auditLog({
    userId: CURRENT_USER_ID,
    action: 'acknowledge',
    entityType: 'offline',
    entityId: id,
    oldValue: old,
    newValue: store.meterOfflineRecords[idx],
  });
  return c.json({ success: true, data: store.meterOfflineRecords[idx] });
});

app.post('/:id/resolve', async (c) => {
  const id = c.req.param('id');
  const idx = store.meterOfflineRecords.findIndex((r) => r.id === id);
  if (idx === -1) return c.json({ success: false, error: '记录不存在' }, 404);
  const body: any = await c.req.json().catch(() => ({}));
  const old = { ...store.meterOfflineRecords[idx] };
  const onlineAt = body.onlineAt || nowISO();
  const offlineT = new Date(store.meterOfflineRecords[idx].offlineAt).getTime();
  const onlineT = new Date(onlineAt).getTime();
  const duration = Math.max(0, Math.round((onlineT - offlineT) / 60000));
  store.meterOfflineRecords[idx] = {
    ...store.meterOfflineRecords[idx],
    onlineAt,
    resolvedAt: onlineAt,
    durationMinutes: duration,
    resolutionNote: body.resolutionNote || store.meterOfflineRecords[idx].resolutionNote,
  };
  const mIdx = store.meters.findIndex((m) => m.id === store.meterOfflineRecords[idx].meterId);
  if (mIdx !== -1) {
    store.meters[mIdx] = { ...store.meters[mIdx], status: 'online', lastHeartbeat: onlineAt };
  }
  auditLog({
    userId: CURRENT_USER_ID,
    action: 'resolve',
    entityType: 'offline',
    entityId: id,
    oldValue: old,
    newValue: store.meterOfflineRecords[idx],
  });
  return c.json({ success: true, data: store.meterOfflineRecords[idx] });
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const idx = store.meterOfflineRecords.findIndex((r) => r.id === id);
  if (idx === -1) return c.json({ success: false, error: '记录不存在' }, 404);
  const old = { ...store.meterOfflineRecords[idx] };
  const body: any = await c.req.json().catch(() => ({}));
  store.meterOfflineRecords[idx] = { ...store.meterOfflineRecords[idx], ...body };
  auditLog({
    userId: CURRENT_USER_ID,
    action: 'update',
    entityType: 'offline',
    entityId: id,
    oldValue: old,
    newValue: store.meterOfflineRecords[idx],
  });
  return c.json({ success: true, data: store.meterOfflineRecords[idx] });
});

export default app;
