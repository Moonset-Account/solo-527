import type { DeviceAlert, Strategy, RevenueRecord, SubsidyRecord, MeterZone, DashboardStats, TrendDataPoint, ProcessingLog } from '../shared/types';

const now = new Date();

const createDate = (daysAgo: number, hours: number = 0, minutes?: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes ?? 0, 0, 0);
  return d.toISOString();
};

export const mockUsers = [
  { id: 'user1', name: '张工', role: 'ADMIN' },
  { id: 'user2', name: '李工', role: 'OPERATOR' },
  { id: 'user3', name: '王工', role: 'ANALYST' },
];

export const mockZones: MeterZone[] = [
  { id: 'zone1', name: 'A区光伏阵列', code: 'ZONE-A01', location: '东区1号厂房顶', deviceCount: 48, onlineCount: 45, totalCapacity: 2400, status: 'WARNING', createdAt: createDate(30) },
  { id: 'zone2', name: 'B区储能系统', code: 'ZONE-B01', location: '西区储能站', deviceCount: 24, onlineCount: 24, totalCapacity: 1200, status: 'NORMAL', createdAt: createDate(30) },
  { id: 'zone3', name: 'C区光伏阵列', code: 'ZONE-C01', location: '南区2号厂房顶', deviceCount: 60, onlineCount: 58, totalCapacity: 3000, status: 'NORMAL', createdAt: createDate(30) },
  { id: 'zone4', name: 'D区并网系统', code: 'ZONE-D01', location: '北区变电站', deviceCount: 12, onlineCount: 10, totalCapacity: 500, status: 'ERROR', createdAt: createDate(30) },
];

const alertTypes = ['设备离线', '电压异常', '温度过高', '通讯故障', '效率低下', '绝缘告警', '过流保护', '并网异常'];

export const mockAlerts: DeviceAlert[] = [
  { id: 'alert1', deviceId: 'dev1', deviceName: 'A区-逆变器#01', alertLevel: 'CRITICAL', alertType: '设备离线', title: '逆变器通讯中断', description: 'A区1号逆变器已离线超过30分钟，可能影响发电效率', status: 'PENDING', createdAt: createDate(0, 9), updatedAt: createDate(0, 9) },
  { id: 'alert2', deviceId: 'dev2', deviceName: 'A区-组串#12', alertLevel: 'ERROR', alertType: '电压异常', title: '组串直流电压偏低', description: '检测到组串输出电压低于正常值15%，请检查组件连接', status: 'PROCESSING', handlerId: 'user2', handlerName: '李工', createdAt: createDate(0, 8), updatedAt: createDate(0, 8, 30) },
  { id: 'alert3', deviceId: 'dev3', deviceName: 'B区-电池簇#03', alertLevel: 'WARNING', alertType: '温度过高', title: '电池簇温度告警', description: 'B区3号电池簇温度达到55℃，接近阈值，请关注', status: 'PROCESSING', handlerId: 'user2', handlerName: '李工', createdAt: createDate(0, 7), updatedAt: createDate(0, 7, 15) },
  { id: 'alert4', deviceId: 'dev4', deviceName: 'C区-汇流箱#05', alertLevel: 'ERROR', alertType: '绝缘告警', title: '直流绝缘电阻偏低', description: '汇流箱绝缘检测值低于安全阈值，存在安全隐患', status: 'COMPLETED', handlerId: 'user1', handlerName: '张工', responseDurationSeconds: 1800, createdAt: createDate(1, 14), updatedAt: createDate(1, 15) },
  { id: 'alert5', deviceId: 'dev5', deviceName: 'D区-并网开关', alertLevel: 'CRITICAL', alertType: '并网异常', title: '并网开关跳闸', description: 'D区并网开关异常跳闸，需现场检查后恢复', status: 'ABNORMAL_CLOSED', handlerId: 'user1', handlerName: '张工', responseDurationSeconds: 7200, createdAt: createDate(2, 10), updatedAt: createDate(2, 12) },
  { id: 'alert6', deviceId: 'dev6', deviceName: 'A区-环境监测仪', alertLevel: 'INFO', alertType: '效率低下', title: '发电效率低于预期', description: '今日A区发电效率较昨日下降5%，建议检查清洁度', status: 'COMPLETED', handlerId: 'user3', handlerName: '王工', responseDurationSeconds: 3600, createdAt: createDate(3, 9), updatedAt: createDate(3, 10) },
  { id: 'alert7', deviceId: 'dev7', deviceName: 'B区-PCS#02', alertLevel: 'WARNING', alertType: '过流保护', title: 'PCS过流保护动作', description: 'B区2号PCS检测到过流并启动保护，已自动恢复', status: 'PENDING', createdAt: createDate(0, 10), updatedAt: createDate(0, 10) },
  { id: 'alert8', deviceId: 'dev8', deviceName: 'C区-气象站', alertLevel: 'INFO', alertType: '通讯故障', title: '气象站数据延迟', description: 'C区气象站数据更新延迟超过5分钟', status: 'COMPLETED', handlerId: 'user2', handlerName: '李工', responseDurationSeconds: 600, createdAt: createDate(4, 11), updatedAt: createDate(4, 11, 10) },
];

export const mockProcessingLogs: ProcessingLog[] = [
  { id: 'log1', alertId: 'alert2', operatorId: 'user2', operatorName: '李工', action: '接单处理', remark: '已收到告警，正在前往现场检查', timestamp: createDate(0, 8, 30) },
  { id: 'log2', alertId: 'alert3', operatorId: 'user2', operatorName: '李工', action: '接单处理', remark: '远程检查中，已启动散热系统', timestamp: createDate(0, 7, 15) },
  { id: 'log3', alertId: 'alert4', operatorId: 'user1', operatorName: '张工', action: '接单处理', remark: '已安排现场检查', timestamp: createDate(1, 14, 10) },
  { id: 'log4', alertId: 'alert4', operatorId: 'user1', operatorName: '张工', action: '处理完成', remark: '更换绝缘组件，已恢复正常', timestamp: createDate(1, 15) },
  { id: 'log5', alertId: 'alert5', operatorId: 'user1', operatorName: '张工', action: '接单处理', remark: '紧急响应中', timestamp: createDate(2, 10, 5) },
  { id: 'log6', alertId: 'alert5', operatorId: 'user1', operatorName: '张工', action: '异常关闭', remark: '设备硬件损坏，需更换备件后重新处理', timestamp: createDate(2, 12) },
];

export const mockStrategies: Strategy[] = [
  { id: 'strat1', name: '逆变器离线告警策略', description: '当逆变器离线超过15分钟时触发告警并推送通知', triggerCondition: { type: 'offline', duration: 15, deviceType: 'inverter' }, action: { alertLevel: 'CRITICAL', notify: ['user1', 'user2'], autoCheck: true }, status: 'ACTIVE', version: 2, createdById: 'user1', createdByName: '张工', createdAt: createDate(20), updatedAt: createDate(10) },
  { id: 'strat2', name: '电池温度控制策略', description: '电池温度超过50℃时启动散热，超过60℃时告警', triggerCondition: { type: 'temperature', thresholds: [50, 60], deviceType: 'battery' }, action: { coolingControl: true, alertLevels: ['WARNING', 'CRITICAL'] }, status: 'ACTIVE', version: 1, createdById: 'user1', createdByName: '张工', createdAt: createDate(25), updatedAt: createDate(25) },
  { id: 'strat3', name: '组串电压异常检测', description: '组串电压偏差超过10%时触发告警', triggerCondition: { type: 'voltage', deviation: 10, deviceType: 'string' }, action: { alertLevel: 'ERROR', notify: ['user2'] }, status: 'ACTIVE', version: 3, createdById: 'user2', createdByName: '李工', createdAt: createDate(30), updatedAt: createDate(5) },
  { id: 'strat4', name: '夜间自动巡检策略', description: '每日凌晨2点执行设备自动巡检', triggerCondition: { type: 'schedule', time: '02:00', frequency: 'daily' }, action: { autoCheck: true, report: true }, status: 'INACTIVE', version: 1, createdById: 'user1', createdByName: '张工', createdAt: createDate(15), updatedAt: createDate(15) },
  { id: 'strat5', name: '效率低下预警策略', description: '发电效率低于预期80%时触发预警', triggerCondition: { type: 'efficiency', threshold: 80 }, action: { alertLevel: 'INFO', notify: ['user3'] }, status: 'ACTIVE', version: 2, createdById: 'user3', createdByName: '王工', createdAt: createDate(18), updatedAt: createDate(8) },
];

const gapReasons = ['设备通讯中断', '表计数据异常', '网络波动', '设备维护中', '数据同步延迟'];

export const mockRevenueRecords: RevenueRecord[] = Array.from({ length: 30 }, (_, i) => {
  const dayIndex = 29 - i;
  const zone = mockZones[dayIndex % mockZones.length];
  const hasGap = Math.random() < 0.15;
  return {
    id: `rev${i + 1}`,
    date: createDate(dayIndex).split('T')[0],
    zoneId: zone.id,
    zoneName: zone.name,
    chargeEnergy: Math.round((Math.random() * 500 + 200) * 100) / 100,
    dischargeEnergy: Math.round((Math.random() * 480 + 180) * 100) / 100,
    revenue: Math.round((Math.random() * 3000 + 1000) * 100) / 100,
    subsidy: Math.round((Math.random() * 500 + 100) * 100) / 100,
    hasGap,
    gapReason: hasGap ? gapReasons[Math.floor(Math.random() * gapReasons.length)] : undefined,
    gapDurationSeconds: hasGap ? Math.floor(Math.random() * 3600 + 600) : undefined,
    responsiblePerson: hasGap ? mockUsers[Math.floor(Math.random() * mockUsers.length)].name : undefined,
    createdAt: createDate(dayIndex),
  };
});

export const mockSubsidies: SubsidyRecord[] = [
  { id: 'sub1', period: '2026-05', type: '度电补贴', amount: 45600, status: 'PAID', zoneId: 'zone1', zoneName: 'A区光伏阵列', description: '5月份上网电量度电补贴', createdAt: createDate(20) },
  { id: 'sub2', period: '2026-05', type: '储能补贴', amount: 28800, status: 'PAID', zoneId: 'zone2', zoneName: 'B区储能系统', description: '5月份储能调峰补贴', createdAt: createDate(20) },
  { id: 'sub3', period: '2026-05', type: '度电补贴', amount: 57200, status: 'APPROVED', zoneId: 'zone3', zoneName: 'C区光伏阵列', description: '5月份上网电量度电补贴', createdAt: createDate(18) },
  { id: 'sub4', period: '2026-06', type: '度电补贴', amount: 48900, status: 'PENDING', zoneId: 'zone1', zoneName: 'A区光伏阵列', description: '6月份上网电量度电补贴（预估）', createdAt: createDate(5) },
  { id: 'sub5', period: '2026-06', type: '储能补贴', amount: 31200, status: 'PENDING', zoneId: 'zone2', zoneName: 'B区储能系统', description: '6月份储能调峰补贴（预估）', createdAt: createDate(5) },
  { id: 'sub6', period: '2026-04', type: '设备补贴', amount: 120000, status: 'PAID', zoneId: 'zone4', zoneName: 'D区并网系统', description: '新增并网设备购置补贴', createdAt: createDate(40) },
];

export const mockDashboardStats: DashboardStats = {
  totalAlerts: 156,
  pendingAlerts: 2,
  processingAlerts: 2,
  completedAlerts: 148,
  abnormalClosedAlerts: 4,
  alertProcessingRate: 94.87,
  totalRevenue: 125680.5,
  todayRevenue: 8650.25,
  onlineDeviceRate: 96.3,
  activeStrategies: 4,
};

export const mockTrendData: TrendDataPoint[] = Array.from({ length: 7 }, (_, i) => ({
  date: createDate(6 - i).split('T')[0],
  alerts: Math.floor(Math.random() * 10 + 2),
  revenue: Math.round((Math.random() * 5000 + 3000) * 100) / 100,
}));

export const getAlertLogs = (alertId: string): ProcessingLog[] => {
  return mockProcessingLogs.filter(log => log.alertId === alertId);
};

export const getAlertById = (id: string): DeviceAlert | undefined => {
  const alert = mockAlerts.find(a => a.id === id);
  if (alert) {
    return { ...alert, processingLogs: getAlertLogs(id) };
  }
  return undefined;
};

export const getStrategyById = (id: string): Strategy | undefined => {
  return mockStrategies.find(s => s.id === id);
};
