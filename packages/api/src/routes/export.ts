import { Hono } from 'hono';
import { store } from '../store';

const app = new Hono();

function toCSV<T extends Record<string, any>>(rows: T[], headers: Array<{ key: keyof T; label: string }>): string {
  const head = headers.map((h) => `"${h.label}"`).join(',');
  const lines = rows.map((row) =>
    headers
      .map((h) => {
        const v = row[h.key];
        if (v == null) return '""';
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      })
      .join(',')
  );
  return [head, ...lines].join('\n');
}

app.get('/alerts', (c) => {
  const keyword = c.req.query('keyword')?.toLowerCase();
  const zoneId = c.req.query('zoneId');
  const deviceId = c.req.query('deviceId');
  const level = c.req.query('level');
  const status = c.req.query('status');
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
  const rows = list.map((a) => ({
    ...a,
    zoneName: store.zones.find((z) => z.id === a.zoneId)?.name || '',
    deviceName: store.devices.find((d) => d.id === a.deviceId)?.name || '',
  }));
  const filterInfo = JSON.stringify({
    exportTime: new Date().toISOString(),
    totalRecords: rows.length,
    filters: { keyword, zoneId, deviceId, level, status, assignee, from, to },
  }, null, 2);
  const csv = toCSV(rows, [
    { key: 'id', label: '告警ID' },
    { key: 'zoneName', label: '所属分区' },
    { key: 'deviceName', label: '关联设备' },
    { key: 'level', label: '告警等级' },
    { key: 'title', label: '告警标题' },
    { key: 'description', label: '详细描述' },
    { key: 'status', label: '处理状态' },
    { key: 'assignee', label: '处理人' },
    { key: 'acknowledgedAt', label: '确认时间' },
    { key: 'resolvedAt', label: '解决时间' },
    { key: 'createdAt', label: '创建时间' },
  ]);
  const body = `筛选口径:\n${filterInfo}\n\n数据:\n${csv}`;
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="alerts_${Date.now()}.csv"`,
    },
  });
});

app.get('/energy', (c) => {
  const zoneId = c.req.query('zoneId');
  const meterId = c.req.query('meterId');
  const from = c.req.query('from');
  const to = c.req.query('to');
  let list = [...store.energyRecords];
  if (zoneId) list = list.filter((r) => r.zoneId === zoneId);
  if (meterId) list = list.filter((r) => r.meterId === meterId);
  if (from) list = list.filter((r) => new Date(r.timestamp) >= new Date(from));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    list = list.filter((r) => new Date(r.timestamp) <= end);
  }
  const rows = list
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((r) => ({
      ...r,
      zoneName: store.zones.find((z) => z.id === r.zoneId)?.name || '',
      meterName: store.meters.find((m) => m.id === r.meterId)?.name || '',
    }));
  const totals = {
    production: rows.reduce((s, r) => s + Number(r.production), 0),
    consumption: rows.reduce((s, r) => s + Number(r.consumption), 0),
    gridExport: rows.reduce((s, r) => s + Number(r.gridExport), 0),
    gridImport: rows.reduce((s, r) => s + Number(r.gridImport), 0),
  };
  const filterInfo = JSON.stringify(
    {
      exportTime: new Date().toISOString(),
      totalRecords: rows.length,
      totals,
      filters: { zoneId, meterId, from, to },
    },
    null,
    2
  );
  const csv = toCSV(rows, [
    { key: 'timestamp', label: '时间' },
    { key: 'zoneName', label: '分区' },
    { key: 'meterName', label: '表计' },
    { key: 'production', label: '发电量(kWh)' },
    { key: 'consumption', label: '用电量(kWh)' },
    { key: 'gridExport', label: '上网电量(kWh)' },
    { key: 'gridImport', label: '购电量(kWh)' },
    { key: 'efficiency', label: '转换效率(%)' },
  ]);
  const body = `筛选口径:\n${filterInfo}\n\n数据:\n${csv}`;
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="energy_${Date.now()}.csv"`,
    },
  });
});

app.get('/subsidies', (c) => {
  const zoneId = c.req.query('zoneId');
  const status = c.req.query('status');
  let list = [...store.subsidyRecords];
  if (zoneId) list = list.filter((r) => r.zoneId === zoneId);
  if (status) list = list.filter((r) => r.status === status);
  const rows = list.map((r) => ({
    ...r,
    zoneName: store.zones.find((z) => z.id === r.zoneId)?.name || '',
    approvedByName: store.users.find((u) => u.id === r.approvedBy)?.name || '',
    updatedByName: store.users.find((u) => u.id === r.updatedBy)?.name || '',
  }));
  const filterInfo = JSON.stringify(
    {
      exportTime: new Date().toISOString(),
      totalRecords: rows.length,
      totalAmount: rows.reduce((s, r) => s + Number(r.subsidyAmount), 0),
      filters: { zoneId, status },
    },
    null,
    2
  );
  const csv = toCSV(rows, [
    { key: 'zoneName', label: '分区' },
    { key: 'periodStart', label: '周期开始' },
    { key: 'periodEnd', label: '周期结束' },
    { key: 'productionKwh', label: '发电量(kWh)' },
    { key: 'subsidyRate', label: '补贴单价(元)' },
    { key: 'subsidyAmount', label: '补贴金额(元)' },
    { key: 'status', label: '状态' },
    { key: 'approvedByName', label: '审批人' },
    { key: 'approvedAt', label: '审批时间' },
    { key: 'updatedByName', label: '最后修改人' },
    { key: 'remark', label: '备注' },
  ]);
  const body = `筛选口径:\n${filterInfo}\n\n数据:\n${csv}`;
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="subsidies_${Date.now()}.csv"`,
    },
  });
});

app.get('/offline', (c) => {
  const zoneId = c.req.query('zoneId');
  const reasonCategory = c.req.query('reasonCategory');
  const status = c.req.query('status');
  let list = [...store.meterOfflineRecords];
  if (zoneId) list = list.filter((r) => r.zoneId === zoneId);
  if (reasonCategory) list = list.filter((r) => r.reasonCategory === reasonCategory);
  if (status === 'open') list = list.filter((r) => !r.onlineAt);
  else if (status === 'resolved') list = list.filter((r) => r.onlineAt);
  const rows = list.map((r) => ({
    ...r,
    zoneName: store.zones.find((z) => z.id === r.zoneId)?.name || '',
    meterName: store.meters.find((m) => m.id === r.meterId)?.name || '',
    serialNumber: store.meters.find((m) => m.id === r.meterId)?.serialNumber || '',
  }));
  const filterInfo = JSON.stringify(
    {
      exportTime: new Date().toISOString(),
      totalRecords: rows.length,
      totalDurationHours: Number((rows.reduce((s, r) => s + (r.durationMinutes || 0), 0) / 60).toFixed(2)),
      avgResponseMinutes:
        rows.filter((r) => r.responseMinutes != null).length > 0
          ? Math.round(
              rows.filter((r) => r.responseMinutes != null).reduce((s, r) => s + (r.responseMinutes || 0), 0) /
                rows.filter((r) => r.responseMinutes != null).length
            )
          : 0,
      filters: { zoneId, reasonCategory, status },
    },
    null,
    2
  );
  const csv = toCSV(rows, [
    { key: 'zoneName', label: '分区' },
    { key: 'meterName', label: '表计名称' },
    { key: 'serialNumber', label: '序列号' },
    { key: 'offlineAt', label: '离线时间' },
    { key: 'onlineAt', label: '恢复时间' },
    { key: 'durationMinutes', label: '持续时间(分钟)' },
    { key: 'reasonCategory', label: '原因分类' },
    { key: 'reason', label: '具体原因' },
    { key: 'assignee', label: '责任人' },
    { key: 'responseMinutes', label: '响应时长(分钟)' },
    { key: 'resolutionNote', label: '处理说明' },
  ]);
  const body = `筛选口径:\n${filterInfo}\n\n数据:\n${csv}`;
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="offline_records_${Date.now()}.csv"`,
    },
  });
});

export default app;
