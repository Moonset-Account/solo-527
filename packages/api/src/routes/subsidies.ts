import { Hono } from 'hono';
import { store, paginate, auditLog, CURRENT_USER_ID, uid, nowISO } from '../store';

const app = new Hono();

app.get('/', (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  const zoneId = c.req.query('zoneId');
  const status = c.req.query('status');
  const year = c.req.query('year');
  const month = c.req.query('month');
  let list = [...store.subsidyRecords];
  if (zoneId) list = list.filter((r) => r.zoneId === zoneId);
  if (status) list = list.filter((r) => r.status === status);
  if (year) list = list.filter((r) => new Date(r.periodStart).getFullYear() === Number(year));
  if (month) list = list.filter((r) => new Date(r.periodStart).getMonth() === Number(month) - 1);
  list.sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
  const enriched = list.map((r) => ({
    ...r,
    zoneName: store.zones.find((z) => z.id === r.zoneId)?.name,
    approvedByName: store.users.find((u) => u.id === r.approvedBy)?.name,
    updatedByName: store.users.find((u) => u.id === r.updatedBy)?.name,
  }));
  return c.json({ success: true, data: paginate(enriched, page, pageSize) });
});

app.get('/summary', (c) => {
  const byStatus = store.subsidyRecords.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + Number(r.subsidyAmount);
      return acc;
    },
    {} as Record<string, number>
  );
  const byZone = store.zones.map((z) => {
    const records = store.subsidyRecords.filter((r) => r.zoneId === z.id);
    return {
      zoneId: z.id,
      zoneName: z.name,
      totalAmount: Number(records.reduce((s, r) => s + Number(r.subsidyAmount), 0).toFixed(2)),
      totalKwh: Number(records.reduce((s, r) => s + Number(r.productionKwh), 0).toFixed(2)),
      count: records.length,
    };
  });
  const last12: Array<{ month: string; amount: number; production: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    const recs = store.subsidyRecords.filter(
      (r) => new Date(r.periodStart) >= d && new Date(r.periodStart) < next
    );
    last12.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      amount: Number(recs.reduce((s, r) => s + Number(r.subsidyAmount), 0).toFixed(2)),
      production: Number(recs.reduce((s, r) => s + Number(r.productionKwh), 0).toFixed(2)),
    });
  }
  return c.json({
    success: true,
    data: {
      totalAmount: Number(
        store.subsidyRecords.reduce((s, r) => s + Number(r.subsidyAmount), 0).toFixed(2)
      ),
      byStatus,
      byZone,
      last12Months: last12,
    },
  });
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const rec = store.subsidyRecords.find((r) => r.id === id);
  if (!rec) return c.json({ success: false, error: '补贴记录不存在' }, 404);
  return c.json({
    success: true,
    data: {
      ...rec,
      zoneName: store.zones.find((z) => z.id === rec.zoneId)?.name,
      approvedByName: store.users.find((u) => u.id === rec.approvedBy)?.name,
      updatedByName: store.users.find((u) => u.id === rec.updatedBy)?.name,
    },
  });
});

app.post('/', async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  const r = {
    id: uid(),
    zoneId: body.zoneId,
    periodStart: body.periodStart,
    periodEnd: body.periodEnd,
    productionKwh: Number(body.productionKwh || 0),
    subsidyRate: Number(body.subsidyRate || 0),
    subsidyAmount: Number(body.subsidyAmount || 0),
    status: body.status || 'pending',
    remark: body.remark,
    updatedBy: CURRENT_USER_ID,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  store.subsidyRecords.unshift(r);
  auditLog({ userId: CURRENT_USER_ID, action: 'create', entityType: 'subsidy', entityId: r.id, newValue: r });
  return c.json({ success: true, data: r });
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const idx = store.subsidyRecords.findIndex((r) => r.id === id);
  if (idx === -1) return c.json({ success: false, error: '记录不存在' }, 404);
  const old = { ...store.subsidyRecords[idx] };
  const body: any = await c.req.json().catch(() => ({}));
  store.subsidyRecords[idx] = {
    ...store.subsidyRecords[idx],
    ...body,
    productionKwh: body.productionKwh != null ? Number(body.productionKwh) : store.subsidyRecords[idx].productionKwh,
    subsidyRate: body.subsidyRate != null ? Number(body.subsidyRate) : store.subsidyRecords[idx].subsidyRate,
    subsidyAmount: body.subsidyAmount != null ? Number(body.subsidyAmount) : store.subsidyRecords[idx].subsidyAmount,
    updatedBy: CURRENT_USER_ID,
    updatedAt: nowISO(),
  };
  auditLog({
    userId: CURRENT_USER_ID,
    action: 'update',
    entityType: 'subsidy',
    entityId: id,
    oldValue: old,
    newValue: store.subsidyRecords[idx],
  });
  return c.json({ success: true, data: store.subsidyRecords[idx] });
});

app.post('/:id/approve', async (c) => {
  const id = c.req.param('id');
  const idx = store.subsidyRecords.findIndex((r) => r.id === id);
  if (idx === -1) return c.json({ success: false, error: '记录不存在' }, 404);
  const old = { ...store.subsidyRecords[idx] };
  store.subsidyRecords[idx] = {
    ...store.subsidyRecords[idx],
    status: 'approved',
    approvedBy: CURRENT_USER_ID,
    approvedAt: nowISO(),
    updatedBy: CURRENT_USER_ID,
    updatedAt: nowISO(),
  };
  auditLog({
    userId: CURRENT_USER_ID,
    action: 'approve',
    entityType: 'subsidy',
    entityId: id,
    oldValue: old,
    newValue: store.subsidyRecords[idx],
  });
  return c.json({ success: true, data: store.subsidyRecords[idx] });
});

app.delete('/:id', (c) => {
  const id = c.req.param('id');
  const idx = store.subsidyRecords.findIndex((r) => r.id === id);
  if (idx === -1) return c.json({ success: false, error: '记录不存在' }, 404);
  const old = store.subsidyRecords.splice(idx, 1)[0];
  auditLog({ userId: CURRENT_USER_ID, action: 'delete', entityType: 'subsidy', entityId: id, oldValue: old });
  return c.json({ success: true });
});

export default app;
