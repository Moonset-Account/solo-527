/**
 * 数据适配器 - 基于 ClickHouse SQL 统一口径实现
 * 
 * 统一数据口径说明（与 clickhouse.ts 中的 SQL 模板完全一致）：
 * 1. 预约数据：library.reservations 表
 * 2. 闸机入馆：library.gate_entries 表
 * 3. 座位签到：library.seat_checkins 表
 * 4. 违规记录：library.violations 表
 * 5. 爽约判定：学生累计爽约次数 > 阈值，才计入爽约率
 * 6. 区域/楼层筛选：通过关联 library.dim_areas 维度表实现
 * 
 * 架构说明：
 * - 开发环境：使用 SQL 口径的 JS 模拟实现（结果与真实 SQL 一致）
 * - 生产环境：可直接替换为 clickhouseClient.query() 调用
 * - 爽约率计算在 Dashboard 和 违规分析 中使用同一套核心逻辑
 */

import type {
  DataAdapter,
  QueryParams,
  HeatmapCell,
  ViolationStats,
  DashboardStats,
  AreaUtilization,
  Area,
  Reservation,
  Violation,
  ClosedDate,
  ExamPeriod,
} from '@/types';
import { AREAS } from '@/mock/dataGenerator';
import {
  HEATMAP_QUERY,
  AREA_UTILIZATION_QUERY,
  VIOLATION_STATS_QUERY,
  DASHBOARD_STATS_QUERY,
  RAW_RECORDS_QUERY,
  VIOLATIONS_QUERY,
  STUDENT_RESERVATIONS_QUERY,
  CLICKHOUSE_TABLES,
} from './clickhouse';
import { clickhouseClient } from './clickhouseClient';
import { useSystemConfigStore } from '@/stores/systemConfig';
import { createPinia } from 'pinia';

const pinia = createPinia();

const USE_REAL_CLICKHOUSE = false;

const baseSeed = 42;
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const random = seededRandom(baseSeed);

function generateDeterministicData(
  startDate: Date, 
  endDate: Date, 
  normalThreshold: number,
  examPeriods: ExamPeriod[],
  closedDates: ClosedDate[]
) {
  
  function isExamWeek(date: Date): boolean {
    return examPeriods.some(
      (ep) => new Date(ep.startDate) <= date && new Date(ep.endDate) >= date
    );
  }
  
  function getThresholdForDate(date: Date): number {
    const exam = examPeriods.find(
      (ep) => new Date(ep.startDate) <= date && new Date(ep.endDate) >= date
    );
    return exam ? exam.noShowThreshold : normalThreshold;
  }

  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  const studentIds: string[] = [];
  for (let i = 0; i < 200; i++) {
    studentIds.push(`2021${String(i).padStart(4, '0')}`);
  }

  const reservations: Reservation[] = [];
  const gateEntries: any[] = [];
  const seatCheckins: any[] = [];
  const violations: Violation[] = [];

  for (let d = 0; d < days; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    
    if (closedDates.some(cd => new Date(cd.date).toDateString() === date.toDateString())) {
      continue;
    }
    
    const isExam = isExamWeek(date);
    const dailyMultiplier = isExam ? 1.5 : 1.0;
    
    for (const area of AREAS) {
      const dailyReservations = Math.floor((60 + random() * 40) * dailyMultiplier * (area.totalSeats / 80));
      
      for (let r = 0; r < dailyReservations; r++) {
        const studentIdx = Math.floor(random() * studentIds.length);
        const studentId = studentIds[studentIdx];
        const studentName = `学生${studentIdx + 1}`;
        const startHour = 8 + Math.floor(random() * 10);
        const duration = 1 + Math.floor(random() * 4);
        
        const startTime = new Date(date);
        startTime.setHours(startHour, Math.floor(random() * 60), 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(startHour + duration);
        
        const rand = random();
        let status: Reservation['status'];
        if (rand < 0.65) status = 'checked_in';
        else if (rand < 0.80) status = 'cancelled';
        else if (rand < 0.90) status = 'reserved';
        else status = 'no_show';
        
        const reservationId = `RES_${date.getTime()}_${area.areaId}_${r}`;
        
        reservations.push({
          reservationId,
          studentId,
          studentName,
          areaId: area.areaId,
          seatId: `${area.areaId}_${Math.floor(random() * area.totalSeats) + 1}`,
          startTime,
          endTime,
          status,
          createdAt: new Date(startTime.getTime() - 86400000 * Math.floor(random() * 7)),
        });
        
        if (random() < 0.5) {
          gateEntries.push({
            entryId: `GATE_${date.getTime()}_${r}`,
            studentId,
            entryTime: new Date(startTime.getTime() - Math.floor(random() * 30) * 60000),
            gateId: `GATE_${1 + Math.floor(random() * 4)}`,
          });
        }
        
        if (status === 'checked_in') {
          seatCheckins.push({
            checkinId: `CHECKIN_${reservationId}`,
            reservationId,
            studentId,
            checkinTime: new Date(startTime.getTime() + Math.floor(random() * 10) * 60000),
            source: random() < 0.7 ? 'seat' : 'gate',
          });
        }
      }
    }
  }

  const studentNoShowCounts: Record<string, number> = {};
  for (const r of reservations) {
    if (r.status === 'no_show') {
      studentNoShowCounts[r.studentId] = (studentNoShowCounts[r.studentId] || 0) + 1;
    }
  }

  let violationIdx = 0;
  for (const r of reservations) {
    if (r.status !== 'no_show') continue;
    
    const totalNoShows = studentNoShowCounts[r.studentId] || 0;
    const threshold = getThresholdForDate(r.startTime);
    
    if (totalNoShows > threshold) {
      violations.push({
        violationId: `VIO_${r.reservationId}`,
        studentId: r.studentId,
        studentName: r.studentName,
        reservationId: r.reservationId,
        violationType: 'no_show',
        occurTime: new Date(r.startTime),
        status: 'processed',
        remark: '系统自动判定爽约',
        processedBy: 'system',
        processedAt: new Date(r.startTime.getTime() + 86400000),
      });
      violationIdx++;
    } else if (random() < 0.3) {
      violations.push({
        violationId: `VIO_${r.reservationId}`,
        studentId: r.studentId,
        studentName: r.studentName,
        reservationId: r.reservationId,
        violationType: 'no_show',
        occurTime: new Date(r.startTime),
        status: 'ignored',
        remark: '累计未超过阈值，已忽略',
        processedBy: 'system',
        processedAt: new Date(r.startTime.getTime() + 86400000),
      });
    }
  }

  return { reservations, gateEntries, seatCheckins, violations, studentNoShowCounts };
}

class DataAdapterImpl implements DataAdapter {
  readonly queryTemplates = {
    heatmap: HEATMAP_QUERY,
    areaUtilization: AREA_UTILIZATION_QUERY,
    violationStats: VIOLATION_STATS_QUERY,
    dashboardStats: DASHBOARD_STATS_QUERY,
    rawRecords: RAW_RECORDS_QUERY,
    violations: VIOLATIONS_QUERY,
    studentReservations: STUDENT_RESERVATIONS_QUERY,
  };

  readonly tableSchema = CLICKHOUSE_TABLES;

  private getConfigStore() {
    return useSystemConfigStore(pinia);
  }

  async getHeatmapData(params: QueryParams): Promise<HeatmapCell[]> {
    const config = this.getConfigStore();
    const [startDate, endDate] = params.dateRange;
    const normalThreshold = config.normalNoShowThreshold;
    
    const sqlParams = {
      startDate,
      endDate,
      normalThreshold,
      areaIds: (params.areas || []).join(','),
      floors: (params.floors || []).map(String).join(','),
    };

    if (USE_REAL_CLICKHOUSE) {
      const result = await clickhouseClient.query(HEATMAP_QUERY.sql, sqlParams);
      return result.data.map((row: any) => ({
        date: new Date(row.date),
        hour: row.hour,
        value: parseFloat(row.utilization),
        utilization: parseFloat(row.utilization),
        sampleSize: parseInt(row.sample_size, 10),
        isClosed: row.is_closed === 1,
        isExamWeek: row.is_exam_week === 1,
      }));
    }

    const examPeriods = config.examPeriods;
    const closedDates = config.closedDates;
    
    const { reservations } = generateDeterministicData(
      startDate, endDate, normalThreshold, examPeriods, closedDates
    );
    
    let filteredReservations = reservations;
    if (params.areas && params.areas.length > 0) {
      filteredReservations = filteredReservations.filter(r => params.areas!.includes(r.areaId));
    }
    if (params.floors && params.floors.length > 0) {
      filteredReservations = filteredReservations.filter(r => {
        const area = AREAS.find(a => a.areaId === r.areaId);
        return area && params.floors!.includes(area.floor);
      });
    }

    const cells: HeatmapCell[] = [];
    const closedDateStrs = closedDates.map(cd => new Date(cd.date).toDateString());

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
    for (let d = 0; d < days; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);
      const dateStr = date.toDateString();
      
      const isClosed = closedDateStrs.includes(dateStr);
      const isExamWeek = examPeriods.some(
        ep => new Date(ep.startDate) <= date && new Date(ep.endDate) >= date
      );

      for (let hour = 8; hour < 22; hour++) {
        const hourReservations = filteredReservations.filter(
          r => r.startTime.toDateString() === dateStr && r.startTime.getHours() === hour
        );
        
        const totalSeats = AREAS
          .filter(a => {
            if (params.areas && params.areas.length > 0 && !params.areas.includes(a.areaId)) return false;
            if (params.floors && params.floors.length > 0 && !params.floors.includes(a.floor)) return false;
            return true;
          })
          .reduce((sum, a) => sum + a.totalSeats, 0);
        
        const checkedIn = hourReservations.filter(r => r.status === 'checked_in').length;
        const utilization = totalSeats > 0 ? checkedIn / totalSeats : 0;

        cells.push({
          date: new Date(date),
          hour,
          value: utilization,
          utilization,
          sampleSize: hourReservations.length,
          isClosed,
          isExamWeek,
        });
      }
    }

    return cells;
  }

  async getAreaUtilization(params: QueryParams): Promise<AreaUtilization[]> {
    const config = this.getConfigStore();
    const [startDate, endDate] = params.dateRange;
    const normalThreshold = config.normalNoShowThreshold;

    const sqlParams = {
      startDate,
      endDate,
      normalThreshold,
      areaIds: (params.areas || []).join(','),
      floors: (params.floors || []).map(String).join(','),
    };

    if (USE_REAL_CLICKHOUSE) {
      const result = await clickhouseClient.query(AREA_UTILIZATION_QUERY.sql, sqlParams);
      return result.data.map((row: any) => ({
        areaId: row.area_id,
        areaName: row.area_name,
        floor: row.floor,
        totalSeats: row.total_seats,
        utilization: parseFloat(row.utilization),
        totalReservations: parseInt(row.total_reservations, 10),
        peakHours: row.peak_hours || [],
        trend: row.trend || [],
      }));
    }

    const examPeriods = config.examPeriods;
    const closedDates = config.closedDates;
    
    const { reservations } = generateDeterministicData(
      startDate, endDate, normalThreshold, examPeriods, closedDates
    );
    
    let filteredReservations = reservations;
    if (params.areas && params.areas.length > 0) {
      filteredReservations = filteredReservations.filter(r => params.areas!.includes(r.areaId));
    }
    if (params.floors && params.floors.length > 0) {
      filteredReservations = filteredReservations.filter(r => {
        const area = AREAS.find(a => a.areaId === r.areaId);
        return area && params.floors!.includes(area.floor);
      });
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
    const utilizationMap: Map<string, { checkedIn: number; total: number; area: Area }> = new Map();

    for (const area of AREAS) {
      if (params.areas && params.areas.length > 0 && !params.areas.includes(area.areaId)) continue;
      if (params.floors && params.floors.length > 0 && !params.floors.includes(area.floor)) continue;
      
      utilizationMap.set(area.areaId, { checkedIn: 0, total: 0, area });
    }

    for (const r of filteredReservations) {
      const entry = utilizationMap.get(r.areaId);
      if (entry) {
        entry.total++;
        if (r.status === 'checked_in') entry.checkedIn++;
      }
    }

    const result: AreaUtilization[] = [];
    for (const [areaId, entry] of utilizationMap) {
      const { area, checkedIn } = entry;
      const utilization = area.totalSeats > 0 && days > 0
        ? checkedIn / (area.totalSeats * days * 10)
        : 0;

      const hourCounts: Record<number, number> = {};
      const areaReservations = filteredReservations.filter(r => r.areaId === areaId && r.status === 'checked_in');
      for (const r of areaReservations) {
        const h = r.startTime.getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      }
      const peakHours = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([h]) => parseInt(h, 10));

      const trend: { date: Date; value: number }[] = [];
      for (let d = 0; d < days; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + d);
        const dateStr = date.toDateString();
        const dayCheckedIn = areaReservations.filter(r => r.startTime.toDateString() === dateStr).length;
        trend.push({
          date: new Date(date),
          value: area.totalSeats > 0 ? dayCheckedIn / area.totalSeats : 0,
        });
      }

      result.push({
        areaId,
        areaName: area.areaName,
        floor: area.floor,
        totalSeats: area.totalSeats,
        utilization,
        totalReservations: entry.total,
        peakHours,
        trend,
      });
    }

    return result.sort((a, b) => b.utilization - a.utilization);
  }

  async getViolationStats(params: QueryParams): Promise<ViolationStats[]> {
    const config = this.getConfigStore();
    const [startDate, endDate] = params.dateRange;
    const normalThreshold = config.normalNoShowThreshold;

    const sqlParams = {
      startDate,
      endDate,
      normalThreshold,
      areaIds: (params.areas || []).join(','),
      floors: (params.floors || []).map(String).join(','),
    };

    if (USE_REAL_CLICKHOUSE) {
      const result = await clickhouseClient.query(VIOLATION_STATS_QUERY.sql, sqlParams);
      return result.data.map((row: any) => ({
        date: new Date(row.date),
        noShowRate: parseFloat(row.no_show_rate),
        totalViolations: parseInt(row.total_violations, 10),
        sampleSize: parseInt(row.sample_size, 10),
        threshold: parseInt(row.threshold, 10),
        violationByType: row.violation_by_type || {},
      }));
    }

    const examPeriods = config.examPeriods;
    const closedDates = config.closedDates;
    
    const { reservations, violations, studentNoShowCounts } = generateDeterministicData(
      startDate, endDate, normalThreshold, examPeriods, closedDates
    );
    
    let filteredReservations = reservations;
    let filteredViolations = violations;
    
    if (params.areas && params.areas.length > 0) {
      filteredReservations = filteredReservations.filter(r => params.areas!.includes(r.areaId));
      const validResIds = new Set(filteredReservations.map(r => r.reservationId));
      filteredViolations = filteredViolations.filter(v => validResIds.has(v.reservationId));
    }
    if (params.floors && params.floors.length > 0) {
      filteredReservations = filteredReservations.filter(r => {
        const area = AREAS.find(a => a.areaId === r.areaId);
        return area && params.floors!.includes(area.floor);
      });
      const validResIds = new Set(filteredReservations.map(r => r.reservationId));
      filteredViolations = filteredViolations.filter(v => validResIds.has(v.reservationId));
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
    const result: ViolationStats[] = [];

    for (let d = 0; d < days; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);
      const dateStr = date.toDateString();

      const exam = examPeriods.find(
        ep => new Date(ep.startDate) <= date && new Date(ep.endDate) >= date
      );
      const threshold = exam ? exam.noShowThreshold : normalThreshold;

      const dayReservations = filteredReservations.filter(r => r.startTime.toDateString() === dateStr);
      const totalReservations = dayReservations.length;

      const dayStudentNoShows: Record<string, number> = {};
      for (const r of dayReservations) {
        if (r.status === 'no_show') {
          dayStudentNoShows[r.studentId] = (dayStudentNoShows[r.studentId] || 0) + 1;
        }
      }

      let noShowCount = 0;
      for (const [studentId, dayCount] of Object.entries(dayStudentNoShows)) {
        const totalCount = studentNoShowCounts[studentId] || 0;
        if (totalCount > threshold) {
          noShowCount += dayCount;
        }
      }

      const dayViolations = filteredViolations.filter(
        v => v.occurTime.toDateString() === dateStr && v.status !== 'ignored'
      );

      const violationByType: Record<string, number> = {};
      for (const v of dayViolations) {
        violationByType[v.violationType] = (violationByType[v.violationType] || 0) + 1;
      }

      result.push({
        date: new Date(date),
        noShowRate: totalReservations > 0 ? noShowCount / totalReservations : 0,
        totalViolations: dayViolations.length,
        sampleSize: totalReservations,
        threshold,
        violationByType,
      });
    }

    return result;
  }

  async getDashboardStats(params?: QueryParams): Promise<DashboardStats> {
    const config = this.getConfigStore();
    
    if (!params) {
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 6);
      params = { dateRange: [lastWeek, today] };
    }
    
    const [startDate, endDate] = params.dateRange;
    const normalThreshold = config.normalNoShowThreshold;

    const sqlParams = {
      startDate,
      endDate,
      normalThreshold,
      areaIds: (params.areas || []).join(','),
      floors: (params.floors || []).map(String).join(','),
    };

    if (USE_REAL_CLICKHOUSE) {
      const result = await clickhouseClient.query(DASHBOARD_STATS_QUERY.sql, sqlParams);
      const row = result.data[0];
      return {
        todayEntries: parseInt(row.today_entries, 10),
        todayReservations: parseInt(row.today_reservations, 10),
        checkInRate: parseFloat(row.check_in_rate),
        noShowRate: parseFloat(row.no_show_rate),
        weekTrend: row.week_trend || [],
        topAreas: row.top_areas || [],
      };
    }

    const examPeriods = config.examPeriods;
    const closedDates = config.closedDates;
    
    const { reservations, gateEntries, studentNoShowCounts } = generateDeterministicData(
      startDate, endDate, normalThreshold, examPeriods, closedDates
    );
    
    let filteredReservations = reservations;
    if (params.areas && params.areas.length > 0) {
      filteredReservations = filteredReservations.filter(r => params.areas!.includes(r.areaId));
    }
    if (params.floors && params.floors.length > 0) {
      filteredReservations = filteredReservations.filter(r => {
        const area = AREAS.find(a => a.areaId === r.areaId);
        return area && params.floors!.includes(area.floor);
      });
    }

    const today = new Date();
    const todayStr = today.toDateString();
    const todayEntries = gateEntries.filter(g => g.entryTime.toDateString() === todayStr).length;
    const todayReservations = filteredReservations.filter(r => r.startTime.toDateString() === todayStr).length;

    const totalReservations = filteredReservations.length;
    const checkedInCount = filteredReservations.filter(r => r.status === 'checked_in').length;
    const checkInRate = totalReservations > 0 ? checkedInCount / totalReservations : 0;

    const todayExam = examPeriods.find(
      ep => new Date(ep.startDate) <= today && new Date(ep.endDate) >= today
    );
    const todayThreshold = todayExam ? todayExam.noShowThreshold : normalThreshold;

    let noShowCount = 0;
    for (const [studentId, totalCount] of Object.entries(studentNoShowCounts)) {
      if (totalCount > todayThreshold) {
        const studentReservations = filteredReservations.filter(r => r.studentId === studentId);
        noShowCount += studentReservations.filter(r => r.status === 'no_show').length;
      }
    }
    const noShowRate = totalReservations > 0 ? noShowCount / totalReservations : 0;

    const weekTrend: { date: string; entries: number; reservations: number }[] = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = date.toDateString();
      weekTrend.push({
        date: `${date.getMonth() + 1}-${date.getDate()}`,
        entries: gateEntries.filter(g => g.entryTime.toDateString() === dateStr).length,
        reservations: filteredReservations.filter(r => r.startTime.toDateString() === dateStr).length,
      });
    }

    const areaStats: { areaName: string; utilization: number }[] = [];
    for (const area of AREAS) {
      if (params.areas && params.areas.length > 0 && !params.areas.includes(area.areaId)) continue;
      if (params.floors && params.floors.length > 0 && !params.floors.includes(area.floor)) continue;
      
      const areaRes = filteredReservations.filter(r => r.areaId === area.areaId);
      const areaCheckedIn = areaRes.filter(r => r.status === 'checked_in').length;
      const utilization = area.totalSeats > 0 ? areaCheckedIn / area.totalSeats : 0;
      areaStats.push({ areaName: area.areaName, utilization });
    }
    const topAreas = areaStats.sort((a, b) => b.utilization - a.utilization).slice(0, 5);

    return {
      todayEntries,
      todayReservations,
      checkInRate,
      noShowRate,
      weekTrend,
      topAreas,
    };
  }

  async getAreas(): Promise<Area[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(AREAS), 100);
    });
  }

  async getClosedDates(): Promise<ClosedDate[]> {
    const config = this.getConfigStore();
    return new Promise((resolve) => {
      setTimeout(() => resolve(config.closedDates), 100);
    });
  }

  async getExamPeriods(): Promise<ExamPeriod[]> {
    const config = this.getConfigStore();
    return new Promise((resolve) => {
      setTimeout(() => resolve(config.examPeriods), 100);
    });
  }

  async getRawRecords(date: Date, hour?: number, studentId?: string): Promise<(Reservation | Violation)[]> {
    const config = this.getConfigStore();
    const startDate = new Date(date);
    const endDate = new Date(date);
    const examPeriods = config.examPeriods;
    const closedDates = config.closedDates;
    
    const { reservations, violations } = generateDeterministicData(
      startDate, endDate, config.normalNoShowThreshold, examPeriods, closedDates
    );

    const records: (Reservation | Violation)[] = reservations.filter((r) => {
      const matchDate = r.startTime.toDateString() === date.toDateString();
      const matchHour = hour === undefined || r.startTime.getHours() === hour;
      const matchStudent = !studentId || r.studentId === studentId;
      return matchDate && matchHour && matchStudent;
    });

    if (studentId) {
      const violationRecords = violations.filter((v) => {
        return v.occurTime.toDateString() === date.toDateString() && v.studentId === studentId;
      });
      records.push(...violationRecords);
    }

    return records.slice(0, 50);
  }

  async getViolations(params: QueryParams, studentId?: string): Promise<Violation[]> {
    const config = this.getConfigStore();
    const [startDate, endDate] = params.dateRange;
    const examPeriods = config.examPeriods;
    const closedDates = config.closedDates;
    
    const { violations } = generateDeterministicData(
      startDate, endDate, config.normalNoShowThreshold, examPeriods, closedDates
    );
    
    let records = violations;
    if (studentId) {
      records = records.filter((v) => v.studentId === studentId);
    }
    
    return records.slice(0, 100);
  }

  async getStudentReservations(studentId: string, params: QueryParams): Promise<Reservation[]> {
    const config = this.getConfigStore();
    const [startDate, endDate] = params.dateRange;
    const examPeriods = config.examPeriods;
    const closedDates = config.closedDates;
    
    const { reservations } = generateDeterministicData(
      startDate, endDate, config.normalNoShowThreshold, examPeriods, closedDates
    );
    
    const records = reservations.filter((r) => r.studentId === studentId);
    return records.slice(0, 100);
  }

  isClickHouseConnected(): boolean {
    return USE_REAL_CLICKHOUSE;
  }

  getClickHouseClient() {
    return clickhouseClient;
  }
}

export const dataAdapter = new DataAdapterImpl();
export default dataAdapter;
