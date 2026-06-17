import { Hono } from 'hono';
import { store, CURRENT_USER, paginate, auditLog, CURRENT_USER_ID } from '../store';

const app = new Hono();

app.get('/summary', (c) => {
  const totalCapacity = store.zones.reduce((s, z) => s + Number(z.capacity), 0);
  const totalProduction = store.energyRecords.reduce((s, r) => s + Number(r.production), 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayProd = store.energyRecords
    .filter((r) => new Date(r.timestamp) >= today)
    .reduce((s, r) => s + Number(r.production), 0);
  const todayCons = store.energyRecords
    .filter((r) => new Date(r.timestamp) >= today)
    .reduce((s, r) => s + Number(r.consumption), 0);
  const activeAlerts = store.alerts.filter((a) => a.status === 'pending' || a.status === 'processing').length;
  const onlineMeters = store.meters.filter((m) => m.status === 'online').length;
  const offlineMeters = store.meters.filter((m) => m.status === 'offline').length;
  const monthlySubsidy = store.subsidyRecords
    .filter((s) => s.status === 'approved' || s.status === 'paid')
    .reduce((s, r) => s + Number(r.subsidyAmount), 0);
  const currentTarget = store.energySavingTargets.find((t) => t.period === 'yearly');
  const targetProgress = currentTarget
    ? store.energySavingDetails
        .filter((d) => d.targetId === currentTarget.id)
        .reduce((s, d) => s + Number(d.savedKwh), 0) / Number(currentTarget.targetKwh)
    : 0;

  return c.json({
    success: true,
    data: {
      totalCapacity: Number(totalCapacity.toFixed(0)),
      totalProduction: Number(totalProduction.toFixed(1)),
      todayProduction: Number(todayProd.toFixed(1)),
      todayConsumption: Number(todayCons.toFixed(1)),
      activeAlerts,
      onlineMeters,
      offlineMeters,
      monthlySubsidy: Number(monthlySubsidy.toFixed(2)),
      targetProgress: Number((Math.min(1, targetProgress) * 100).toFixed(1)),
      zoneCount: store.zones.length,
      deviceCount: store.devices.length,
      user: CURRENT_USER,
    },
  });
});

app.get('/zone-stats', (c) => {
  const stats = store.zones.map((zone) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const prodToday = store.energyRecords
      .filter((r) => r.zoneId === zone.id && new Date(r.timestamp) >= today)
      .reduce((s, r) => s + Number(r.production), 0);
    const prodMonth = store.energyRecords
      .filter((r) => {
        const d = new Date(r.timestamp);
        return r.zoneId === zone.id && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      })
      .reduce((s, r) => s + Number(r.production), 0);
    const activeAlerts = store.alerts.filter(
      (a) => a.zoneId === zone.id && (a.status === 'pending' || a.status === 'processing')
    ).length;
    const devices = store.devices.filter((d) => d.zoneId === zone.id).length;
    const meters = store.meters.filter((m) => m.zoneId === zone.id).length;
    const eff = store.energyRecords
      .filter((r) => r.zoneId === zone.id)
      .slice(-50)
      .reduce((s, r, i, arr) => s + Number(r.efficiency) / arr.length, 0);
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      capacity: Number(zone.capacity),
      productionToday: Number(prodToday.toFixed(1)),
      productionMonth: Number(prodMonth.toFixed(1)),
      activeAlerts,
      deviceCount: devices,
      meterCount: meters,
      avgEfficiency: Number(eff.toFixed(2)),
    };
  });
  return c.json({ success: true, data: stats });
});

app.get('/energy-trend', (c) => {
  const days = Number(c.req.query('days') || '7');
  const zoneId = c.req.query('zoneId');
  const data: Array<{ date: string; production: number; consumption: number; gridExport: number; gridImport: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const recs = store.energyRecords.filter((r) => {
      const t = new Date(r.timestamp);
      const inZone = !zoneId || r.zoneId === zoneId;
      return inZone && t >= d && t < next;
    });
    data.push({
      date: d.toISOString().slice(0, 10),
      production: Number(recs.reduce((s, r) => s + Number(r.production), 0).toFixed(1)),
      consumption: Number(recs.reduce((s, r) => s + Number(r.consumption), 0).toFixed(1)),
      gridExport: Number(recs.reduce((s, r) => s + Number(r.gridExport), 0).toFixed(1)),
      gridImport: Number(recs.reduce((s, r) => s + Number(r.gridImport), 0).toFixed(1)),
    });
  }
  return c.json({ success: true, data });
});

app.get('/alert-summary', (c) => {
  const levels: Record<string, number> = { critical: 0, warning: 0, info: 0 };
  const statuses: Record<string, number> = { pending: 0, processing: 0, resolved: 0, ignored: 0 };
  for (const a of store.alerts) {
    levels[a.level] = (levels[a.level] || 0) + 1;
    statuses[a.status] = (statuses[a.status] || 0) + 1;
  }
  const recent = [...store.alerts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map((a) => ({
      ...a,
      zoneName: store.zones.find((z) => z.id === a.zoneId)?.name,
      deviceName: store.devices.find((d) => d.id === a.deviceId)?.name,
    }));
  return c.json({ success: true, data: { levels, statuses, recent } });
});

app.get('/users', (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  return c.json({ success: true, data: paginate(store.users, page, pageSize) });
});

app.get('/users/list', (c) => {
  return c.json({ success: true, data: store.users });
});

app.get('/me', (c) => {
  return c.json({ success: true, data: CURRENT_USER });
});

export default app;
