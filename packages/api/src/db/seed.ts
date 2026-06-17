import { db } from './index';
import * as schema from './schema';
import { eq, sql } from 'drizzle-orm';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number) {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

async function seed() {
  console.log('Seeding database...');

  const users = await db
    .insert(schema.users)
    .values([
      { name: '系统管理员', email: 'admin@solar.com', role: 'admin' },
      { name: '张经理', email: 'zhang@solar.com', role: 'manager' },
      { name: '李运维', email: 'li@solar.com', role: 'operator' },
      { name: '王监控', email: 'wang@solar.com', role: 'viewer' },
    ])
    .returning();
  console.log(`Created ${users.length} users`);

  const zones = await db
    .insert(schema.zones)
    .values([
      { name: 'A区 - 屋顶阵列', description: '厂房屋顶太阳能板阵列，装机容量500kW', capacity: '500' },
      { name: 'B区 - 车棚阵列', description: '停车场车棚光伏阵列，装机容量200kW', capacity: '200' },
      { name: 'C区 - 地面电站', description: '地面集中式光伏电站，装机容量1000kW', capacity: '1000' },
      { name: 'D区 - 实验测试区', description: '新型组件测试区域，装机容量50kW', capacity: '50' },
    ])
    .returning();
  console.log(`Created ${zones.length} zones`);

  const meterValues = [];
  for (const zone of zones) {
    const meterCount = zone.name.startsWith('C') ? 4 : zone.name.startsWith('A') ? 3 : 2;
    for (let i = 1; i <= meterCount; i++) {
      meterValues.push({
        zoneId: zone.id,
        name: `${zone.name.split(' - ')[0]}表计${i}号`,
        model: i % 2 === 0 ? 'Sungrow-MT100' : 'Huawei-DTSU666',
        serialNumber: `MTR-${zone.id.slice(0, 4)}-${String(i).padStart(3, '0')}`,
        status: i === meterCount && zone.id === zones[0].id ? 'offline' : 'online',
        lastHeartbeat: i === meterCount && zone.id === zones[0].id ? daysAgo(2) : hoursAgo(0.5),
        installedAt: daysAgo(Math.floor(Math.random() * 365) + 30),
      });
    }
  }
  const meters = await db.insert(schema.meters).values(meterValues).returning();
  console.log(`Created ${meters.length} meters`);

  const deviceValues = [];
  const deviceTypes: Array<'inverter' | 'panel' | 'meter' | 'battery' | 'transformer'> = [
    'inverter',
    'panel',
    'battery',
    'transformer',
  ];
  for (const zone of zones) {
    const zoneMeters = meters.filter((m) => m.zoneId === zone.id);
    const deviceCount = zone.name.startsWith('C') ? 20 : zone.name.startsWith('A') ? 12 : 6;
    for (let i = 1; i <= deviceCount; i++) {
      const type = deviceTypes[i % deviceTypes.length];
      const meter = zoneMeters[i % zoneMeters.length];
      deviceValues.push({
        zoneId: zone.id,
        meterId: meter?.id,
        name: `${zone.name.split(' - ')[0]}${type === 'inverter' ? '逆变器' : type === 'panel' ? '组件' : type === 'battery' ? '储能' : '变压器'}${i}`,
        type,
        model: `${type.toUpperCase()}-${String(1000 + i)}`,
        serialNumber: `DEV-${zone.id.slice(0, 4)}-${type.slice(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`,
        status: i === 5 && zone.id === zones[0].id ? 'fault' : i === 8 && zone.id === zones[2].id ? 'maintenance' : 'running',
        capacity: type === 'panel' ? '0.5' : type === 'inverter' ? '100' : type === 'battery' ? '200' : '500',
        installedAt: daysAgo(Math.floor(Math.random() * 365) + 60),
      });
    }
  }
  const devices = await db.insert(schema.devices).values(deviceValues).returning();
  console.log(`Created ${devices.length} devices`);

  const alertTitles = {
    critical: ['直流过压严重', '绝缘阻抗异常', '并网跳闸', '组件过热告警'],
    warning: ['输出功率波动', '环境温度偏高', '通讯中断预警', '效率下降告警'],
    info: ['设备启动完成', '定时自检通过', '固件升级通知', '数据同步提醒'],
  };
  const alertValues = [];
  const faultDevices = devices.filter((d) => d.status === 'fault' || d.status === 'maintenance');
  const randomDevices = devices.slice(0, 15);
  const allAlertDevices = [...faultDevices, ...randomDevices];
  for (let i = 0; i < 25; i++) {
    const device = allAlertDevices[i % allAlertDevices.length];
    const levelArr = ['critical', 'warning', 'info'] as const;
    const level = levelArr[i % 3];
    const statusArr = ['pending', 'processing', 'resolved', 'ignored'] as const;
    const status = i < 8 ? statusArr[i % 2] : 'resolved';
    const user = users[i % users.length];
    alertValues.push({
      deviceId: device.id,
      zoneId: device.zoneId,
      level,
      title: alertTitles[level][i % alertTitles[level].length],
      description: `设备${device.name}检测到${level === 'critical' ? '严重' : level === 'warning' ? '警告级' : '提示级'}异常，请及时处理。详细数据已上报。`,
      status,
      acknowledgedBy: status !== 'pending' ? user.id : undefined,
      acknowledgedAt: status !== 'pending' ? hoursAgo(i * 2) : undefined,
      resolvedBy: status === 'resolved' ? users[(i + 1) % users.length].id : undefined,
      resolvedAt: status === 'resolved' ? hoursAgo(i) : undefined,
      assignee: status !== 'pending' && status !== 'ignored' ? user.name : undefined,
      sourceData: { value: Math.random() * 100, threshold: 80, rawData: {} },
      createdAt: hoursAgo(i * 3 + Math.random() * 5),
    });
  }
  const alerts = await db.insert(schema.alerts).values(alertValues).returning();
  console.log(`Created ${alerts.length} alerts`);

  const activityValues = [];
  for (const alert of alerts) {
    activityValues.push({
      alertId: alert.id,
      operatorId: users[0].id,
      operatorName: users[0].name,
      action: 'create',
      note: '系统自动生成告警',
      createdAt: alert.createdAt,
    });
    if (alert.status !== 'pending') {
      activityValues.push({
        alertId: alert.id,
        operatorId: alert.acknowledgedBy || users[1].id,
        operatorName: users.find((u) => u.id === alert.acknowledgedBy)?.name || '张经理',
        action: 'acknowledge',
        note: '已知悉，开始处理',
        createdAt: alert.acknowledgedAt!,
      });
    }
    if (alert.status === 'resolved') {
      activityValues.push({
        alertId: alert.id,
        operatorId: alert.resolvedBy || users[2].id,
        operatorName: users.find((u) => u.id === alert.resolvedBy)?.name || '李运维',
        action: 'resolve',
        note: '问题已修复，设备恢复正常运行',
        createdAt: alert.resolvedAt!,
      });
    }
  }
  await db.insert(schema.alertActivities).values(activityValues);
  console.log(`Created ${activityValues.length} alert activities`);

  const energyValues = [];
  for (const meter of meters) {
    for (let h = 24 * 30; h >= 0; h--) {
      const ts = hoursAgo(h);
      const hour = ts.getHours();
      const daylight = hour >= 6 && hour <= 18;
      const production = daylight ? Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI) * 50 + (Math.random() - 0.5) * 10) : 0;
      energyValues.push({
        meterId: meter.id,
        zoneId: meter.zoneId,
        timestamp: ts,
        production: String(production.toFixed(2)),
        consumption: String((8 + Math.random() * 5).toFixed(2)),
        gridExport: String(Math.max(0, production - 10).toFixed(2)),
        gridImport: String(Math.max(0, 10 - production).toFixed(2)),
        efficiency: String((85 + Math.random() * 10).toFixed(2)),
      });
    }
  }
  await db.insert(schema.energyRecords).values(energyValues);
  console.log(`Created ${energyValues.length} energy records`);

  const subsidyValues = [];
  for (const zone of zones) {
    for (let m = 5; m >= 0; m--) {
      const start = new Date();
      start.setMonth(start.getMonth() - m, 1);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1, 0);
      const prod = Number(zone.capacity) * 4 * 30 * (0.9 + Math.random() * 0.2);
      const rate = 0.42;
      subsidyValues.push({
        zoneId: zone.id,
        periodStart: start,
        periodEnd: end,
        productionKwh: String(prod.toFixed(2)),
        subsidyRate: String(rate),
        subsidyAmount: String((prod * rate).toFixed(2)),
        status: m < 2 ? 'pending' : m < 4 ? 'approved' : 'paid',
        approvedBy: m >= 2 ? users[0].id : undefined,
        approvedAt: m >= 2 ? daysAgo(m * 30 + 5) : undefined,
        remark: m === 0 ? '本月数据待审核' : undefined,
        updatedBy: users[0].id,
      });
    }
  }
  const subsidies = await db.insert(schema.subsidyRecords).values(subsidyValues).returning();
  console.log(`Created ${subsidies.length} subsidy records`);

  const targets = await db
    .insert(schema.energySavingTargets)
    .values([
      {
        zoneId: zones[0].id,
        name: 'A区Q2节能目标',
        period: 'quarterly',
        targetKwh: '15000',
        baselineKwh: '50000',
        startDate: new Date(new Date().getFullYear(), 3, 1),
        endDate: new Date(new Date().getFullYear(), 5, 30),
      },
      {
        zoneId: zones[2].id,
        name: 'C区月度节能目标',
        period: 'monthly',
        targetKwh: '8000',
        baselineKwh: '40000',
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      },
      {
        name: '全站年度节能目标',
        period: 'yearly',
        targetKwh: '120000',
        baselineKwh: '600000',
        startDate: new Date(new Date().getFullYear(), 0, 1),
        endDate: new Date(new Date().getFullYear(), 11, 31),
      },
    ])
    .returning();
  console.log(`Created ${targets.length} energy saving targets`);

  const detailValues = [];
  for (const target of targets) {
    const start = new Date(target.startDate);
    const end = new Date(target.endDate);
    const cur = new Date(start);
    while (cur <= end && cur <= new Date()) {
      const actual = Number(target.baselineKwh) / 90 * (0.78 + Math.random() * 0.08);
      const baseline = Number(target.baselineKwh) / 90;
      detailValues.push({
        targetId: target.id,
        date: new Date(cur),
        actualKwh: String(actual.toFixed(2)),
        baselineKwh: String(baseline.toFixed(2)),
        savedKwh: String((baseline - actual).toFixed(2)),
        zoneId: target.zoneId,
      });
      cur.setDate(cur.getDate() + 1);
    }
  }
  await db.insert(schema.energySavingDetails).values(detailValues);
  console.log(`Created ${detailValues.length} energy saving details`);

  const offlineValues = [];
  const offlineMeters = meters.filter((m) => m.status === 'offline');
  for (const meter of offlineMeters) {
    offlineValues.push({
      meterId: meter.id,
      zoneId: meter.zoneId,
      offlineAt: daysAgo(2),
      onlineAt: undefined,
      durationMinutes: undefined,
      reason: '表计通讯模块故障，无法连接网络',
      reasonCategory: 'hardware',
      assignee: '李运维',
      acknowledgedAt: daysAgo(2),
      resolvedAt: undefined,
      responseMinutes: 23,
      resolutionNote: undefined,
    });
  }
  const resolvedOfflines = [
    { meterIdx: 1, category: 'network', reason: '交换机端口异常', duration: 45, response: 12 },
    { meterIdx: 4, category: 'power', reason: '上游空开跳闸', duration: 15, response: 8 },
    { meterIdx: 7, category: 'software', reason: '固件版本兼容问题', duration: 120, response: 35 },
  ];
  for (const ro of resolvedOfflines) {
    const m = meters[Math.min(ro.meterIdx, meters.length - 1)];
    offlineValues.push({
      meterId: m.id,
      zoneId: m.zoneId,
      offlineAt: daysAgo(15 + ro.meterIdx * 3),
      onlineAt: daysAgo(15 + ro.meterIdx * 3),
      durationMinutes: ro.duration,
      reason: ro.reason,
      reasonCategory: ro.category,
      assignee: '李运维',
      acknowledgedAt: daysAgo(15 + ro.meterIdx * 3),
      resolvedAt: daysAgo(15 + ro.meterIdx * 3),
      responseMinutes: ro.response,
      resolutionNote: `已${ro.category === 'network' ? '更换端口并测试连通性' : ro.category === 'power' ? '合闸确认并检查回路' : '升级固件至最新版本'}`,
    });
  }
  await db.insert(schema.meterOfflineRecords).values(offlineValues);
  console.log(`Created ${offlineValues.length} meter offline records`);

  console.log('Seeding completed!');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
