import { db } from './index';
import {
  users,
  zones,
  meters,
  devices,
  alerts,
  alertActivities,
  energyRecords,
  subsidyRecords,
  energySavingTargets,
  energySavingDetails,
  meterOfflineRecords,
  auditLogs,
  savedFilters,
} from './schema';
import { eq } from 'drizzle-orm';

function uid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

const MOCK_USERS = [
  { id: uid(), name: '系统管理员', email: 'admin@solar.com', role: 'admin' },
  { id: uid(), name: '张经理', email: 'zhang@solar.com', role: 'manager' },
  { id: uid(), name: '李运维', email: 'li@solar.com', role: 'operator' },
  { id: uid(), name: '王监控', email: 'wang@solar.com', role: 'viewer' },
];

const MOCK_ZONES = [
  { id: uid(), name: 'A区 - 屋顶阵列', description: '厂房屋顶太阳能板阵列，装机容量500kW', capacity: '500' },
  { id: uid(), name: 'B区 - 车棚阵列', description: '停车场车棚光伏阵列，装机容量200kW', capacity: '200' },
  { id: uid(), name: 'C区 - 地面电站', description: '地面集中式光伏电站，装机容量1000kW', capacity: '1000' },
  { id: uid(), name: 'D区 - 实验测试区', description: '新型组件测试区域，装机容量50kW', capacity: '50' },
];

function buildMeters() {
  const result: any[] = [];
  const configs: [string, number, string][] = [
    [MOCK_ZONES[0].id, 3, 'A'],
    [MOCK_ZONES[1].id, 2, 'B'],
    [MOCK_ZONES[2].id, 4, 'C'],
    [MOCK_ZONES[3].id, 2, 'D'],
  ];
  for (const [zoneId, count, prefix] of configs) {
    for (let i = 1; i <= count; i++) {
      const isOffline = prefix === 'A' && i === count;
      result.push({
        id: uid(),
        zoneId,
        name: `${prefix}区表计${i}号`,
        model: i % 2 === 0 ? 'Sungrow-MT100' : 'Huawei-DTSU666',
        serialNumber: `MTR-${prefix}-${String(i).padStart(3, '0')}`,
        status: isOffline ? 'offline' : 'online',
        lastHeartbeat: isOffline ? daysAgo(2) : hoursAgo(0.5),
        installedAt: daysAgo(Math.floor(Math.random() * 200) + 30),
      });
    }
  }
  return result;
}

function buildDevices(meters: any[]) {
  const types: string[] = ['inverter', 'panel', 'battery', 'transformer'];
  const typeNames: Record<string, string> = {
    inverter: '逆变器',
    panel: '组件',
    battery: '储能',
    transformer: '变压器',
    meter: '表计',
  };
  const result: any[] = [];
  for (const zone of MOCK_ZONES) {
    const prefix = zone.name.charAt(0);
    const zoneMeters = meters.filter((m) => m.zoneId === zone.id);
    const count = prefix === 'C' ? 20 : prefix === 'A' ? 12 : prefix === 'B' ? 6 : 4;
    for (let i = 1; i <= count; i++) {
      const type = types[i % types.length];
      const meter = zoneMeters[i % zoneMeters.length];
      result.push({
        id: uid(),
        zoneId: zone.id,
        meterId: meter?.id,
        name: `${prefix}区${typeNames[type]}${i}`,
        type,
        model: `${type.toUpperCase()}-${String(1000 + i)}`,
        serialNumber: `DEV-${prefix}-${type.slice(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`,
        status: prefix === 'A' && i === 5 ? 'fault' : prefix === 'C' && i === 8 ? 'maintenance' : 'running',
        capacity: type === 'panel' ? '0.5' : type === 'inverter' ? '100' : type === 'battery' ? '200' : '500',
        installedAt: daysAgo(Math.floor(Math.random() * 200) + 60),
      });
    }
  }
  return result;
}

function buildAlerts(devices: any[], usersList: any[]) {
  const titles: Record<string, string[]> = {
    critical: ['直流过压严重', '绝缘阻抗异常', '并网跳闸', '组件过热告警'],
    warning: ['输出功率波动', '环境温度偏高', '通讯中断预警', '效率下降告警'],
    info: ['设备启动完成', '定时自检通过', '固件升级通知', '数据同步提醒'],
  };
  const result: any[] = [];
  const levels = ['critical', 'warning', 'info'];
  const statuses = ['pending', 'processing', 'resolved', 'ignored'];
  const targets = [
    ...devices.filter((d: any) => d.status === 'fault' || d.status === 'maintenance'),
    ...devices.slice(0, 15),
  ];
  for (let i = 0; i < 28; i++) {
    const device = targets[i % targets.length];
    const level = levels[i % 3];
    const status = i < 8 ? statuses[i % 2] : 'resolved';
    const user = usersList[i % usersList.length];
    const titleList = titles[level];
    const createdAt = hoursAgo(i * 2 + Math.random() * 5);
    result.push({
      id: uid(),
      deviceId: device.id,
      zoneId: device.zoneId,
      level,
      title: titleList[i % titleList.length],
      description: `设备【${device.name}】检测到${level === 'critical' ? '严重' : level === 'warning' ? '警告' : '提示'}异常，请及时处理。详细数据已上报监控中心。`,
      status,
      assignee: status === 'pending' ? null : user.name,
      acknowledgedBy: status !== 'pending' ? user.id : null,
      acknowledgedAt: status !== 'pending' ? new Date(createdAt.getTime() + 30 * 60 * 1000) : null,
      resolvedBy: status === 'resolved' ? user.id : null,
      resolvedAt: status === 'resolved' ? new Date(createdAt.getTime() + 5 * 3600 * 1000) : null,
      sourceData: { value: Math.round(Math.random() * 50 + 10), threshold: 80 },
      createdAt,
      updatedAt: createdAt,
    });
  }
  return result;
}

function buildAlertActivities(alertList: any[], usersList: any[]) {
  const result: any[] = [];
  for (const alert of alertList) {
    result.push({
      id: uid(),
      alertId: alert.id,
      operatorId: usersList[0].id,
      operatorName: usersList[0].name,
      action: 'create',
      note: '系统自动检测并创建告警',
      createdAt: alert.createdAt,
    });
    if (alert.status !== 'pending') {
      result.push({
        id: uid(),
        alertId: alert.id,
        operatorId: alert.acknowledgedBy,
        operatorName: alert.assignee,
        action: 'acknowledge',
        note: '已收到告警，正在处理',
        createdAt: alert.acknowledgedAt,
      });
    }
    if (alert.status === 'resolved') {
      result.push({
        id: uid(),
        alertId: alert.id,
        operatorId: alert.resolvedBy,
        operatorName: alert.assignee,
        action: 'resolve',
        note: '故障已排除，设备恢复正常运行',
        createdAt: alert.resolvedAt,
      });
    }
  }
  return result;
}

function buildEnergyRecords(meters: any[]) {
  const result: any[] = [];
  const days = 60;
  for (const meter of meters) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      for (let h = 0; h < 24; h += 2) {
        const hour = new Date(d.getTime() + h * 3600 * 1000);
        const isDay = h >= 6 && h <= 18;
        const base = isDay ? 80 + Math.sin((h - 6) / 12 * Math.PI) * 120 : 5;
        const production = Math.max(0, base * (0.9 + Math.random() * 0.2)) / 3;
        const consumption = 20 + Math.random() * 15;
        const gridExport = Math.max(0, production - consumption) * 0.8;
        const gridImport = Math.max(0, consumption - production) * 0.5;
        const efficiency = 90 + Math.random() * 8;
        result.push({
          id: uid(),
          meterId: meter.id,
          zoneId: meter.zoneId,
          timestamp: hour,
          production: production.toFixed(4),
          consumption: consumption.toFixed(4),
          gridExport: gridExport.toFixed(4),
          gridImport: gridImport.toFixed(4),
          efficiency: efficiency.toFixed(2),
        });
        if (result.length >= 10000) break;
      }
      if (result.length >= 10000) break;
    }
    if (result.length >= 10000) break;
  }
  return result;
}

function buildSubsidies(zonesList: any[]) {
  const result: any[] = [];
  const months = 12;
  for (let i = 0; i < months; i++) {
    for (const zone of zonesList) {
      const production = (30000 + Math.random() * 20000) * (Number(zone.capacity) / 500);
      const rate = 0.42 + Math.random() * 0.1;
      const amount = production * rate;
      const monthAgo = months - i - 1;
      const start = new Date();
      start.setMonth(start.getMonth() - monthAgo, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const status = i >= months - 2 ? 'pending' : i >= months - 4 ? 'approved' : 'settled';
      result.push({
        id: uid(),
        zoneId: zone.id,
        periodStart: start,
        periodEnd: end,
        productionKwh: production.toFixed(4),
        subsidyRate: rate.toFixed(4),
        subsidyAmount: amount.toFixed(2),
        status,
        approvedBy: status !== 'pending' ? MOCK_USERS[0].id : null,
        approvedAt: status !== 'pending' ? new Date(end.getTime() + 86400000 * 3) : null,
        remark: status === 'settled' ? '已结算支付' : status === 'approved' ? '审核通过' : '待审核',
        updatedBy: MOCK_USERS[0].id,
      });
    }
  }
  return result;
}

function buildTargets(zonesList: any[]) {
  const targets: any[] = [
    { zoneIdx: 2, name: 'C区月度节能目标', period: 'monthly', target: 8000, baseline: 40000, days: 30 },
    { zoneIdx: 0, name: 'A区Q2节能目标', period: 'quarterly', target: 25000, baseline: 120000, days: 90 },
    { zoneIdx: 1, name: 'B区年度节能计划', period: 'yearly', target: 80000, baseline: 400000, days: 180 },
  ];
  const result: any[] = [];
  const details: any[] = [];
  for (const t of targets) {
    const zoneId = zonesList[t.zoneIdx].id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(t.days * 0.4));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + t.days);
    const targetId = uid();
    result.push({
      id: targetId,
      zoneId,
      name: t.name,
      period: t.period,
      targetKwh: String(t.target),
      baselineKwh: String(t.baseline),
      startDate,
      endDate,
    });
    let cumulativeSaved = 0;
    for (let i = 0; i < t.days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      if (date > new Date()) break;
      const baselineDay = t.baseline / t.days;
      const actualDay = baselineDay * (0.85 + Math.random() * 0.2);
      const saved = baselineDay - actualDay;
      cumulativeSaved += saved;
      details.push({
        id: uid(),
        targetId,
        date,
        actualKwh: actualDay.toFixed(4),
        baselineKwh: baselineDay.toFixed(4),
        savedKwh: saved.toFixed(4),
        zoneId,
      });
    }
  }
  return { targets: result, details };
}

function buildOfflineRecords(meters: any[]) {
  const offlineMeters = meters.filter((m) => m.status === 'offline');
  const result: any[] = [];
  const categories = ['power_failure', 'communication', 'hardware', 'maintenance', 'unknown'];
  const catNames: Record<string, string> = {
    power_failure: '供电中断',
    communication: '通讯故障',
    hardware: '硬件故障',
    maintenance: '计划维护',
    unknown: '未知原因',
  };
  for (let i = 0; i < 8; i++) {
    const meter = offlineMeters[i % offlineMeters.length] || meters[i % meters.length];
    const category = categories[i % categories.length];
    const offlineAt = daysAgo(i * 2 + 1);
    const isResolved = i >= 3;
    result.push({
      id: uid(),
      meterId: meter.id,
      zoneId: meter.zoneId,
      offlineAt,
      onlineAt: isResolved ? new Date(offlineAt.getTime() + (3 + i) * 3600 * 1000) : null,
      durationMinutes: isResolved ? Math.round((3 + i) * 60 + Math.random() * 60) : null,
      reason: `${catNames[category]}导致表计离线，请检查设备状态`,
      reasonCategory: category,
      assignee: isResolved ? MOCK_USERS[i % MOCK_USERS.length].name : null,
      acknowledgedAt: isResolved ? new Date(offlineAt.getTime() + 20 * 60 * 1000) : null,
      resolvedAt: isResolved ? new Date(offlineAt.getTime() + (3 + i) * 3600 * 1000) : null,
      responseMinutes: isResolved ? 20 + Math.round(Math.random() * 30) : null,
      resolutionNote: isResolved ? '已修复，设备恢复正常运行' : null,
    });
  }
  return result;
}

function buildAuditLogs() {
  const result: any[] = [];
  const actions = ['create', 'update', 'delete', 'approve', 'acknowledge', 'resolve'];
  const entities = ['zone', 'meter', 'device', 'alert', 'subsidy', 'target', 'offline'];
  for (let i = 0; i < 20; i++) {
    const user = MOCK_USERS[i % MOCK_USERS.length];
    const action = actions[i % actions.length];
    const entity = entities[i % entities.length];
    result.push({
      id: uid(),
      userId: user.id,
      userName: user.name,
      action,
      entityType: entity,
      entityId: uid(),
      oldValue: action === 'create' ? null : { before: 'old_value' },
      newValue: action === 'delete' ? null : { after: 'new_value' },
      ip: '127.0.0.1',
      createdAt: daysAgo(i),
    });
  }
  return result;
}

function buildSavedFilters() {
  return [
    {
      id: uid(),
      name: '待处理严重告警',
      page: 'alerts',
      filters: { status: 'pending', level: 'critical' },
      userId: MOCK_USERS[0].id,
    },
    {
      id: uid(),
      name: '本月处理中',
      page: 'alerts',
      filters: { status: 'processing', timeRange: 'month' },
      userId: MOCK_USERS[1].id,
    },
    {
      id: uid(),
      name: 'A区离线表计',
      page: 'offline',
      filters: { zoneId: MOCK_ZONES[0].id, status: 'active' },
      userId: MOCK_USERS[2].id,
    },
  ];
}

async function main() {
  console.log('Seeding database...');

  console.log('  Inserting users...');
  await db.insert(users).values(MOCK_USERS);

  console.log('  Inserting zones...');
  await db.insert(zones).values(MOCK_ZONES);

  const meterData = buildMeters();
  console.log(`  Inserting ${meterData.length} meters...`);
  await db.insert(meters).values(meterData);

  const deviceData = buildDevices(meterData);
  console.log(`  Inserting ${deviceData.length} devices...`);
  await db.insert(devices).values(deviceData);

  const alertData = buildAlerts(deviceData, MOCK_USERS);
  console.log(`  Inserting ${alertData.length} alerts...`);
  await db.insert(alerts).values(alertData);

  const activityData = buildAlertActivities(alertData, MOCK_USERS);
  console.log(`  Inserting ${activityData.length} alert activities...`);
  await db.insert(alertActivities).values(activityData);

  const energyData = buildEnergyRecords(meterData);
  console.log(`  Inserting ${energyData.length} energy records... (this may take a moment)`);
  const batchSize = 500;
  for (let i = 0; i < energyData.length; i += batchSize) {
    const batch = energyData.slice(i, i + batchSize);
    await db.insert(energyRecords).values(batch);
  }

  const subsidyData = buildSubsidies(MOCK_ZONES);
  console.log(`  Inserting ${subsidyData.length} subsidy records...`);
  await db.insert(subsidyRecords).values(subsidyData);

  const { targets: targetData, details: detailData } = buildTargets(MOCK_ZONES);
  console.log(`  Inserting ${targetData.length} energy saving targets...`);
  await db.insert(energySavingTargets).values(targetData);
  console.log(`  Inserting ${detailData.length} energy saving details...`);
  for (let i = 0; i < detailData.length; i += batchSize) {
    const batch = detailData.slice(i, i + batchSize);
    await db.insert(energySavingDetails).values(batch);
  }

  const offlineData = buildOfflineRecords(meterData);
  console.log(`  Inserting ${offlineData.length} meter offline records...`);
  await db.insert(meterOfflineRecords).values(offlineData);

  const auditData = buildAuditLogs();
  console.log(`  Inserting ${auditData.length} audit logs...`);
  await db.insert(auditLogs).values(auditData);

  const filterData = buildSavedFilters();
  console.log(`  Inserting ${filterData.length} saved filters...`);
  await db.insert(savedFilters).values(filterData);

  console.log('✅ Seeding completed!');
  console.log(`   Users: ${MOCK_USERS.length}`);
  console.log(`   Zones: ${MOCK_ZONES.length}`);
  console.log(`   Meters: ${meterData.length}`);
  console.log(`   Devices: ${deviceData.length}`);
  console.log(`   Alerts: ${alertData.length}`);
  console.log(`   Energy Records: ${energyData.length}`);
  console.log(`   Subsidies: ${subsidyData.length}`);
  console.log(`   Targets: ${targetData.length} (+ ${detailData.length} details)`);
  console.log(`   Offline Records: ${offlineData.length}`);
  console.log(`   Audit Logs: ${auditData.length}`);
  console.log(`   Saved Filters: ${filterData.length}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
