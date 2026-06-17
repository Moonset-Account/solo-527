import type {
  Zone,
  Meter,
  Device,
  Alert,
  AlertActivity,
  EnergyRecord,
  SubsidyRecord,
  EnergySavingTarget,
  EnergySavingDetail,
  MeterOfflineRecord,
  User,
  AuditLog,
  SavedFilter,
} from '@solar/shared';

function uid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowISO(): string {
  return new Date().toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function hoursAgo(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

const MOCK_USERS: User[] = [
  { id: uid(), name: '系统管理员', email: 'admin@solar.com', role: 'admin', createdAt: daysAgo(100) },
  { id: uid(), name: '张经理', email: 'zhang@solar.com', role: 'manager', createdAt: daysAgo(90) },
  { id: uid(), name: '李运维', email: 'li@solar.com', role: 'operator', createdAt: daysAgo(80) },
  { id: uid(), name: '王监控', email: 'wang@solar.com', role: 'viewer', createdAt: daysAgo(70) },
];

const MOCK_ZONES: Zone[] = [
  { id: uid(), name: 'A区 - 屋顶阵列', description: '厂房屋顶太阳能板阵列，装机容量500kW', capacity: 500, createdAt: daysAgo(200), updatedAt: daysAgo(200) },
  { id: uid(), name: 'B区 - 车棚阵列', description: '停车场车棚光伏阵列，装机容量200kW', capacity: 200, createdAt: daysAgo(180), updatedAt: daysAgo(180) },
  { id: uid(), name: 'C区 - 地面电站', description: '地面集中式光伏电站，装机容量1000kW', capacity: 1000, createdAt: daysAgo(150), updatedAt: daysAgo(150) },
  { id: uid(), name: 'D区 - 实验测试区', description: '新型组件测试区域，装机容量50kW', capacity: 50, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
];

function buildMeters(): Meter[] {
  const result: Meter[] = [];
  const configs: Array<[string, number, string]> = [
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
        createdAt: daysAgo(Math.floor(Math.random() * 200) + 30),
        updatedAt: daysAgo(Math.floor(Math.random() * 10)),
      });
    }
  }
  return result;
}

function buildDevices(meters: Meter[]): Device[] {
  const types: Device['type'][] = ['inverter', 'panel', 'battery', 'transformer'];
  const typeNames: Record<Device['type'], string> = {
    inverter: '逆变器',
    panel: '组件',
    battery: '储能',
    transformer: '变压器',
    meter: '表计',
  };
  const result: Device[] = [];
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
        capacity: type === 'panel' ? 0.5 : type === 'inverter' ? 100 : type === 'battery' ? 200 : 500,
        installedAt: daysAgo(Math.floor(Math.random() * 200) + 60),
        createdAt: daysAgo(Math.floor(Math.random() * 200) + 60),
        updatedAt: daysAgo(Math.floor(Math.random() * 10)),
      });
    }
  }
  return result;
}

function buildAlerts(devices: Device[]): Alert[] {
  const titles: Record<Alert['level'], string[]> = {
    critical: ['直流过压严重', '绝缘阻抗异常', '并网跳闸', '组件过热告警'],
    warning: ['输出功率波动', '环境温度偏高', '通讯中断预警', '效率下降告警'],
    info: ['设备启动完成', '定时自检通过', '固件升级通知', '数据同步提醒'],
  };
  const result: Alert[] = [];
  const levels: Alert['level'][] = ['critical', 'warning', 'info'];
  const statuses: Alert['status'][] = ['pending', 'processing', 'resolved', 'ignored'];
  const targets = [
    ...devices.filter((d) => d.status === 'fault' || d.status === 'maintenance'),
    ...devices.slice(0, 15),
  ];
  for (let i = 0; i < 28; i++) {
    const device = targets[i % targets.length];
    const level = levels[i % 3];
    const status = i < 8 ? statuses[i % 2] : 'resolved';
    const user = MOCK_USERS[i % MOCK_USERS.length];
    result.push({
      id: uid(),
      deviceId: device.id,
      zoneId: device.zoneId,
      level,
      title: titles[level][i % titles[level].length],
      description: `设备【${device.name}】检测到${level === 'critical' ? '严重' : level === 'warning' ? '警告级' : '提示级'}异常，请及时处理。详细数据已上报监控中心。`,
      status,
      acknowledgedBy: status !== 'pending' ? user.id : undefined,
      acknowledgedAt: status !== 'pending' ? hoursAgo(i * 2) : undefined,
      resolvedBy: status === 'resolved' ? MOCK_USERS[(i + 1) % MOCK_USERS.length].id : undefined,
      resolvedAt: status === 'resolved' ? hoursAgo(i) : undefined,
      assignee: status !== 'pending' && status !== 'ignored' ? user.name : undefined,
      sourceData: { value: Math.round(Math.random() * 100), threshold: 80 },
      createdAt: hoursAgo(i * 3 + Math.random() * 5),
      updatedAt: hoursAgo(i),
    });
  }
  return result;
}

function buildActivities(alerts: Alert[]): AlertActivity[] {
  const result: AlertActivity[] = [];
  for (const alert of alerts) {
    result.push({
      id: uid(),
      alertId: alert.id,
      operatorId: MOCK_USERS[0].id,
      operatorName: MOCK_USERS[0].name,
      action: 'create',
      note: '系统自动检测并生成告警',
      createdAt: alert.createdAt,
    });
    if (alert.status !== 'pending') {
      const ackUser = MOCK_USERS.find((u) => u.id === alert.acknowledgedBy) || MOCK_USERS[1];
      result.push({
        id: uid(),
        alertId: alert.id,
        operatorId: ackUser.id,
        operatorName: ackUser.name,
        action: 'acknowledge',
        note: '已知悉，已安排现场排查',
        createdAt: alert.acknowledgedAt!,
      });
    }
    if (alert.status === 'resolved') {
      const resUser = MOCK_USERS.find((u) => u.id === alert.resolvedBy) || MOCK_USERS[2];
      result.push({
        id: uid(),
        alertId: alert.id,
        operatorId: resUser.id,
        operatorName: resUser.name,
        action: 'resolve',
        note: '问题已修复，设备运行参数恢复正常范围',
        createdAt: alert.resolvedAt!,
      });
    }
  }
  return result;
}

function buildEnergyRecords(meters: Meter[]): EnergyRecord[] {
  const result: EnergyRecord[] = [];
  for (const meter of meters) {
    for (let h = 24 * 30; h >= 0; h -= 1) {
      const d = new Date();
      d.setHours(d.getHours() - h);
      const hour = d.getHours();
      const isDay = hour >= 6 && hour <= 18;
      const baseProduction = isDay ? Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI) * 50) : 0;
      const production = Math.max(0, baseProduction + (Math.random() - 0.5) * 10);
      const consumption = 8 + Math.random() * 5;
      result.push({
        id: uid(),
        meterId: meter.id,
        zoneId: meter.zoneId,
        timestamp: d.toISOString(),
        production: Number(production.toFixed(2)),
        consumption: Number(consumption.toFixed(2)),
        gridExport: Number(Math.max(0, production - 10).toFixed(2)),
        gridImport: Number(Math.max(0, 10 - production).toFixed(2)),
        efficiency: Number((85 + Math.random() * 10).toFixed(2)),
      });
    }
  }
  return result;
}

function buildSubsidies(): SubsidyRecord[] {
  const result: SubsidyRecord[] = [];
  for (const zone of MOCK_ZONES) {
    for (let m = 5; m >= 0; m--) {
      const start = new Date();
      start.setMonth(start.getMonth() - m, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      const prod = Number(zone.capacity) * 4 * 30 * (0.9 + Math.random() * 0.2);
      result.push({
        id: uid(),
        zoneId: zone.id,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        productionKwh: Number(prod.toFixed(2)),
        subsidyRate: 0.42,
        subsidyAmount: Number((prod * 0.42).toFixed(2)),
        status: m < 2 ? 'pending' : m < 4 ? 'approved' : 'paid',
        approvedBy: m >= 2 ? MOCK_USERS[0].id : undefined,
        approvedAt: m >= 2 ? daysAgo(m * 30 + 5) : undefined,
        remark: m === 0 ? '本月数据待审核确认' : undefined,
        createdAt: daysAgo(m * 30 + 3),
        updatedAt: daysAgo(m * 30 + 1),
        updatedBy: MOCK_USERS[0].id,
      });
    }
  }
  return result;
}

function buildTargets(): EnergySavingTarget[] {
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  return [
    {
      id: uid(),
      zoneId: MOCK_ZONES[0].id,
      name: 'A区Q2节能目标',
      period: 'quarterly',
      targetKwh: 15000,
      baselineKwh: 50000,
      startDate: new Date(y, 3, 1).toISOString(),
      endDate: new Date(y, 5, 30).toISOString(),
      createdAt: daysAgo(120),
      updatedAt: daysAgo(120),
    },
    {
      id: uid(),
      zoneId: MOCK_ZONES[2].id,
      name: 'C区月度节能目标',
      period: 'monthly',
      targetKwh: 8000,
      baselineKwh: 40000,
      startDate: new Date(y, m, 1).toISOString(),
      endDate: new Date(y, m + 1, 0).toISOString(),
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
    {
      id: uid(),
      zoneId: undefined,
      name: '全站年度节能目标',
      period: 'yearly',
      targetKwh: 120000,
      baselineKwh: 600000,
      startDate: new Date(y, 0, 1).toISOString(),
      endDate: new Date(y, 11, 31).toISOString(),
      createdAt: daysAgo(180),
      updatedAt: daysAgo(180),
    },
  ];
}

function buildTargetDetails(targets: EnergySavingTarget[]): EnergySavingDetail[] {
  const result: EnergySavingDetail[] = [];
  for (const target of targets) {
    const s = new Date(target.startDate);
    const e = new Date(target.endDate);
    const cur = new Date(s);
    const today = new Date();
    const totalDays = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
    while (cur <= e && cur <= today) {
      const actual = (Number(target.baselineKwh) / totalDays) * (0.78 + Math.random() * 0.08);
      const baseline = Number(target.baselineKwh) / totalDays;
      result.push({
        id: uid(),
        targetId: target.id,
        date: new Date(cur).toISOString(),
        actualKwh: Number(actual.toFixed(2)),
        baselineKwh: Number(baseline.toFixed(2)),
        savedKwh: Number((baseline - actual).toFixed(2)),
        zoneId: target.zoneId,
      });
      cur.setDate(cur.getDate() + 1);
    }
  }
  return result;
}

function buildOfflineRecords(meters: Meter[]): MeterOfflineRecord[] {
  const result: MeterOfflineRecord[] = [];
  const offlineMeters = meters.filter((m) => m.status === 'offline');
  for (const m of offlineMeters) {
    result.push({
      id: uid(),
      meterId: m.id,
      zoneId: m.zoneId,
      offlineAt: daysAgo(2),
      onlineAt: undefined,
      durationMinutes: undefined,
      reason: '表计通讯模块硬件故障，无法连接网关',
      reasonCategory: 'hardware',
      assignee: '李运维',
      acknowledgedAt: daysAgo(2),
      resolvedAt: undefined,
      responseMinutes: 23,
      resolutionNote: undefined,
      createdAt: daysAgo(2),
    });
  }
  const extraCfgs = [
    { idx: 1, category: 'network' as const, reason: '核心交换机端口异常，光模块损坏', duration: 45, response: 12 },
    { idx: 4, category: 'power' as const, reason: '上游配电柜空开跳闸', duration: 15, response: 8 },
    { idx: 7, category: 'software' as const, reason: '表计固件版本与网关兼容问题', duration: 120, response: 35 },
    { idx: 9, category: 'maintenance' as const, reason: '计划内停电维护', duration: 180, response: 0 },
  ];
  for (const cfg of extraCfgs) {
    const m = meters[Math.min(cfg.idx, meters.length - 1)];
    result.push({
      id: uid(),
      meterId: m.id,
      zoneId: m.zoneId,
      offlineAt: daysAgo(15 + cfg.idx * 3),
      onlineAt: daysAgo(15 + cfg.idx * 3),
      durationMinutes: cfg.duration,
      reason: cfg.reason,
      reasonCategory: cfg.category,
      assignee: '李运维',
      acknowledgedAt: daysAgo(15 + cfg.idx * 3),
      resolvedAt: daysAgo(15 + cfg.idx * 3),
      responseMinutes: cfg.response,
      resolutionNote:
        cfg.category === 'network'
          ? '更换光模块并重新配置VLAN，网络连通性已恢复'
          : cfg.category === 'power'
          ? '合闸并检查回路绝缘，供电恢复正常'
          : cfg.category === 'software'
          ? '升级固件至 v2.3.1，通讯恢复稳定'
          : '维护完成，设备按计划恢复上线',
      createdAt: daysAgo(15 + cfg.idx * 3),
    });
  }
  return result;
}

export const store = {
  uid,
  nowISO,
  users: [...MOCK_USERS],
  zones: [...MOCK_ZONES],
  meters: [] as Meter[],
  devices: [] as Device[],
  alerts: [] as Alert[],
  alertActivities: [] as AlertActivity[],
  energyRecords: [] as EnergyRecord[],
  subsidyRecords: [] as SubsidyRecord[],
  energySavingTargets: [] as EnergySavingTarget[],
  energySavingDetails: [] as EnergySavingDetail[],
  meterOfflineRecords: [] as MeterOfflineRecord[],
  auditLogs: [] as AuditLog[],
  savedFilters: [] as SavedFilter[],
};

store.meters = buildMeters();
store.devices = buildDevices(store.meters);
store.alerts = buildAlerts(store.devices);
store.alertActivities = buildActivities(store.alerts);
store.energyRecords = buildEnergyRecords(store.meters);
store.subsidyRecords = buildSubsidies();
store.energySavingTargets = buildTargets();
store.energySavingDetails = buildTargetDetails(store.energySavingTargets);
store.meterOfflineRecords = buildOfflineRecords(store.meters);

export function auditLog(input: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
}) {
  const user = store.users.find((u) => u.id === input.userId) || store.users[0];
  const log: AuditLog = {
    id: uid(),
    userId: input.userId,
    userName: user.name,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    oldValue: input.oldValue,
    newValue: input.newValue,
    ip: input.ip || '127.0.0.1',
    createdAt: nowISO(),
  };
  store.auditLogs.unshift(log);
  return log;
}

export function paginate<T>(arr: T[], page = 1, pageSize = 20) {
  const total = arr.length;
  const p = Math.max(1, page);
  const ps = Math.max(1, Math.min(100, pageSize));
  const start = (p - 1) * ps;
  const data = arr.slice(start, start + ps);
  return { data, total, page: p, pageSize: ps };
}

export const CURRENT_USER_ID = MOCK_USERS[0].id;
export const CURRENT_USER = MOCK_USERS[0];
export { uid, nowISO };
