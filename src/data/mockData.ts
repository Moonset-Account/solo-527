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

const windows: Window[] = [
  { id: 'w1', windowNo: '01', windowName: '门诊1号窗口', area: 'outpatient', capacity: 200, isActive: true },
  { id: 'w2', windowNo: '02', windowName: '门诊2号窗口', area: 'outpatient', capacity: 200, isActive: true },
  { id: 'w3', windowNo: '03', windowName: '门诊3号窗口', area: 'outpatient', capacity: 200, isActive: true },
  { id: 'w4', windowNo: '04', windowName: '门诊4号窗口', area: 'outpatient', capacity: 150, isActive: true },
  { id: 'w5', windowNo: '05', windowName: '急诊专用窗口', area: 'emergency', capacity: 300, isActive: true },
  { id: 'w6', windowNo: '06', windowName: '住院药房窗口', area: 'inpatient', capacity: 100, isActive: true },
];

const pharmacists: Pharmacist[] = [
  { id: 'p1', name: '张药师', title: '主管药师', specialty: '西药', windowId: 'w1' },
  { id: 'p2', name: '李药师', title: '药师', specialty: '西药', windowId: 'w1' },
  { id: 'p3', name: '王药师', title: '主管药师', specialty: '中药', windowId: 'w2' },
  { id: 'p4', name: '赵药师', title: '药师', specialty: '西药', windowId: 'w2' },
  { id: 'p5', name: '刘药师', title: '副主任药师', specialty: '抗生素', windowId: 'w3' },
  { id: 'p6', name: '陈药师', title: '药师', specialty: '西药', windowId: 'w3' },
  { id: 'p7', name: '杨药师', title: '药师', specialty: '肿瘤用药', windowId: 'w4' },
  { id: 'p8', name: '黄药师', title: '主管药师', specialty: '急诊用药', windowId: 'w5' },
  { id: 'p9', name: '周药师', title: '药师', specialty: '急诊用药', windowId: 'w5' },
  { id: 'p10', name: '吴药师', title: '主管药师', specialty: '住院用药', windowId: 'w6' },
];

const departments: Department[] = [
  { id: 'd1', deptName: '急诊科', deptCategory: 'emergency', dailyPrescriptionAvg: 150 },
  { id: 'd2', deptName: '内科', deptCategory: 'outpatient', dailyPrescriptionAvg: 200 },
  { id: 'd3', deptName: '外科', deptCategory: 'outpatient', dailyPrescriptionAvg: 120 },
  { id: 'd4', deptName: '儿科', deptCategory: 'outpatient', dailyPrescriptionAvg: 180 },
  { id: 'd5', deptName: '妇产科', deptCategory: 'outpatient', dailyPrescriptionAvg: 90 },
  { id: 'd6', deptName: '肿瘤科', deptCategory: 'outpatient', dailyPrescriptionAvg: 60 },
  { id: 'd7', deptName: '心血管内科', deptCategory: 'outpatient', dailyPrescriptionAvg: 110 },
  { id: 'd8', deptName: '神经内科', deptCategory: 'outpatient', dailyPrescriptionAvg: 80 },
  { id: 'd9', deptName: '骨科', deptCategory: 'outpatient', dailyPrescriptionAvg: 70 },
  { id: 'd10', deptName: '住院部', deptCategory: 'inpatient', dailyPrescriptionAvg: 100 },
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
    window = windows.find((w) => w.area === 'emergency')!;
    pharmacist = pharmacists.find((p) => p.windowId === window.id)!;
  } else if (dept.deptCategory === 'inpatient') {
    type = 'specialist';
    window = windows.find((w) => w.area === 'inpatient')!;
    pharmacist = pharmacists.find((p) => p.windowId === window.id)!;
  } else {
    type = Math.random() < 0.2 ? 'specialist' : 'normal';
    const outpatientWindows = windows.filter((w) => w.area === 'outpatient');
    window = randomChoice(outpatientWindows);
    const windowPharmacists = pharmacists.filter((p) => p.windowId === window.id);
    pharmacist = randomChoice(windowPharmacists);
  }

  const payDelay = type === 'emergency' ? randomInt(1, 5) : randomInt(3, 15);
  const dispenseDelay = type === 'emergency' ? randomInt(2, 8) : randomInt(5, 25);
  const callDelay = type === 'emergency' ? randomInt(0, 2) : randomInt(1, 5);
  const pickDelay = type === 'emergency' ? randomInt(1, 5) : randomInt(2, 15);

  const paidAt = new Date(createdAt.getTime() + payDelay * 60000);
  const dispensedAt = new Date(paidAt.getTime() + dispenseDelay * 60000);
  const calledAt = new Date(dispensedAt.getTime() + callDelay * 60000);
  const pickedAt = new Date(calledAt.getTime() + pickDelay * 60000);

  const refundRate = 0.03;
  const refundedAt = Math.random() < refundRate 
    ? new Date(calledAt.getTime() + randomInt(1, 10) * 60000) 
    : undefined;

  const waitTime = Math.round((pickedAt.getTime() - createdAt.getTime()) / 60000);
  const dispenseTime = Math.round((dispensedAt.getTime() - paidAt.getTime()) / 60000);

  const patientCategories = ['医保', '自费', '离休', '公费'];

  return {
    id: `rx-${id.toString().padStart(6, '0')}`,
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
    pickedAt: pickedAt.toISOString(),
    refundedAt: refundedAt?.toISOString(),
    amount: Math.round(randomInt(20, 500) * 100) / 100,
    drugCount: randomInt(1, 8),
    patientCategory: randomChoice(patientCategories),
    waitTime,
    dispenseTime,
    timePeriod: getTimePeriodFromHour(hour),
    hour,
  };
}

function generatePrescriptions(days: number = 30): Prescription[] {
  const prescriptions: Prescription[] = [];
  const today = new Date();
  let id = 1;

  for (let d = 0; d < days; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const dailyCount = isWeekend ? randomInt(400, 600) : randomInt(600, 900);

    for (let i = 0; i < dailyCount; i++) {
      prescriptions.push(generatePrescription(id++, date));
    }
  }

  return prescriptions;
}

const mockPrescriptions = generatePrescriptions(30);

const mockRemarks: Remark[] = [
  {
    id: 'r1',
    targetType: 'window',
    targetValue: '03',
    content: '3号窗口配药设备于6月15日上午故障，导致等待时间延长',
    author: '运营改善组-李',
    createdAt: '2024-06-15T14:30:00.000Z',
    severity: 'warning',
  },
  {
    id: 'r2',
    targetType: 'period',
    targetValue: '2024-06-10 08:00-10:00',
    content: '周一早高峰，门诊量激增，建议增加临时窗口',
    author: '运营改善组-王',
    createdAt: '2024-06-10T11:00:00.000Z',
    severity: 'critical',
  },
  {
    id: 'r3',
    targetType: 'metric',
    targetValue: 'avgWaitTimeEmergency',
    content: '急诊等待时间连续3天超过30分钟，需分析原因',
    author: '药剂科主任',
    createdAt: '2024-06-12T09:00:00.000Z',
    severity: 'critical',
  },
];

function calculateKPIData(prescriptions: Prescription[]): KPIData {
  const total = prescriptions.length;
  const emergency = prescriptions.filter((p) => p.type === 'emergency');
  const normal = prescriptions.filter((p) => p.type === 'normal');
  const specialist = prescriptions.filter((p) => p.type === 'specialist');
  const refunded = prescriptions.filter((p) => p.refundedAt);

  const avgWait = (list: Prescription[]) =>
    list.length > 0 ? list.reduce((sum, p) => sum + p.waitTime, 0) / list.length : 0;

  const windowUtilization: Record<string, number> = {};
  windows.forEach((w) => {
    const count = prescriptions.filter((p) => p.windowId === w.id).length;
    windowUtilization[w.windowNo] = Math.min(100, (count / (w.capacity * 30)) * 100);
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
    avgWaitTime: avgWait(prescriptions),
    avgWaitTimeEmergency: avgWait(emergency),
    avgWaitTimeNormal: avgWait(normal),
    avgWaitTimeSpecialist: avgWait(specialist),
    avgDispenseTime: prescriptions.reduce((sum, p) => sum + p.dispenseTime, 0) / total,
    refundRate: refunded.length / total,
    windowUtilization,
    peakHour,
  };
}

function calculateWaitDistribution(prescriptions: Prescription[]): WaitDistributionItem[] {
  const ranges = [
    { min: 0, max: 10, label: '0-10分钟' },
    { min: 10, max: 20, label: '10-20分钟' },
    { min: 20, max: 30, label: '20-30分钟' },
    { min: 30, max: 45, label: '30-45分钟' },
    { min: 45, max: 60, label: '45-60分钟' },
    { min: 60, max: Infinity, label: '60分钟以上' },
  ];

  return ranges.map(({ min, max, label }) => ({
    range: label,
    count: prescriptions.filter((p) => p.waitTime >= min && p.waitTime < max).length,
    emergencyCount: prescriptions.filter(
      (p) => p.type === 'emergency' && p.waitTime >= min && p.waitTime < max
    ).length,
    normalCount: prescriptions.filter(
      (p) => p.type !== 'emergency' && p.waitTime >= min && p.waitTime < max
    ).length,
  }));
}

function calculateWindowCompare(prescriptions: Prescription[]): WindowCompareItem[] {
  return windows.map((w) => {
    const windowPrescriptions = prescriptions.filter((p) => p.windowId === w.id);
    const count = windowPrescriptions.length;
    const avgWait = count > 0 
      ? windowPrescriptions.reduce((sum, p) => sum + p.waitTime, 0) / count 
      : 0;
    const avgDispense = count > 0
      ? windowPrescriptions.reduce((sum, p) => sum + p.dispenseTime, 0) / count
      : 0;
    const utilization = Math.min(100, (count / (w.capacity * 30)) * 100);

    return {
      windowNo: w.windowNo,
      totalPrescriptions: count,
      avgWaitTime: Math.round(avgWait * 10) / 10,
      avgDispenseTime: Math.round(avgDispense * 10) / 10,
      utilization: Math.round(utilization * 10) / 10,
    };
  }).filter((w) => w.totalPrescriptions > 0);
}

function calculateHourlyPrescriptions(prescriptions: Prescription[]): HourlyPrescriptionItem[] {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);
  
  return hours.map((hour) => {
    const hourPrescriptions = prescriptions.filter((p) => p.hour === hour);
    return {
      hour: `${hour}:00`,
      emergency: hourPrescriptions.filter((p) => p.type === 'emergency').length,
      normal: hourPrescriptions.filter((p) => p.type === 'normal').length,
      specialist: hourPrescriptions.filter((p) => p.type === 'specialist').length,
    };
  });
}

function calculateSankeyData(prescriptions: Prescription[]): SankeyData {
  const avgDuration = (list: Prescription[], key: 'waitTime' | 'dispenseTime') =>
    list.length > 0 ? Math.round(list.reduce((sum, p) => sum + p[key], 0) / list.length) : 0;

  const nodes = [
    { name: '处方创建' },
    { name: '已缴费' },
    { name: '配药中' },
    { name: '已叫号' },
    { name: '已取药' },
    { name: '已退药' },
  ];

  const refundedCount = prescriptions.filter((p) => p.refundedAt).length;
  const pickedCount = prescriptions.length - refundedCount;

  const links = [
    { source: 0, target: 1, value: prescriptions.length, avgDuration: avgDuration(prescriptions, 'waitTime') },
    { source: 1, target: 2, value: prescriptions.length, avgDuration: avgDuration(prescriptions, 'dispenseTime') },
    { source: 2, target: 3, value: prescriptions.length, avgDuration: 3 },
    { source: 3, target: 4, value: pickedCount, avgDuration: 8 },
    { source: 3, target: 5, value: refundedCount, avgDuration: 5 },
  ];

  return { nodes, links };
}

export {
  windows,
  pharmacists,
  departments,
  mockPrescriptions,
  mockRemarks,
  calculateKPIData,
  calculateWaitDistribution,
  calculateWindowCompare,
  calculateHourlyPrescriptions,
  calculateSankeyData,
};
