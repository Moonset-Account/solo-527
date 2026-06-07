/**
 * 数据适配器 - 基于 ClickHouse 查询口径实现
 * 
 * 统一数据口径说明：
 * 1. 预约数据：library.reservations 表（状态：reserved/checked_in/cancelled/no_show）
 * 2. 闸机入馆：library.gate_entries 表
 * 3. 座位签到：library.seat_checkins 表
 * 4. 违规记录：library.violations 表（状态：pending/processed/ignored）
 * 5. 爽约判定：学生累计爽约次数 > 阈值，才计入爽约率统计
 * 
 * 所有查询口径与 clickhouse.ts 中的 SQL 模板保持一致
 */

import { useDataCenterStore } from '@/stores/dataCenter';
import { useSystemConfigStore } from '@/stores/systemConfig';
import { AREAS } from '@/mock/dataGenerator';
import {
  HEATMAP_QUERY,
  AREA_UTILIZATION_QUERY,
  VIOLATION_STATS_QUERY,
  DASHBOARD_STATS_QUERY,
} from './clickhouse';
import type {
  HeatmapCell,
  AreaUtilization,
  ViolationStats,
  DashboardStats,
  Area,
  ClosedDate,
  ExamPeriod,
  Reservation,
  Violation,
} from '@/types';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';

export interface QueryParams {
  dateRange: [Date, Date];
  areas?: string[];
  floors?: number[];
}

export interface DataAdapter {
  getHeatmapData(params: QueryParams): Promise<HeatmapCell[]>;
  getAreaUtilization(params: QueryParams): Promise<AreaUtilization[]>;
  getViolationStats(params: QueryParams): Promise<ViolationStats[]>;
  getDashboardStats(params: QueryParams): Promise<DashboardStats>;
  getAreas(): Promise<Area[]>;
  getClosedDates(): Promise<ClosedDate[]>;
  getExamPeriods(): Promise<ExamPeriod[]>;
  getRawRecords(date: Date, hour?: number, studentId?: string): Promise<(Reservation | Violation)[]>;
  getViolations(params: QueryParams, studentId?: string): Promise<Violation[]>;
  getStudentReservations(studentId: string, params: QueryParams): Promise<Reservation[]>;
}

class DataAdapterImpl implements DataAdapter {
  readonly queryTemplates = {
    heatmap: HEATMAP_QUERY,
    areaUtilization: AREA_UTILIZATION_QUERY,
    violationStats: VIOLATION_STATS_QUERY,
    dashboardStats: DASHBOARD_STATS_QUERY,
  };

  private getDataCenter() {
    const store = useDataCenterStore();
    if (!store.isInitialized) {
      store.initializeBaseData();
    }
    return store;
  }

  private getConfigStore() {
    return useSystemConfigStore();
  }

  private buildConfig() {
    const configStore = this.getConfigStore();
    return {
      closedDates: configStore.closedDates,
      examPeriods: configStore.examPeriods,
      normalThreshold: configStore.normalNoShowThreshold,
    };
  }

  async getHeatmapData(params: QueryParams): Promise<HeatmapCell[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const dataCenter = this.getDataCenter();
        const config = this.buildConfig();
        const [startDate, endDate] = params.dateRange;
        
        const cells: HeatmapCell[] = [];
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        
        let filteredAreas = params.areas && params.areas.length > 0
          ? AREAS.filter(a => params.areas!.includes(a.areaId))
          : AREAS;
        filteredAreas = params.floors && params.floors.length > 0
          ? filteredAreas.filter(a => params.floors!.includes(a.floor))
          : filteredAreas;
        
        const filteredReservations = dataCenter.filterReservations(
          startDate, endDate, params.areas, params.floors
        );
        const totalSeats = filteredAreas.reduce((sum, a) => sum + a.totalSeats, 0);
        
        for (const day of days) {
          const isClosed = config.closedDates.some(cd => isSameDay(cd.date, day));
          const isExamWeek = config.examPeriods.some(
            ep => day >= ep.startDate && day <= ep.endDate
          );
          
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
        
        resolve(cells);
      }, 300);
    });
  }

  async getAreaUtilization(params: QueryParams): Promise<AreaUtilization[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const dataCenter = this.getDataCenter();
        const [startDate, endDate] = params.dateRange;
        
        let filteredAreas = params.areas && params.areas.length > 0
          ? AREAS.filter(a => params.areas!.includes(a.areaId))
          : AREAS;
        filteredAreas = params.floors && params.floors.length > 0
          ? filteredAreas.filter(a => params.floors!.includes(a.floor))
          : filteredAreas;
        
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const filteredReservations = dataCenter.filterReservations(
          startDate, endDate, params.areas, params.floors
        );
        
        const result = filteredAreas.map(area => {
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
        
        resolve(result);
      }, 300);
    });
  }

  async getViolationStats(params: QueryParams): Promise<ViolationStats[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const dataCenter = this.getDataCenter();
        const [startDate, endDate] = params.dateRange;
        
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const filteredReservations = dataCenter.filterReservations(
          startDate, endDate, params.areas, params.floors
        );
        const filteredViolations = dataCenter.filterViolations(
          startDate, endDate, params.areas, params.floors
        );
        
        const studentTotalNoShowCounts: Record<string, number> = {};
        for (const day of days) {
          const dayReservations = filteredReservations.filter(r => isSameDay(r.startTime, day));
          dayReservations
            .filter(r => r.status === 'no_show')
            .forEach(r => {
              studentTotalNoShowCounts[r.studentId] = (studentTotalNoShowCounts[r.studentId] || 0) + 1;
            });
        }
        
        const result = days.map(day => {
          const dayReservations = filteredReservations.filter(r => isSameDay(r.startTime, day));
          const dayViolations = filteredViolations.filter(v => isSameDay(v.occurTime, day));
          
          const threshold = dataCenter.getNoShowThresholdForDate(day);
          const totalReservations = dayReservations.length;
          
          const dayStudentNoShows: Record<string, number> = {};
          dayReservations
            .filter(r => r.status === 'no_show')
            .forEach(r => {
              dayStudentNoShows[r.studentId] = (dayStudentNoShows[r.studentId] || 0) + 1;
            });
          
          let noShowCount = 0;
          for (const [studentId, dayCount] of Object.entries(dayStudentNoShows)) {
            const totalCount = studentTotalNoShowCounts[studentId] || 0;
            if (totalCount > threshold) {
              noShowCount += dayCount;
            }
          }
          
          const noShowRate = totalReservations > 0 ? noShowCount / totalReservations : 0;
          
          const violationByType: Record<string, number> = {
            no_show: 0,
            late_checkin: 0,
            early_leave: 0,
            occupancy_timeout: 0,
          };
          
          dayViolations.forEach(v => {
            if (v.status !== 'ignored') {
              violationByType[v.violationType] = (violationByType[v.violationType] || 0) + 1;
            }
          });
          
          return {
            date: day,
            noShowRate,
            totalViolations: dayViolations.filter(v => v.status !== 'ignored').length,
            violationByType,
            sampleSize: totalReservations,
            threshold,
          };
        });
        
        resolve(result);
      }, 300);
    });
  }

  async getDashboardStats(params: QueryParams): Promise<DashboardStats> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const dataCenter = this.getDataCenter();
        const [startDate, endDate] = params.dateRange;
        
        const filteredReservations = dataCenter.filterReservations(
          startDate, endDate, params.areas, params.floors
        );
        const filteredViolations = dataCenter.filterViolations(
          startDate, endDate, params.areas, params.floors
        );
        const filteredGateEntries = dataCenter.filterGateEntries(startDate, endDate);
        
        const today = endDate;
        const todayReservations = filteredReservations.filter(r => isSameDay(r.startTime, today));
        const todayEntries = filteredGateEntries.filter(g => isSameDay(g.entryTime, today)).length;
        const todayRes = todayReservations.length;
        
        const totalReservations = filteredReservations.length;
        const checkedInCount = filteredReservations.filter(r => r.status === 'checked_in').length;
        
        const noShowResult = dataCenter.calculateNoShowRateByThreshold(
          filteredReservations,
          startDate,
          endDate
        );
        
        const checkInRate = totalReservations > 0 ? checkedInCount / totalReservations : 0;
        const noShowRate = noShowResult.noShowRate;
        
        const weekDays = eachDayOfInterval({ start: startDate, end: endDate }).slice(-7);
        const weekTrend = weekDays.map(d => {
          const dayRes = filteredReservations.filter(r => isSameDay(r.startTime, d));
          const dayEntries = filteredGateEntries.filter(g => isSameDay(g.entryTime, d)).length;
          return {
            date: format(d, 'MM-dd'),
            entries: dayEntries,
            reservations: dayRes.length,
          };
        });
        
        let areaStats = AREAS.map(area => {
          if (params.areas && params.areas.length > 0 && !params.areas.includes(area.areaId)) return null;
          if (params.floors && params.floors.length > 0 && !params.floors.includes(area.floor)) return null;
          
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
      }, 300);
    });
  }

  async getAreas(): Promise<Area[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(AREAS), 100);
    });
  }

  async getClosedDates(): Promise<ClosedDate[]> {
    return new Promise((resolve) => {
      const configStore = this.getConfigStore();
      setTimeout(() => resolve(configStore.closedDates), 100);
    });
  }

  async getExamPeriods(): Promise<ExamPeriod[]> {
    return new Promise((resolve) => {
      const configStore = this.getConfigStore();
      setTimeout(() => resolve(configStore.examPeriods), 100);
    });
  }

  async getRawRecords(date: Date, hour?: number, studentId?: string): Promise<(Reservation | Violation)[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const dataCenter = this.getDataCenter();
        const records: (Reservation | Violation)[] = dataCenter.filterReservations(
          date, new Date(date.getTime() + 86400000)
        ).filter((r) => {
          const matchDate = isSameDay(r.startTime, date);
          const matchHour = hour === undefined || r.startTime.getHours() === hour;
          const matchStudent = !studentId || r.studentId === studentId;
          return matchDate && matchHour && matchStudent;
        });

        if (studentId) {
          const violationRecords = dataCenter.filterViolations(
            date, new Date(date.getTime() + 86400000)
          ).filter((v) => isSameDay(v.occurTime, date) && v.studentId === studentId);
          records.push(...violationRecords);
        }

        resolve(records.slice(0, 50));
      }, 400);
    });
  }

  async getViolations(params: QueryParams, studentId?: string): Promise<Violation[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const dataCenter = this.getDataCenter();
        const [start, end] = params.dateRange;
        let records = dataCenter.filterViolations(start, end, params.areas, params.floors);
        
        if (studentId) {
          records = records.filter((v) => v.studentId === studentId);
        }
        
        resolve(records.slice(0, 100));
      }, 300);
    });
  }

  async getStudentReservations(studentId: string, params: QueryParams): Promise<Reservation[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const dataCenter = this.getDataCenter();
        const [start, end] = params.dateRange;
        const records = dataCenter.filterReservations(start, end)
          .filter((r) => r.studentId === studentId);
        resolve(records.slice(0, 100));
      }, 300);
    });
  }
}

export const dataAdapter = new DataAdapterImpl();
