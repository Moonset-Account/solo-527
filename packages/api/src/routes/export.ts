import { Hono } from 'hono';
import { db } from '../db/index';
import { alerts, zones, devices, energyRecords, meters, subsidyRecords, users, meterOfflineRecords } from '../db/schema';
import { eq, and, or, like, desc, asc, sql, gte, lte, isNull, isNotNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

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

function parseNum(v: any): number {
  if (v == null) return 0;
  return Number(v);
}

app.get('/alerts', async (c) => {
  const keyword = c.req.query('keyword');
  const zoneId = c.req.query('zoneId');
  const deviceId = c.req.query('deviceId');
  const level = c.req.query('level');
  const status = c.req.query('status');
  const assignee = c.req.query('assignee');
  const from = c.req.query('from');
  const to = c.req.query('to');

  const conditions: any[] = [];
  if (keyword) {
    conditions.push(
      or(
        like(alerts.title, `%${keyword}%`),
        like(alerts.description, `%${keyword}%`)
      )
    );
  }
  if (zoneId) conditions.push(eq(alerts.zoneId, zoneId));
  if (deviceId) conditions.push(eq(alerts.deviceId, deviceId));
  if (level) conditions.push(eq(alerts.level, level));
  if (status) conditions.push(eq(alerts.status, status));
  if (assignee) conditions.push(like(alerts.assignee, `%${assignee}%`));
  if (from) conditions.push(gte(alerts.createdAt, new Date(from)));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(alerts.createdAt, end));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const listResult = await db
    .select({
      alert: alerts,
      zoneName: zones.name,
      deviceName: devices.name,
    })
    .from(alerts)
    .leftJoin(zones, eq(alerts.zoneId, zones.id))
    .leftJoin(devices, eq(alerts.deviceId, devices.id))
    .where(where)
    .orderBy(desc(alerts.createdAt));

  const rows = listResult.map((row) => ({
    ...row.alert,
    zoneName: row.zoneName || '',
    deviceName: row.deviceName || '',
  }));

  const filterInfo = JSON.stringify(
    {
      exportTime: new Date().toISOString(),
      totalRecords: rows.length,
      filters: { keyword, zoneId, deviceId, level, status, assignee, from, to },
    },
    null,
    2
  );

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

app.get('/energy', async (c) => {
  const zoneId = c.req.query('zoneId');
  const meterId = c.req.query('meterId');
  const from = c.req.query('from');
  const to = c.req.query('to');

  const conditions: any[] = [];
  if (zoneId) conditions.push(eq(energyRecords.zoneId, zoneId));
  if (meterId) conditions.push(eq(energyRecords.meterId, meterId));
  if (from) conditions.push(gte(energyRecords.timestamp, new Date(from)));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(energyRecords.timestamp, end));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const listResult = await db
    .select({
      record: energyRecords,
      zoneName: zones.name,
      meterName: meters.name,
    })
    .from(energyRecords)
    .leftJoin(zones, eq(energyRecords.zoneId, zones.id))
    .leftJoin(meters, eq(energyRecords.meterId, meters.id))
    .where(where)
    .orderBy(asc(energyRecords.timestamp));

  const rows = listResult.map((row) => ({
    ...row.record,
    zoneName: row.zoneName || '',
    meterName: row.meterName || '',
    production: parseNum(row.record.production),
    consumption: parseNum(row.record.consumption),
    gridExport: parseNum(row.record.gridExport),
    gridImport: parseNum(row.record.gridImport),
    efficiency: parseNum(row.record.efficiency),
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

app.get('/subsidies', async (c) => {
  const zoneId = c.req.query('zoneId');
  const status = c.req.query('status');

  const conditions: any[] = [];
  if (zoneId) conditions.push(eq(subsidyRecords.zoneId, zoneId));
  if (status) conditions.push(eq(subsidyRecords.status, status));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const approvedByUsers = alias(users, 'approved_by_users');
  const updatedByUsers = alias(users, 'updated_by_users');

  const listResult = await db
    .select({
      record: subsidyRecords,
      zoneName: zones.name,
      approvedByName: approvedByUsers.name,
      updatedByName: updatedByUsers.name,
    })
    .from(subsidyRecords)
    .leftJoin(zones, eq(subsidyRecords.zoneId, zones.id))
    .leftJoin(approvedByUsers, eq(subsidyRecords.approvedBy, approvedByUsers.id))
    .leftJoin(updatedByUsers, eq(subsidyRecords.updatedBy, updatedByUsers.id))
    .where(where)
    .orderBy(desc(subsidyRecords.periodStart));

  const rows = listResult.map((row) => ({
    ...row.record,
    zoneName: row.zoneName || '',
    approvedByName: row.approvedByName || '',
    updatedByName: row.updatedByName || '',
    productionKwh: parseNum(row.record.productionKwh),
    subsidyRate: parseNum(row.record.subsidyRate),
    subsidyAmount: parseNum(row.record.subsidyAmount),
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

app.get('/offline', async (c) => {
  const keyword = c.req.query('keyword');
  const zoneId = c.req.query('zoneId');
  const reasonCategory = c.req.query('reasonCategory');
  const status = c.req.query('status');
  const assignee = c.req.query('assignee');
  const from = c.req.query('from');
  const to = c.req.query('to');

  const conditions: any[] = [];
  if (keyword) {
    conditions.push(or(
      like(meterOfflineRecords.reason, `%${keyword}%`),
      like(meterOfflineRecords.resolutionNote, `%${keyword}%`)
    ));
  }
  if (zoneId) conditions.push(eq(meterOfflineRecords.zoneId, zoneId));
  if (reasonCategory) conditions.push(eq(meterOfflineRecords.reasonCategory, reasonCategory));
  if (assignee) conditions.push(like(meterOfflineRecords.assignee, `%${assignee}%`));
  if (from) conditions.push(gte(meterOfflineRecords.offlineAt, new Date(from)));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(meterOfflineRecords.offlineAt, end));
  }
  if (status === 'open') conditions.push(isNull(meterOfflineRecords.onlineAt));
  else if (status === 'resolved') conditions.push(isNotNull(meterOfflineRecords.onlineAt));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const listResult = await db
    .select({
      record: meterOfflineRecords,
      zoneName: zones.name,
      meterName: meters.name,
      serialNumber: meters.serialNumber,
    })
    .from(meterOfflineRecords)
    .leftJoin(zones, eq(meterOfflineRecords.zoneId, zones.id))
    .leftJoin(meters, eq(meterOfflineRecords.meterId, meters.id))
    .where(where)
    .orderBy(desc(meterOfflineRecords.offlineAt));

  const rows = listResult.map((row) => ({
    ...row.record,
    zoneName: row.zoneName || '',
    meterName: row.meterName || '',
    serialNumber: row.serialNumber || '',
  }));

  const totalDurationMinutes = rows.reduce((s, r) => s + (r.durationMinutes || 0), 0);
  const responseRows = rows.filter((r) => r.responseMinutes != null);
  const avgResponseMinutes = responseRows.length > 0
    ? Math.round(responseRows.reduce((s, r) => s + (r.responseMinutes || 0), 0) / responseRows.length)
    : 0;

  const filterInfo = JSON.stringify(
    {
      exportTime: new Date().toISOString(),
      totalRecords: rows.length,
      totalDurationHours: Number((totalDurationMinutes / 60).toFixed(2)),
      avgResponseMinutes,
      filters: {
        keyword,
        zoneId,
        reasonCategory,
        status,
        assignee,
        from,
        to,
      },
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
