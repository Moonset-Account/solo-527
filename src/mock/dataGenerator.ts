import { addDays, addHours, setHours, setMinutes, format, eachDayOfInterval, isSameDay } from 'date-fns';
import type {
  Area,
  Reservation,
  Violation,
  ClosedDate,
  ExamPeriod,
  HeatmapCell,
  AreaUtilization,
  ViolationStats,
  DashboardStats,
  GateEntry,
  SeatCheckin,
} from '@/types';

export const AREAS: Area[] = [
  { areaId: 'A1', areaName: '一楼自习区A', floor: 1, totalSeats: 80, description: '开放式自习区' },
  { areaId: 'A2', areaName: '一楼自习区B', floor: 1, totalSeats: 60, description: '安静自习区' },
  { areaId: 'B1', areaName: '二楼研讨区', floor: 2, totalSeats: 40, description: '小组研讨区' },
  { areaId: 'B2', areaName: '二楼电子阅览区', floor: 2, totalSeats: 50, description: '配备电脑' },
  { areaId: 'C1', areaName: '三楼社科区', floor: 3, totalSeats: 100, description: '社科类书籍旁' },
  { areaId: 'C2', areaName: '三楼文学区', floor: 3, totalSeats: 70, description: '文学类书籍旁' },
  { areaId: 'D1', areaName: '四楼科技区', floor: 4, totalSeats: 90, description: '科技类书籍旁' },
  { areaId: 'D2', areaName: '四楼外文区', floor: 4, totalSeats: 50, description: '外文书籍旁' },
  { areaId: 'E1', areaName: '五楼古籍区', floor: 5, totalSeats: 30, description: '古籍阅览区' },
  { areaId: 'E2', areaName: '五楼多媒体室', floor: 5, totalSeats: 40, description: '多媒体学习' },
];

const DEFAULT_CLOSED_DATES: ClosedDate[] = [
  { date: new Date(2026, 3, 5), reason: '清明节假期' },
  { date: new Date(2026, 4, 1), reason: '劳动节假期' },
  { date: new Date(2026, 4, 4), reason: '系统维护升级' },
];

const DEFAULT_EXAM_PERIODS: ExamPeriod[] = [
  {
    startDate: new Date(2026, 4, 15),
    endDate: new Date(2026, 4, 28),
    name: '春季学期期末考试',
    noShowThreshold: 3,
  },
];

export const CLOSED_DATES = DEFAULT_CLOSED_DATES;
export const EXAM_PERIODS = DEFAULT_EXAM_PERIODS;

const START_DATE = new Date(2026, 2, 1);
const END_DATE = new Date(2026, 4, 31);

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStudentId(): string {
  const year = randomChoice(['2021', '2022', '2023', '2024', '2025']);
  const dept = randomChoice(['01', '02', '03', '04', '05', '06']);
  const num = String(randomInt(1, 500)).padStart(4, '0');
  return `${year}${dept}${num}`;
}

function generateStudentName(): string {
  const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高'];
  const names = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平'];
  return randomChoice(surnames) + randomChoice(names) + (Math.random() > 0.5 ? randomChoice(names) : '');
}

function isDateInExamPeriod(date: Date, examPeriods: ExamPeriod[]): boolean {
  return examPeriods.some(ep => date >= ep.startDate && date <= ep.endDate);
}

function isDateClosed(date: Date, closedDates: ClosedDate[]): boolean {
  return closedDates.some(cd => isSameDay(cd.date, date));
}

function getNoShowThresholdForDate(date: Date, examPeriods: ExamPeriod[], normalThreshold: number): number {
  const examPeriod = examPeriods.find(ep => date >= ep.startDate && date <= ep.endDate);
  return examPeriod ? examPeriod.noShowThreshold : normalThreshold;
}

export function generateReservations(
  count: number = 50000,
  closedDates: ClosedDate[] = DEFAULT_CLOSED_DATES,
  examPeriods: ExamPeriod[] = DEFAULT_EXAM_PERIODS,
  normalThreshold: number = 3
): Reservation[] {
  const reservations: Reservation[] = [];
  const days = eachDayOfInterval({ start: START_DATE, end: END_DATE });
  const studentViolationCounts: Record<string, number> = {};
  
  for (let i = 0; i < count; i++) {
    const day = randomChoice(days);
    const hour = randomInt(7, 20);
    const startTime = setMinutes(setHours(day, hour), randomInt(0, 59));
    const duration = randomInt(1, 4);
    const endTime = addHours(startTime, duration);
    const area = randomChoice(AREAS);
    const studentId = generateStudentId();
    
    if (isDateClosed(day, closedDates) && Math.random() > 0.1) continue;
    
    const isExamWeek = isDateInExamPeriod(day, examPeriods);
    const threshold = getNoShowThresholdForDate(day, examPeriods, normalThreshold);
    const currentViolations = studentViolationCounts[studentId] || 0;
    const isBlocked = currentViolations >= threshold;
    
    let status: Reservation['status'];
    const rand = Math.random();
    
    if (isBlocked) {
      status = rand < 0.3 ? 'reserved' : 'cancelled';
    } else if (isExamWeek) {
      status = rand < 0.65 ? 'checked_in' : rand < 0.8 ? 'reserved' : rand < 0.92 ? 'no_show' : 'cancelled';
    } else {
      status = rand < 0.6 ? 'checked_in' : rand < 0.75 ? 'reserved' : rand < 0.9 ? 'no_show' : 'cancelled';
    }
    
    if (status === 'no_show') {
      studentViolationCounts[studentId] = (studentViolationCounts[studentId] || 0) + 1;
    }
    
    reservations.push({
      reservationId: `RES${String(i + 1).padStart(6, '0')}`,
      studentId,
      studentName: generateStudentName(),
      areaId: area.areaId,
      seatId: `${area.areaId}-${String(randomInt(1, area.totalSeats)).padStart(3, '0')}`,
      startTime,
      endTime,
      status,
      createdAt: addDays(startTime, -randomInt(0, 3)),
    });
  }
  
  return reservations.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

export function generateGateEntries(reservations: Reservation[], count: number = 80000): GateEntry[] {
  const entries: GateEntry[] = [];
  const checkedInStudents = reservations
    .filter(r => r.status === 'checked_in')
    .map(r => ({ studentId: r.studentId, time: r.startTime }));
  
  for (let i = 0; i < count; i++) {
    const base = randomChoice(checkedInStudents);
    const entryTime = base ? new Date(base.time.getTime() - randomInt(0, 30) * 60000) : new Date();
    entries.push({
      entryId: `GATE${String(i + 1).padStart(6, '0')}`,
      studentId: base?.studentId || generateStudentId(),
      entryTime,
      gateId: `G${randomInt(1, 4)}`,
    });
  }
  
  return entries.sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime());
}

export function generateSeatCheckins(reservations: Reservation[]): SeatCheckin[] {
  const checkins: SeatCheckin[] = [];
  const checkedInReservations = reservations.filter(r => r.status === 'checked_in');
  
  checkedInReservations.forEach((r, i) => {
    const lateMinutes = randomInt(0, 45);
    const isLate = lateMinutes > 30;
    checkins.push({
      checkinId: `CHK${String(i + 1).padStart(6, '0')}`,
      reservationId: r.reservationId,
      studentId: r.studentId,
      checkinTime: new Date(r.startTime.getTime() + lateMinutes * 60000),
      source: Math.random() > 0.3 ? 'seat' : 'gate',
    });
  });
  
  return checkins.sort((a, b) => b.checkinTime.getTime() - a.checkinTime.getTime());
}

export function generateViolations(
  reservations: Reservation[],
  seatCheckins: SeatCheckin[],
  examPeriods: ExamPeriod[] = DEFAULT_EXAM_PERIODS,
  normalThreshold: number = 3
): Violation[] {
  const violations: Violation[] = [];
  let idx = 0;
  
  const noShowReservations = reservations.filter(r => r.status === 'no_show');
  for (const res of noShowReservations) {
    const threshold = getNoShowThresholdForDate(res.startTime, examPeriods, normalThreshold);
    const studentNoShows = noShowReservations.filter(
      r => r.studentId === res.studentId && isDateInExamPeriod(res.startTime, examPeriods) === isDateInExamPeriod(r.startTime, examPeriods)
    ).length;
    
    const isExceeded = studentNoShows > threshold;
    
    violations.push({
      violationId: `VIO${String(idx + 1).padStart(5, '0')}`,
      studentId: res.studentId,
      studentName: res.studentName,
      reservationId: res.reservationId,
      violationType: 'no_show',
      occurTime: res.startTime,
      status: isExceeded ? (Math.random() > 0.3 ? 'processed' : 'pending') : 'ignored',
      remark: isExceeded ? `爽约${studentNoShows}次，超过阈值${threshold}次` : '在阈值范围内，自动忽略',
    });
    idx++;
  }
  
  const lateCheckins = seatCheckins.filter(c => {
    const res = reservations.find(r => r.reservationId === c.reservationId);
    if (!res) return false;
    const diffMinutes = (c.checkinTime.getTime() - res.startTime.getTime()) / 60000;
    return diffMinutes > 30;
  });
  
  for (const checkin of lateCheckins) {
    const res = reservations.find(r => r.reservationId === checkin.reservationId);
    if (!res) continue;
    
    const diffMinutes = (checkin.checkinTime.getTime() - res.startTime.getTime()) / 60000;
    violations.push({
      violationId: `VIO${String(idx + 1).padStart(5, '0')}`,
      studentId: checkin.studentId,
      studentName: res.studentName,
      reservationId: checkin.reservationId,
      violationType: 'late_checkin',
      occurTime: checkin.checkinTime,
      status: Math.random() > 0.5 ? 'processed' : 'pending',
      remark: `签到迟到${Math.round(diffMinutes)}分钟`,
    });
    idx++;
  }
  
  for (let i = 0; i < 300; i++) {
    const res = randomChoice(reservations.filter(r => r.status === 'checked_in'));
    const vType = randomChoice(['early_leave', 'occupancy_timeout']);
    violations.push({
      violationId: `VIO${String(idx + 1).padStart(5, '0')}`,
      studentId: res.studentId,
      studentName: res.studentName,
      reservationId: res.reservationId,
      violationType: vType as any,
      occurTime: res.endTime,
      status: randomChoice(['pending', 'processed', 'ignored']),
      remark: vType === 'early_leave' ? '提前离开超过15分钟' : '超时占用超过30分钟',
    });
    idx++;
  }
  
  return violations.sort((a, b) => b.occurTime.getTime() - a.occurTime.getTime());
}

const NORMAL_THRESHOLD = 3;
const ALL_RESERVATIONS = generateReservations();
const ALL_GATE_ENTRIES = generateGateEntries(ALL_RESERVATIONS);
const ALL_SEAT_CHECKINS = generateSeatCheckins(ALL_RESERVATIONS);
const ALL_VIOLATIONS = generateViolations(ALL_RESERVATIONS, ALL_SEAT_CHECKINS);

export { ALL_RESERVATIONS, ALL_GATE_ENTRIES, ALL_SEAT_CHECKINS, ALL_VIOLATIONS, NORMAL_THRESHOLD };

interface AggregationConfig {
  closedDates: ClosedDate[];
  examPeriods: ExamPeriod[];
  normalThreshold: number;
}

function filterReservations(
  reservations: Reservation[],
  startDate: Date,
  endDate: Date,
  areaIds?: string[],
  floors?: number[]
): Reservation[] {
  return reservations.filter(r => {
    const inDateRange = r.startTime >= startDate && r.startTime <= endDate;
    if (!inDateRange) return false;
    
    if (areaIds && areaIds.length > 0 && !areaIds.includes(r.areaId)) return false;
    
    if (floors && floors.length > 0) {
      const area = AREAS.find(a => a.areaId === r.areaId);
      if (!area || !floors.includes(area.floor)) return false;
    }
    
    return true;
  });
}

function filterViolationsWithArea(
  violations: Violation[],
  reservations: Reservation[],
  startDate: Date,
  endDate: Date,
  areaIds?: string[],
  floors?: number[]
): Violation[] {
  return violations.filter(v => {
    const inDateRange = v.occurTime >= startDate && v.occurTime <= endDate;
    if (!inDateRange) return false;
    
    if ((areaIds && areaIds.length > 0) || (floors && floors.length > 0)) {
      const res = reservations.find(r => r.reservationId === v.reservationId);
      if (!res) return false;
      
      if (areaIds && areaIds.length > 0 && !areaIds.includes(res.areaId)) return false;
      
      if (floors && floors.length > 0) {
        const area = AREAS.find(a => a.areaId === res.areaId);
        if (!area || !floors.includes(area.floor)) return false;
      }
    }
    
    return true;
  });
}

export function calculateHeatmapData(
  reservations: Reservation[],
  startDate: Date,
  endDate: Date,
  config: AggregationConfig,
  areaIds?: string[],
  floors?: number[]
): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const filteredAreas = areaIds && areaIds.length > 0 
    ? AREAS.filter(a => areaIds.includes(a.areaId))
    : AREAS;
  const finalAreas = floors && floors.length > 0
    ? filteredAreas.filter(a => floors.includes(a.floor))
    : filteredAreas;
  
  const filteredReservations = filterReservations(reservations, startDate, endDate, areaIds, floors);
  const totalSeats = finalAreas.reduce((sum, a) => sum + a.totalSeats, 0);
  
  for (const day of days) {
    const isClosed = isDateClosed(day, config.closedDates);
    const isExamWeek = isDateInExamPeriod(day, config.examPeriods);
    
    for (let hour = 7; hour <= 20; hour++) {
      const hourReservations = filteredReservations.filter(r => 
        isSameDay(r.startTime, day) && r.startTime.getHours() === hour
      );
      
      const checkedInCount = hourReservations.filter(r => r.status === 'checked_in').length;
      const utilization = totalSeats > 0 ? Math.min(1, checkedInCount / totalSeats) : 0;
      
      cells.push({
        date: day,
        hour,
        value: isClosed ? 0 : utilization,
        sampleSize: hourReservations.length,
        isClosed,
        isExamWeek,
      });
    }
  }
  
  return cells;
}

export function calculateAreaUtilization(
  reservations: Reservation[],
  startDate: Date,
  endDate: Date,
  config: AggregationConfig,
  areaIds?: string[],
  floors?: number[]
): AreaUtilization[] {
  let filteredAreas = areaIds && areaIds.length > 0
    ? AREAS.filter(a => areaIds.includes(a.areaId))
    : AREAS;
  filteredAreas = floors && floors.length > 0
    ? filteredAreas.filter(a => floors.includes(a.floor))
    : filteredAreas;
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const filteredReservations = filterReservations(reservations, startDate, endDate, areaIds, floors);
  
  return filteredAreas.map(area => {
    const areaReservations = filteredReservations.filter(r => r.areaId === area.areaId);
    const checkedInCount = areaReservations.filter(r => r.status === 'checked_in').length;
    const maxPossible = area.totalSeats * days.length * 10;
    const utilization = maxPossible > 0 ? Math.min(0.95, checkedInCount / (area.totalSeats * days.length * 0.8)) : 0;
    
    const trend = days.map(d => {
      const dayRes = areaReservations.filter(r => isSameDay(r.startTime, d));
      const dayCheckedIn = dayRes.filter(r => r.status === 'checked_in').length;
      const dayUtil = area.totalSeats > 0 ? Math.min(0.98, dayCheckedIn / (area.totalSeats * 0.6)) : 0;
      return {
        date: d,
        value: Math.max(0.05, dayUtil),
      };
    });
    
    const hourCounts: Record<number, number> = {};
    for (let h = 7; h <= 20; h++) hourCounts[h] = 0;
    areaReservations.forEach(r => {
      const h = r.startTime.getHours();
      if (h >= 7 && h <= 20) hourCounts[h]++;
    });
    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([h]) => parseInt(h));
    
    return {
      areaId: area.areaId,
      areaName: area.areaName,
      floor: area.floor,
      totalSeats: area.totalSeats,
      utilization,
      totalReservations: areaReservations.length,
      peakHours: peakHours.sort((a, b) => a - b),
      trend,
    };
  });
}

export function calculateViolationStats(
  reservations: Reservation[],
  violations: Violation[],
  startDate: Date,
  endDate: Date,
  config: AggregationConfig,
  areaIds?: string[],
  floors?: number[]
): ViolationStats[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const filteredReservations = filterReservations(reservations, startDate, endDate, areaIds, floors);
  const filteredViolations = filterViolationsWithArea(violations, reservations, startDate, endDate, areaIds, floors);
  
  return days.map(day => {
    const dayReservations = filteredReservations.filter(r => isSameDay(r.startTime, day));
    const dayViolations = filteredViolations.filter(v => isSameDay(v.occurTime, day));
    
    const threshold = getNoShowThresholdForDate(day, config.examPeriods, config.normalThreshold);
    const totalReservations = dayReservations.length;
    
    const studentNoShowCounts: Record<string, number> = {};
    dayReservations.filter(r => r.status === 'no_show').forEach(r => {
      studentNoShowCounts[r.studentId] = (studentNoShowCounts[r.studentId] || 0) + 1;
    });
    
    const noShowCount = Object.entries(studentNoShowCounts).filter(
      ([_, count]) => count > 0
    ).length;
    
    const noShowRate = totalReservations > 0 ? noShowCount / totalReservations : 0;
    
    const violationByType: Record<string, number> = {
      no_show: 0,
      late_checkin: 0,
      early_leave: 0,
      occupancy_timeout: 0,
    };
    
    dayViolations.forEach(v => {
      violationByType[v.violationType] = (violationByType[v.violationType] || 0) + 1;
    });
    
    return {
      date: day,
      noShowRate,
      totalViolations: dayViolations.length,
      violationByType,
      sampleSize: totalReservations,
      threshold,
    };
  });
}

export function calculateDashboardStats(
  reservations: Reservation[],
  violations: Violation[],
  gateEntries: GateEntry[],
  startDate: Date,
  endDate: Date,
  config: AggregationConfig,
  areaIds?: string[],
  floors?: number[]
): DashboardStats {
  const filteredReservations = filterReservations(reservations, startDate, endDate, areaIds, floors);
  const filteredViolations = filterViolationsWithArea(violations, reservations, startDate, endDate, areaIds, floors);
  const filteredGateEntries = gateEntries.filter(g => g.entryTime >= startDate && g.entryTime <= endDate);
  
  const today = endDate;
  const todayReservations = filteredReservations.filter(r => isSameDay(r.startTime, today));
  const todayEntries = filteredGateEntries.filter(g => isSameDay(g.entryTime, today)).length;
  const todayRes = todayReservations.length;
  
  const totalReservations = filteredReservations.length;
  const checkedInCount = filteredReservations.filter(r => r.status === 'checked_in').length;
  
  const studentNoShowCounts: Record<string, number> = {};
  filteredReservations.filter(r => r.status === 'no_show').forEach(r => {
    studentNoShowCounts[r.studentId] = (studentNoShowCounts[r.studentId] || 0) + 1;
  });
  const noShowCount = Object.keys(studentNoShowCounts).length;
  
  const checkInRate = totalReservations > 0 ? checkedInCount / totalReservations : 0;
  const noShowRate = totalReservations > 0 ? noShowCount / totalReservations : 0;
  
  const weekDays = eachDayOfInterval({ start: addDays(endDate, -6), end: endDate });
  const weekTrend = weekDays.map(d => {
    const dayRes = filteredReservations.filter(r => isSameDay(r.startTime, d));
    const dayEntries = filteredGateEntries.filter(g => isSameDay(g.entryTime, d)).length;
    return {
      date: format(d, 'MM-dd'),
      entries: dayEntries,
      reservations: dayRes.length,
    };
  });
  
  const areaStats = AREAS.map(area => {
    if (areaIds && areaIds.length > 0 && !areaIds.includes(area.areaId)) return null;
    if (floors && floors.length > 0 && !floors.includes(area.floor)) return null;
    
    const areaRes = filteredReservations.filter(r => r.areaId === area.areaId);
    const areaCheckedIn = areaRes.filter(r => r.status === 'checked_in').length;
    const utilization = area.totalSeats > 0 ? Math.min(0.95, areaCheckedIn / (area.totalSeats * weekDays.length * 0.5)) : 0;
    return { areaName: area.areaName, utilization };
  }).filter(Boolean) as { areaName: string; utilization: number }[];
  
  return {
    todayEntries,
    todayReservations: todayRes,
    checkInRate,
    noShowRate,
    weekTrend,
    topAreas: areaStats.sort((a, b) => b.utilization - a.utilization).slice(0, 5),
  };
}
