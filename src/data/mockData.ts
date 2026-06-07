import type {
  Prescription,
  Window,
  Pharmacist,
  Department,
  Remark,
  KPIData,
  WaitDistributionItem,
  WindowCompareItem,
  HourlyPrescriptionItem,
  SankeyData,
  TimePeriod,
} from '@/types';

export const WINDOW_IDS: Record<string, string> = {
  w1: '00000000-0000-0000-0000-000000000101',
  w2: '00000000-0000-0000-0000-000000000102',
  w3: '00000000-0000-0000-0000-000000000103',
  w4: '00000000-0000-0000-0000-000000000104',
  w5: '00000000-0000-0000-0000-000000000105',
  w6: '00000000-0000-0000-0000-000000000106',
};

export const PHARMACIST_IDS: Record<string, string> = {
  p1: '00000000-0000-0000-0000-000000000201',
  p2: '00000000-0000-0000-0000-000000000202',
  p3: '00000000-0000-0000-0000-000000000203',
  p4: '00000000-0000-0000-0000-000000000204',
  p5: '00000000-0000-0000-0000-000000000205',
  p6: '00000000-0000-0000-0000-000000000206',
  p7: '00000000-0000-0000-0000-000000000207',
  p8: '00000000-0000-0000-0000-000000000208',
  p9: '00000000-0000-0000-0000-000000000209',
  p10: '00000000-0000-0000-0000-000000000210',
};

export const DEPARTMENT_IDS: Record<string, string> = {
  d1: '00000000-0000-0000-0000-000000000001',
  d2: '00000000-0000-0000-0000-000000000002',
  d3: '00000000-0000-0000-0000-000000000003',
  d4: '00000000-0000-0000-0000-000000000004',
  d5: '00000000-0000-0000-0000-000000000005',
  d6: '00000000-0000-0000-0000-000000000006',
  d7: '00000000-0000-0000-0000-000000000007',
  d8: '00000000-0000-0000-0000-000000000008',
  d9: '00000000-0000-0000-0000-000000000009',
  d10: '00000000-0000-0000-0000-000000000010',
};

export const windows: Window[] = [
  { id: WINDOW_IDS.w1, windowNo: '1', windowName: '1号窗口', area: 'outpatient', capacity: 200, isActive: true },
  { id: WINDOW_IDS.w2, windowNo: '2', windowName: '2号窗口', area: 'outpatient', capacity: 200, isActive: true },
  { id: WINDOW_IDS.w3, windowNo: '3', windowName: '3号窗口', area: 'outpatient', capacity: 200, isActive: true },
  { id: WINDOW_IDS.w4, windowNo: '4', windowName: '4号窗口(急诊)', area: 'emergency', capacity: 180, isActive: true },
  { id: WINDOW_IDS.w5, windowNo: '5', windowName: '5号窗口(专科)', area: 'outpatient', capacity: 150, isActive: true },
  { id: WINDOW_IDS.w6, windowNo: '6', windowName: '6号窗口(专科)', area: 'outpatient', capacity: 150, isActive: true },
];

export const pharmacists: Pharmacist[] = [
  { id: PHARMACIST_IDS.p1, name: '张药师', title: '主管药师', specialty: '西药', windowId: WINDOW_IDS.w1 },
  { id: PHARMACIST_IDS.p2, name: '李药师', title: '药师', specialty: '西药', windowId: WINDOW_IDS.w1 },
  { id: PHARMACIST_IDS.p3, name: '王药师', title: '副主任药师', specialty: '中药', windowId: WINDOW_IDS.w2 },
  { id: PHARMACIST_IDS.p4, name: '赵药师', title: '主管药师', specialty: '西药', windowId: WINDOW_IDS.w2 },
  { id: PHARMACIST_IDS.p5, name: '刘药师', title: '副主任药师', specialty: '抗生素', windowId: WINDOW_IDS.w3 },
  { id: PHARMACIST_IDS.p6, name: '陈药师', title: '药师', specialty: '西药', windowId: WINDOW_IDS.w3 },
  { id: PHARMACIST_IDS.p7, name: '杨药师', title: '药师', specialty: '肿瘤用药', windowId: WINDOW_IDS.w4 },
  { id: PHARMACIST_IDS.p8, name: '黄药师', title: '主管药师', specialty: '急诊用药', windowId: WINDOW_IDS.w4 },
  { id: PHARMACIST_IDS.p9, name: '周药师', title: '药师', specialty: '急诊用药', windowId: WINDOW_IDS.w5 },
  { id: PHARMACIST_IDS.p10, name: '吴药师', title: '副主任药师', specialty: '专科用药', windowId: WINDOW_IDS.w6 },
];

export const departments: Department[] = [
  { id: DEPARTMENT_IDS.d1, deptName: '急诊科', deptCategory: 'emergency', dailyPrescriptionAvg: 150 },
  { id: DEPARTMENT_IDS.d2, deptName: '内科', deptCategory: 'outpatient', dailyPrescriptionAvg: 200 },
  { id: DEPARTMENT_IDS.d3, deptName: '外科', deptCategory: 'outpatient', dailyPrescriptionAvg: 120 },
  { id: DEPARTMENT_IDS.d4, deptName: '儿科', deptCategory: 'outpatient', dailyPrescriptionAvg: 180 },
  { id: DEPARTMENT_IDS.d5, deptName: '妇产科', deptCategory: 'outpatient', dailyPrescriptionAvg: 90 },
  { id: DEPARTMENT_IDS.d6, deptName: '肿瘤科', deptCategory: 'outpatient', dailyPrescriptionAvg: 60 },
  { id: DEPARTMENT_IDS.d7, deptName: '心内科', deptCategory: 'outpatient', dailyPrescriptionAvg: 110 },
  { id: DEPARTMENT_IDS.d8, deptName: '神经内科', deptCategory: 'outpatient', dailyPrescriptionAvg: 80 },
  { id: DEPARTMENT_IDS.d9, deptName: '皮肤科', deptCategory: 'outpatient', dailyPrescriptionAvg: 70 },
  { id: DEPARTMENT_IDS.d10, deptName: '眼科', deptCategory: 'outpatient', dailyPrescriptionAvg: 65 },
];

export const mockRemarks: Remark[] = [
  {
    id: 'r1',
    targetType: 'window',
    targetValue: WINDOW_IDS.w3,
    targetTitle: '3号窗口',
    content: '上午9-11点3号窗口排队严重，建议增加临时药师支援',
    author: '张主任',
    createdAt: '2026-06-01T10:30:00Z',
    severity: 'warning',
  },
  {
    id: 'r2',
    targetType: 'metric',
    targetValue: 'avgWaitTime',
    targetTitle: '平均等待时长',
    content: '本周平均等待时长较上周下降8.3%，配药效率提升明显',
    author: '系统',
    createdAt: '2026-06-05T09:00:00Z',
    severity: 'normal',
  },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTimePeriodFromHour(hour: number): TimePeriod {
  if (hour >= 6 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 12) return 'noon';
  if (hour >= 12 && hour < 14) return 'afternoon';
  if (hour >= 14 && hour < 17) return 'evening';
  return 'night';
}

function generatePrescription(id: number, date: Date): Prescription {
  const hour = randomInt(6, 22);
  const minute = randomInt(0, 59);
  const createdAt = new Date(date);
  createdAt.setHours(hour, minute, 0, 0);

  const dept = randomChoice(departments);

  let type: 'emergency' | 'normal' | 'specialist';
  let window: Window;
  let pharmacist: Pharmacist;

  if (dept.deptCategory === 'emergency') {
    type = 'emergency';
    window = windows.find((w) => w.area === 'emergency') || windows[3];
    pharmacist = randomChoice(pharmacists.filter((p) => p.windowId === window.id));
  } else if (id % 5 === 0) {
    type = 'specialist';
    const specialistWindows = windows.filter((w) => w.id === WINDOW_IDS.w5 || w.id === WINDOW_IDS.w6);
    window = randomChoice(specialistWindows);
    pharmacist = randomChoice(pharmacists.filter((p) => p.windowId === window.id));
  } else {
    type = 'normal';
    const outpatientWindows = windows.filter((w) => w.area === 'outpatient');
    window = randomChoice(outpatientWindows);
    pharmacist = randomChoice(pharmacists.filter((p) => p.windowId === window.id));
  }

  const payDelay = type === 'emergency' ? randomInt(1, 5) : randomInt(3, 15);
  const dispenseDelay = type === 'emergency' ? randomInt(2, 8) : randomInt(5, 25);
  const callDelay = type === 'emergency' ? randomInt(0, 2) : randomInt(1, 5);
  const pickDelay = type === 'emergency' ? randomInt(1, 5) : randomInt(2, 15);

  const paidAt = new Date(createdAt.getTime() + payDelay * 60000);
  const dispensedAt = new Date(paidAt.getTime() + dispenseDelay * 60000);
  const calledAt = new Date(dispensedAt.getTime() + callDelay * 60000);
  const pickedAt = new Date(calledAt.getTime() + pickDelay * 60000);

  const isRefunded = Math.random() < 0.03;

  const waitTime = Math.round((pickedAt.getTime() - createdAt.getTime()) / 60000);
  const dispenseTime = Math.round((dispensedAt.getTime() - paidAt.getTime()) / 60000);

  return {
    id: `presc_${id.toString().padStart(6, '0')}`,
    prescriptionNo: `RX${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${id.toString().padStart(6, '0')}`,
    type,
    departmentId: dept.id,
    departmentName: dept.deptName,
    windowId: window.id,
    windowNo: window.windowNo,
    pharmacistId: pharmacist.id,
    pharmacistName: pharmacist.name,
    createdAt: createdAt.toISOString(),
    paidAt: paidAt.toISOString(),
    dispensedAt: dispensedAt.toISOString(),
    calledAt: calledAt.toISOString(),
    pickedAt: isRefunded ? '' : pickedAt.toISOString(),
    refundedAt: isRefunded ? new Date(calledAt.getTime() + randomInt(5, 30) * 60000).toISOString() : undefined,
    amount: Math.round((randomInt(20, 500) + Math.random()) * 100) / 100,
    drugCount: randomInt(1, 8),
    patientCategory: Math.random() < 0.1 ? 'vip' : 'normal',
    waitTime,
    dispenseTime,
    timePeriod: getTimePeriodFromHour(hour),
    hour,
  };
}

function generateMockPrescriptions(days: number = 30): Prescription[] {
  const prescriptions: Prescription[] = [];
  const today = new Date();
  let id = 1;

  for (let d = 0; d < days; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const count = isWeekend ? randomInt(100, 180) : randomInt(180, 280);

    for (let i = 0; i < count; i++) {
      prescriptions.push(generatePrescription(id++, date));
    }
  }

  return prescriptions;
}

export const mockPrescriptions = generateMockPrescriptions(30);

export function calculateKPIData(prescriptions: Prescription[]): KPIData {
  const total = prescriptions.length;
  const emergency = prescriptions.filter((p) => p.type === 'emergency');
  const normal = prescriptions.filter((p) => p.type === 'normal');
  const specialist = prescriptions.filter((p) => p.type === 'specialist');
  const refunded = prescriptions.filter((p) => p.refundedAt);

  const avgWait = total > 0 ? prescriptions.reduce((s, p) => s + p.waitTime, 0) / total : 0;
  const avgDispense = total > 0 ? prescriptions.reduce((s, p) => s + p.dispenseTime, 0) / total : 0;

  const windowUtilization: Record<string, number> = {};
  windows.forEach((w) => {
    const count = prescriptions.filter((p) => p.windowId === w.id).length;
    windowUtilization[w.windowNo] = Math.min(100, Math.round((count / (w.capacity * 30)) * 100 * 10) / 10);
  });

  const hourCounts: Record<number, number> = {};
  prescriptions.forEach((p) => {
    hourCounts[p.hour] = (hourCounts[p.hour] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    ? parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0])
    : 9;

  return {
    totalPrescriptions: total,
    emergencyPrescriptions: emergency.length,
    normalPrescriptions: normal.length,
    specialistPrescriptions: specialist.length,
    avgWaitTime: Math.round(avgWait * 10) / 10,
    avgWaitTimeEmergency: emergency.length > 0 ? Math.round((emergency.reduce((s, p) => s + p.waitTime, 0) / emergency.length) * 10) / 10 : 0,
    avgWaitTimeNormal: normal.length > 0 ? Math.round((normal.reduce((s, p) => s + p.waitTime, 0) / normal.length) * 10) / 10 : 0,
    avgWaitTimeSpecialist: specialist.length > 0 ? Math.round((specialist.reduce((s, p) => s + p.waitTime, 0) / specialist.length) * 10) / 10 : 0,
    avgDispenseTime: Math.round(avgDispense * 10) / 10,
    refundRate: total > 0 ? refunded.length / total : 0,
    windowUtilization,
    peakHour,
  };
}

export function calculateWaitDistribution(prescriptions: Prescription[]): WaitDistributionItem[] {
  const ranges = [
    { min: 0, max: 10, label: '0-10分钟' },
    { min: 10, max: 20, label: '10-20分钟' },
    { min: 20, max: 30, label: '20-30分钟' },
    { min: 30, max: 45, label: '30-45分钟' },
    { min: 45, max: 60, label: '45-60分钟' },
    { min: 60, max: Infinity, label: '60分钟以上' },
  ];

  return ranges.map((r) => {
    const inRange = prescriptions.filter((p) => p.waitTime >= r.min && p.waitTime < r.max);
    const emergency = inRange.filter((p) => p.type === 'emergency');
    return {
      range: r.label,
      count: inRange.length,
      emergencyCount: emergency.length,
      normalCount: inRange.length - emergency.length,
    };
  });
}

export function calculateWindowCompare(prescriptions: Prescription[]): WindowCompareItem[] {
  return windows.map((w) => {
    const windowPrescriptions = prescriptions.filter((p) => p.windowId === w.id);
    const count = windowPrescriptions.length;
    return {
      windowNo: w.windowNo,
      totalPrescriptions: count,
      avgWaitTime: count > 0 ? Math.round((windowPrescriptions.reduce((s, p) => s + p.waitTime, 0) / count) * 10) / 10 : 0,
      avgDispenseTime: count > 0 ? Math.round((windowPrescriptions.reduce((s, p) => s + p.dispenseTime, 0) / count) * 10) / 10 : 0,
      utilization: Math.min(100, Math.round((count / (w.capacity * 30)) * 100 * 10) / 10),
    };
  });
}

export function calculateHourlyPrescriptions(prescriptions: Prescription[]): HourlyPrescriptionItem[] {
  return Array.from({ length: 17 }, (_, i) => i + 6).map((h) => {
    const hourPrescriptions = prescriptions.filter((p) => p.hour === h);
    return {
      hour: `${h}:00`,
      emergency: hourPrescriptions.filter((p) => p.type === 'emergency').length,
      normal: hourPrescriptions.filter((p) => p.type === 'normal').length,
      specialist: hourPrescriptions.filter((p) => p.type === 'specialist').length,
    };
  });
}

export function calculateSankeyData(prescriptions: Prescription[]): SankeyData {
  const total = prescriptions.length;
  const refundCount = prescriptions.filter((p) => p.refundedAt).length;
  const pickCount = total - refundCount;

  const avgPayDelay = total > 0
    ? prescriptions.reduce((s, p) => {
        const paid = new Date(p.paidAt).getTime();
        const created = new Date(p.createdAt).getTime();
        return s + (paid - created) / 60000;
      }, 0) / total
    : 0;

  const avgDispenseDelay = total > 0
    ? prescriptions.reduce((s, p) => {
        const dispensed = new Date(p.dispensedAt).getTime();
        const paid = new Date(p.paidAt).getTime();
        return s + (dispensed - paid) / 60000;
      }, 0) / total
    : 0;

  const avgCallDelay = total > 0
    ? prescriptions.reduce((s, p) => {
        const called = new Date(p.calledAt).getTime();
        const dispensed = new Date(p.dispensedAt).getTime();
        return s + (called - dispensed) / 60000;
      }, 0) / total
    : 0;

  const pickedPrescriptions = prescriptions.filter((p) => p.pickedAt && !p.refundedAt);
  const avgPickDelay = pickedPrescriptions.length > 0
    ? pickedPrescriptions.reduce((s, p) => {
        const picked = new Date(p.pickedAt!).getTime();
        const called = new Date(p.calledAt).getTime();
        return s + (picked - called) / 60000;
      }, 0) / pickedPrescriptions.length
    : 0;

  const refundedPrescriptions = prescriptions.filter((p) => p.refundedAt);
  const avgRefundDelay = refundedPrescriptions.length > 0
    ? refundedPrescriptions.reduce((s, p) => {
        const refunded = new Date(p.refundedAt!).getTime();
        const called = new Date(p.calledAt).getTime();
        return s + (refunded - called) / 60000;
      }, 0) / refundedPrescriptions.length
    : 0;

  return {
    nodes: [
      { name: '处方创建' },
      { name: '已缴费' },
      { name: '配药完成' },
      { name: '已叫号' },
      { name: '已取药' },
      { name: '已退药' },
    ],
    links: [
      { source: 0, target: 1, value: total, avgDuration: Math.round(avgPayDelay * 10) / 10 },
      { source: 1, target: 2, value: total, avgDuration: Math.round(avgDispenseDelay * 10) / 10 },
      { source: 2, target: 3, value: total, avgDuration: Math.round(avgCallDelay * 10) / 10 },
      { source: 3, target: 4, value: pickCount, avgDuration: Math.round(avgPickDelay * 10) / 10 },
      { source: 3, target: 5, value: refundCount, avgDuration: Math.round(avgRefundDelay * 10) / 10 },
    ],
  };
}
