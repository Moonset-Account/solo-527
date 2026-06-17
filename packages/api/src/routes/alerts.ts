import { Hono } from 'hono';
import { store, paginate, auditLog, CURRENT_USER_ID, CURRENT_USER, uid, nowISO } from '../store';
import type { Alert, AlertStatus, AlertLevel } from '@solar/shared';

const app = new Hono();

app.get('/', (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  const keyword = c.req.query('keyword')?.toLowerCase();
  const zoneId = c.req.query('zoneId');
  const deviceId = c.req.query('deviceId');
  const level = c.req.query('level') as AlertLevel | undefined;
  const status = c.req.query('status') as AlertStatus | undefined;
  const assignee = c.req.query('assignee');
  const from = c.req.query('from');
  const to = c.req.query('to');
  let list = [...store.alerts];
  if (keyword)
    list = list.filter((a) => a.title.toLowerCase().includes(keyword) || a.description?.toLowerCase().includes(keyword));
  if (zoneId) list = list.filter((a) => a.zoneId === zoneId);
  if (deviceId) list = list.filter((a) => a.deviceId === deviceId);
  if (level) list = list.filter((a) => a.level === level);
  if (status) list = list.filter((a) => a.status === status);
  if (assignee) list = list.filter((a) => a.assignee?.includes(assignee));
  if (from) list = list.filter((a) => new Date(a.createdAt) >= new Date(from));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    list = list.filter((a) => new Date(a.createdAt) <= end);
  }
  list.sort((a, b) => {
    const lvl = { critical: 0, warning: 1, info: 2 } as Record<string, number>;
    if (lvl[a.level] !== lvl[b.level]) return lvl[a.level] - lvl[b.level];
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const enriched = list.map((a) => ({
    ...a,
    zoneName: store.zones.find((z) => z.id === a.zoneId)?.name,
    deviceName: store.devices.find((d) => d.id === a.deviceId)?.name,
  }));
  return c.json({
    success: true,
    data: {
      ...paginate(enriched, page, pageSize),
      summary: {
        total: list.length,
        critical: list.filter((a) => a.level === 'critical').length,
        warning: list.filter((a) => a.level === 'warning').length,
        info: list.filter((a) => a.level === 'info').length,
        pending: list.filter((a) => a.status === 'pending').length,
        processing: list.filter((a) => a.status === 'processing').length,
        resolved: list.filter((a) => a.status === 'resolved').length,
      },
    },
  });
});

app.get('/pending-reminders', (c) => {
  const thresholdMinutes = Number(c.req.query('threshold') || '30');
  const now = new Date().getTime();
  const pending = store.alerts
    .filter((a) => a.status === 'pending' || a.status === 'processing')
    .filter((a) => now - new Date(a.createdAt).getTime() > thresholdMinutes * 60 * 1000)
    .map((a) => {
      const waitMin = Math.floor((now - new Date(a.createdAt).getTime()) / 60000);
      return {
        ...a,
        zoneName: store.zones.find((z) => z.id === a.zoneId)?.name,
        deviceName: store.devices.find((d) => d.id === a.deviceId)?.name,
        waitingMinutes: waitMin,
      };
    })
    .sort((a, b) => b.waitingMinutes - a.waitingMinutes);
  return c.json({ success: true, data: pending });
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const alert = store.alerts.find((a) => a.id === id);
  if (!alert) return c.json({ success: false, error: '告警不存在' }, 404);
  const activities = store.alertActivities
    .filter((ac) => ac.alertId === id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return c.json({
    success: true,
    data: {
      ...alert,
      zoneName: store.zones.find((z) => z.id === alert.zoneId)?.name,
      deviceName: store.devices.find((d) => d.id === alert.deviceId)?.name,
      device: store.devices.find((d) => d.id === alert.deviceId),
      activities,
    },
  });
});

function addActivity(alertId: string, action: Alert['status'] extends any ? string : never, note?: string) {
  store.alertActivities.unshift({
    id: uid(),
    alertId,
    operatorId: CURRENT_USER_ID,
    operatorName: CURRENT_USER.name,
    action: action as any,
    note,
    createdAt: nowISO(),
  });
}

app.post('/:id/acknowledge', async (c) => {
  const id = c.req.param('id');
  const body: any = await c.req.json().catch(() => ({}));
  const idx = store.alerts.findIndex((a) => a.id === id);
  if (idx === -1) return c.json({ success: false, error: '告警不存在' }, 404);
  const old = { ...store.alerts[idx] };
  store.alerts[idx] = {
    ...store.alerts[idx],
    status: 'processing',
    acknowledgedBy: CURRENT_USER_ID,
    acknowledgedAt: nowISO(),
    assignee: body?.assignee || CURRENT_USER.name,
    updatedAt: nowISO(),
  };
  addActivity(id, 'acknowledge', body?.note || '已确认告警，开始处理');
  auditLog({
    userId: CURRENT_USER_ID,
    action: 'acknowledge',
    entityType: 'alert',
    entityId: id,
    oldValue: old,
    newValue: store.alerts[idx],
  });
  return c.json({ success: true, data: store.alerts[idx] });
});

app.post('/:id/assign', async (c) => {
  const id = c.req.param('id');
  const body: any = await c.req.json().catch(() => ({}));
  const idx = store.alerts.findIndex((a) => a.id === id);
  if (idx === -1) return c.json({ success: false, error: '告警不存在' }, 404);
  if (!body?.assignee) return c.json({ success: false, error: '请指定处理人' }, 400);
  const old = { ...store.alerts[idx] };
  store.alerts[idx] = {
    ...store.alerts[idx],
    assignee: body.assignee,
    status: store.alerts[idx].status === 'pending' ? 'processing' : store.alerts[idx].status,
    updatedAt: nowISO(),
  };
  addActivity(id, 'assign', `指派给：${body.assignee}。${body.note || ''}`);
  auditLog({
    userId: CURRENT_USER_ID,
    action: 'assign',
    entityType: 'alert',
    entityId: id,
    oldValue: old,
    newValue: store.alerts[idx],
  });
  return c.json({ success: true, data: store.alerts[idx] });
});

app.post('/:id/resolve', async (c) => {
  const id = c.req.param('id');
  const body: any = await c.req.json().catch(() => ({}));
  const idx = store.alerts.findIndex((a) => a.id === id);
  if (idx === -1) return c.json({ success: false, error: '告警不存在' }, 404);
  const old = { ...store.alerts[idx] };
  store.alerts[idx] = {
    ...store.alerts[idx],
    status: 'resolved',
    resolvedBy: CURRENT_USER_ID,
    resolvedAt: nowISO(),
    updatedAt: nowISO(),
  };
  addActivity(id, 'resolve', body?.note || '问题已修复并确认恢复');
  auditLog({
    userId: CURRENT_USER_ID,
    action: 'resolve',
    entityType: 'alert',
    entityId: id,
    oldValue: old,
    newValue: store.alerts[idx],
  });
  return c.json({ success: true, data: store.alerts[idx] });
});

app.post('/:id/ignore', async (c) => {
  const id = c.req.param('id');
  const body: any = await c.req.json().catch(() => ({}));
  const idx = store.alerts.findIndex((a) => a.id === id);
  if (idx === -1) return c.json({ success: false, error: '告警不存在' }, 404);
  const old = { ...store.alerts[idx] };
  store.alerts[idx] = {
    ...store.alerts[idx],
    status: 'ignored',
    acknowledgedBy: CURRENT_USER_ID,
    acknowledgedAt: nowISO(),
    updatedAt: nowISO(),
  };
  addActivity(id, 'ignore', body?.note || '经确认属于误报，忽略此告警');
  auditLog({
    userId: CURRENT_USER_ID,
    action: 'ignore',
    entityType: 'alert',
    entityId: id,
    oldValue: old,
    newValue: store.alerts[idx],
  });
  return c.json({ success: true, data: store.alerts[idx] });
});

app.post('/:id/comment', async (c) => {
  const id = c.req.param('id');
  const body: any = await c.req.json().catch(() => ({}));
  const exists = store.alerts.find((a) => a.id === id);
  if (!exists) return c.json({ success: false, error: '告警不存在' }, 404);
  if (!body?.note) return c.json({ success: false, error: '请输入备注内容' }, 400);
  addActivity(id, 'comment', body.note);
  return c.json({ success: true });
});

app.post('/', async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  const alert: Alert = {
    id: uid(),
    deviceId: body.deviceId,
    zoneId: body.zoneId,
    level: body.level || 'warning',
    title: body.title,
    description: body.description,
    status: 'pending',
    sourceData: body.sourceData,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  store.alerts.unshift(alert);
  addActivity(alert.id, 'create', '人工上报告警');
  auditLog({ userId: CURRENT_USER_ID, action: 'create', entityType: 'alert', entityId: alert.id, newValue: alert });
  return c.json({ success: true, data: alert });
});

export default app;
