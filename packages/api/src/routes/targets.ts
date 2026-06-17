import { Hono } from 'hono';
import { store, paginate, auditLog, CURRENT_USER_ID, uid, nowISO } from '../store';

const app = new Hono();

app.get('/', (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  const keyword = c.req.query('keyword')?.toLowerCase();
  const zoneId = c.req.query('zoneId');
  const period = c.req.query('period');
  let list = [...store.energySavingTargets];
  if (keyword) list = list.filter((t) => t.name.toLowerCase().includes(keyword));
  if (zoneId) list = list.filter((t) => !t.zoneId || t.zoneId === zoneId);
  if (period) list = list.filter((t) => t.period === period);
  list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const enriched = list.map((t) => {
    const details = store.energySavingDetails.filter((d) => d.targetId === t.id);
    const saved = details.reduce((s, d) => s + Number(d.savedKwh), 0);
    const progress = Number(t.targetKwh) > 0 ? Math.min(100, (saved / Number(t.targetKwh)) * 100) : 0;
    const totalDays = Math.max(
      1,
      Math.floor((new Date(Math.min(new Date(t.endDate).getTime(), Date.now())).getTime() - new Date(t.startDate).getTime()) / 86400000) + 1
    );
    return {
      ...t,
      zoneName: t.zoneId ? store.zones.find((z) => z.id === t.zoneId)?.name : '全站',
      savedKwh: Number(saved.toFixed(2)),
      progress: Number(progress.toFixed(1)),
      completion: totalDays,
    };
  });
  return c.json({ success: true, data: paginate(enriched, page, pageSize) });
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const t = store.energySavingTargets.find((x) => x.id === id);
  if (!t) return c.json({ success: false, error: '目标不存在' }, 404);
  const details = store.energySavingDetails.filter((d) => d.targetId === id);
  const saved = details.reduce((s, d) => s + Number(d.savedKwh), 0);
  const progress = Number(t.targetKwh) > 0 ? Math.min(100, (saved / Number(t.targetKwh)) * 100) : 0;
  return c.json({
    success: true,
    data: {
      ...t,
      zoneName: t.zoneId ? store.zones.find((z) => z.id === t.zoneId)?.name : '全站',
      savedKwh: Number(saved.toFixed(2)),
      actualKwh: Number(details.reduce((s, d) => s + Number(d.actualKwh), 0).toFixed(2)),
      baselineKwhTotal: Number(details.reduce((s, d) => s + Number(d.baselineKwh), 0).toFixed(2)),
      progress: Number(progress.toFixed(1)),
      detailCount: details.length,
    },
  });
});

app.get('/:id/details', (c) => {
  const id = c.req.param('id');
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '30');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const groupBy = c.req.query('groupBy') || 'day';
  let details = store.energySavingDetails.filter((d) => d.targetId === id);
  if (from) details = details.filter((d) => new Date(d.date) >= new Date(from));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    details = details.filter((d) => new Date(d.date) <= end);
  }
  details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const enriched = details.map((d) => ({
    ...d,
    zoneName: d.zoneId ? store.zones.find((z) => z.id === d.zoneId)?.name : undefined,
    deviceName: d.deviceId ? store.devices.find((x) => x.id === d.deviceId)?.name : undefined,
  }));
  const summary = {
    totalSaved: Number(details.reduce((s, d) => s + Number(d.savedKwh), 0).toFixed(2)),
    totalBaseline: Number(details.reduce((s, d) => s + Number(d.baselineKwh), 0).toFixed(2)),
    totalActual: Number(details.reduce((s, d) => s + Number(d.actualKwh), 0).toFixed(2)),
    avgSavedPerDay:
      details.length > 0
        ? Number((details.reduce((s, d) => s + Number(d.savedKwh), 0) / details.length).toFixed(2))
        : 0,
    savingRate:
      details.reduce((s, d) => s + Number(d.baselineKwh), 0) > 0
        ? Number(
            ((details.reduce((s, d) => s + Number(d.savedKwh), 0) /
              details.reduce((s, d) => s + Number(d.baselineKwh), 0)) *
              100).toFixed(2)
          )
        : 0,
  };
  return c.json({ success: true, data: { ...paginate(enriched, page, pageSize), summary } });
});

app.get('/:id/trend', (c) => {
  const id = c.req.param('id');
  const details = store.energySavingDetails
    .filter((d) => d.targetId === id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const trend = details.map((d) => ({
    date: new Date(d.date).toISOString().slice(0, 10),
    actualKwh: Number(d.actualKwh),
    baselineKwh: Number(d.baselineKwh),
    savedKwh: Number(d.savedKwh),
  }));
  const cumulative: Array<{ date: string; cumulativeSaved: number }> = [];
  let acc = 0;
  for (const d of trend) {
    acc += d.savedKwh;
    cumulative.push({ date: d.date, cumulativeSaved: Number(acc.toFixed(2)) });
  }
  return c.json({ success: true, data: { daily: trend, cumulative } });
});

app.post('/', async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  const t = {
    id: uid(),
    zoneId: body.zoneId,
    name: body.name,
    period: body.period,
    targetKwh: Number(body.targetKwh || 0),
    baselineKwh: Number(body.baselineKwh || 0),
    startDate: body.startDate,
    endDate: body.endDate,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  store.energySavingTargets.unshift(t);
  auditLog({ userId: CURRENT_USER_ID, action: 'create', entityType: 'target', entityId: t.id, newValue: t });
  return c.json({ success: true, data: t });
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const idx = store.energySavingTargets.findIndex((t) => t.id === id);
  if (idx === -1) return c.json({ success: false, error: '目标不存在' }, 404);
  const old = { ...store.energySavingTargets[idx] };
  const body: any = await c.req.json().catch(() => ({}));
  store.energySavingTargets[idx] = {
    ...store.energySavingTargets[idx],
    ...body,
    targetKwh: body.targetKwh != null ? Number(body.targetKwh) : store.energySavingTargets[idx].targetKwh,
    baselineKwh: body.baselineKwh != null ? Number(body.baselineKwh) : store.energySavingTargets[idx].baselineKwh,
    updatedAt: nowISO(),
  };
  auditLog({
    userId: CURRENT_USER_ID,
    action: 'update',
    entityType: 'target',
    entityId: id,
    oldValue: old,
    newValue: store.energySavingTargets[idx],
  });
  return c.json({ success: true, data: store.energySavingTargets[idx] });
});

app.delete('/:id', (c) => {
  const id = c.req.param('id');
  const idx = store.energySavingTargets.findIndex((t) => t.id === id);
  if (idx === -1) return c.json({ success: false, error: '目标不存在' }, 404);
  const old = store.energySavingTargets.splice(idx, 1)[0];
  const detailsRemoved = store.energySavingDetails.filter((d) => d.targetId !== id);
  store.energySavingDetails.length = 0;
  store.energySavingDetails.push(...detailsRemoved);
  auditLog({ userId: CURRENT_USER_ID, action: 'delete', entityType: 'target', entityId: id, oldValue: old });
  return c.json({ success: true });
});

export default app;
