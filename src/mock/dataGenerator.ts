import { addDays, addHours, setHours, setMinutes, format, eachDayOfInterval } from 'date-fns';
import type { Area, Reservation, Violation, ClosedDate, ExamPeriod, HeatmapCell, AreaUtilization, ViolationStats, DashboardStats } from '@/types';

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

export const CLOSED_DATES: ClosedDate[] = [
  { date: new Date(2026, 3, 5), reason: '清明节假期' },
  { date: new Date(2026, 4, 1), reason: '劳动节假期' },
  { date: new Date(2026, 4, 4), reason: '系统维护升级' },
];

export const EXAM_PERIODS: ExamPeriod[] = [
  {
    startDate: new Date(2026, 4, 15),
    endDate: new Date(2026, 4, 28),
    name: '春季学期期末考试',
    noShowThreshold: 3,
  },
];

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

export function generateReservations(count: number = 50000): Reservation[] {
  const reservations: Reservation[] = [];
  const days = eachDayOfInterval({ start: START_DATE, end: END_DATE });
  
  for (let i = 0; i < count; i++) {
    const day = randomChoice(days);
    const hour = randomInt(7, 20);
    const startTime = setMinutes(setHours(day, hour), randomInt(0, 59));
    const duration = randomInt(1, 4);
    const endTime = addHours(startTime, duration);
    const area = randomChoice(AREAS);
    
    const isClosed = CLOSED_DATES.some(cd => format(cd.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
    if (isClosed && Math.random() > 0.1) continue;
    
    const isExamWeek = EXAM_PERIODS.some(ep => 
      day >= ep.startDate && day <= ep.endDate
    );
    
    let status: Reservation['status'];
    const rand = Math.random();
    if (isExamWeek) {
      status = rand < 0.65 ? 'checked_in' : rand < 0.8 ? 'reserved' : rand < 0.92 ? 'no_show' : 'cancelled';
    } else {
      status = rand < 0.6 ? 'checked_in' : rand < 0.75 ? 'reserved' : rand < 0.9 ? 'no_show' : 'cancelled';
    }
    
    reservations.push({
      reservationId: `RES${String(i + 1).padStart(6, '0')}`,
      studentId: generateStudentId(),
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

export function generateViolations(reservations: Reservation[]): Violation[] {
  const violations: Violation[] = [];
  const noShowReservations = reservations.filter(r => r.status === 'no_show');
  const violationTypes: Violation['violationType'][] = ['no_show', 'late_checkin', 'early_leave', 'occupancy_timeout'];
  let idx = 0;
  
  for (const res of noShowReservations) {
    violations.push({
      violationId: `VIO${String(idx + 1).padStart(5, '0')}`,
      studentId: res.studentId,
      studentName: res.studentName,
      reservationId: res.reservationId,
      violationType: 'no_show',
      occurTime: res.startTime,
      status: randomChoice(['pending', 'processed', 'ignored']),
      remark: '',
    });
    idx++;
  }
  
  for (let i = 0; i < 500; i++) {
    const res = randomChoice(reservations);
    const vType = randomChoice(violationTypes.filter(t => t !== 'no_show'));
    violations.push({
      violationId: `VIO${String(idx + 1).padStart(5, '0')}`,
      studentId: res.studentId,
      studentName: res.studentName,
      reservationId: res.reservationId,
      violationType: vType,
      occurTime: res.startTime,
      status: randomChoice(['pending', 'processed', 'ignored']),
      remark: vType === 'late_checkin' ? '迟到超过30分钟' : '',
    });
    idx++;
  }
  
  return violations.sort((a, b) => b.occurTime.getTime() - a.occurTime.getTime());
}

const ALL_RESERVATIONS = generateReservations();
const ALL_VIOLATIONS = generateViolations(ALL_RESERVATIONS);

export { ALL_RESERVATIONS, ALL_VIOLATIONS };

export function generateHeatmapData(startDate: Date, endDate: Date, areaIds?: string[]): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const areas = areaIds && areaIds.length > 0 
    ? AREAS.filter(a => areaIds.includes(a.areaId))
    : AREAS;
  
  for (const day of days) {
    const dayStr = format(day, 'yyyy-MM-dd');
    const isClosed = CLOSED_DATES.some(cd => format(cd.date, 'yyyy-MM-dd') === dayStr);
    const isExamWeek = EXAM_PERIODS.some(ep => day >= ep.startDate && day <= ep.endDate);
    
    for (let hour = 7; hour <= 20; hour++) {
      let baseValue = 0.3;
      
      if (hour >= 9 && hour <= 11) baseValue += 0.2;
      if (hour >= 14 && hour <= 17) baseValue += 0.25;
      if (hour >= 19 && hour <= 20) baseValue += 0.15;
      
      if (isExamWeek) baseValue += 0.2;
      if (day.getDay() === 0 || day.getDay() === 6) baseValue -= 0.15;
      if (isClosed) baseValue = 0;
      
      const randomVariation = (Math.random() - 0.5) * 0.15;
      const value = Math.max(0, Math.min(1, baseValue + randomVariation));
      
      const totalSeats = areas.reduce((sum, a) => sum + a.totalSeats, 0);
      const sampleSize = Math.round(value * totalSeats * 0.8);
      
      cells.push({
        date: day,
        hour,
        value: isClosed ? 0 : value,
        sampleSize,
        isClosed,
        isExamWeek,
      });
    }
  }
  
  return cells;
}

export function generateAreaUtilization(startDate: Date, endDate: Date, floors?: number[]): AreaUtilization[] {
  const filteredAreas = floors && floors.length > 0
    ? AREAS.filter(a => floors.includes(a.floor))
    : AREAS;
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const isExamWeek = EXAM_PERIODS.some(ep => 
    days.some(d => d >= ep.startDate && d <= ep.endDate)
  );
  
  return filteredAreas.map(area => {
    const baseUtil = 0.4 + (area.floor / 10) + Math.random() * 0.2;
    const examBoost = isExamWeek ? 0.15 : 0;
    const utilization = Math.min(0.95, baseUtil + examBoost);
    
    const trend = days.map(d => {
      const dayVar = (d.getDay() === 0 || d.getDay() === 6) ? -0.1 : 0.05;
      return {
        date: d,
        value: Math.max(0.1, Math.min(0.98, utilization + dayVar + (Math.random() - 0.5) * 0.1)),
      };
    });
    
    return {
      areaId: area.areaId,
      areaName: area.areaName,
      floor: area.floor,
      totalSeats: area.totalSeats,
      utilization,
      totalReservations: Math.round(utilization * area.totalSeats * days.length * 0.6),
      peakHours: [9, 10, 14, 15, 16],
      trend,
    };
  });
}

export function generateViolationStats(startDate: Date, endDate: Date): ViolationStats[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const isExamWeek = (d: Date) => EXAM_PERIODS.some(ep => d >= ep.startDate && d <= ep.endDate);
  
  return days.map(day => {
    const baseRate = isExamWeek(day) ? 0.12 : 0.08;
    const weekend = day.getDay() === 0 || day.getDay() === 6 ? 0.02 : 0;
    const noShowRate = Math.min(0.25, baseRate + weekend + (Math.random() - 0.5) * 0.04);
    
    return {
      date: day,
      noShowRate,
      totalViolations: Math.round(noShowRate * 300),
      violationByType: {
        no_show: Math.round(noShowRate * 200),
        late_checkin: Math.round(noShowRate * 60),
        early_leave: Math.round(noShowRate * 30),
        occupancy_timeout: Math.round(noShowRate * 10),
      },
      sampleSize: randomInt(200, 500),
    };
  });
}

export function generateDashboardStats(): DashboardStats {
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(2026, 4, 25), -6 + i);
    return format(d, 'MM-dd');
  });
  
  return {
    todayEntries: 2847,
    todayReservations: 1923,
    checkInRate: 0.78,
    noShowRate: 0.09,
    weekTrend: weekDays.map((date, i) => ({
      date,
      entries: 2200 + i * 100 + randomInt(-100, 200),
      reservations: 1500 + i * 80 + randomInt(-80, 150),
    })),
    topAreas: AREAS.slice(0, 5).map(a => ({
      areaName: a.areaName,
      utilization: 0.6 + Math.random() * 0.3,
    })),
  };
}
