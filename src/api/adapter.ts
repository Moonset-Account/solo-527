import { generateHeatmapData, generateAreaUtilization, generateViolationStats, generateDashboardStats, ALL_RESERVATIONS, ALL_VIOLATIONS, AREAS, CLOSED_DATES, EXAM_PERIODS } from '@/mock/dataGenerator';
import type { HeatmapCell, AreaUtilization, ViolationStats, DashboardStats, Area, ClosedDate, ExamPeriod, Reservation, Violation } from '@/types';

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
  getRawRecords(date: Date, hour?: number): Promise<(Reservation | Violation)[]>;
  getViolations(params: QueryParams): Promise<Violation[]>;
}

class MockDataAdapter implements DataAdapter {
  async getHeatmapData(params: QueryParams): Promise<HeatmapCell[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(generateHeatmapData(params.dateRange[0], params.dateRange[1], params.areas));
      }, 300);
    });
  }
  
  async getAreaUtilization(params: QueryParams): Promise<AreaUtilization[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(generateAreaUtilization(params.dateRange[0], params.dateRange[1], params.floors));
      }, 300);
    });
  }
  
  async getViolationStats(params: QueryParams): Promise<ViolationStats[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(generateViolationStats(params.dateRange[0], params.dateRange[1]));
      }, 300);
    });
  }
  
  async getDashboardStats(_params?: QueryParams): Promise<DashboardStats> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(generateDashboardStats());
      }, 300);
    });
  }
  
  async getAreas(): Promise<Area[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(AREAS), 100);
    });
  }
  
  async getClosedDates(): Promise<ClosedDate[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(CLOSED_DATES), 100);
    });
  }
  
  async getExamPeriods(): Promise<ExamPeriod[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(EXAM_PERIODS), 100);
    });
  }
  
  async getRawRecords(date: Date, hour?: number): Promise<(Reservation | Violation)[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const dateStr = date.toDateString();
        const records = ALL_RESERVATIONS
          .filter(r => {
            const matchDate = r.startTime.toDateString() === dateStr;
            const matchHour = hour === undefined || r.startTime.getHours() === hour;
            return matchDate && matchHour;
          })
          .slice(0, 20);
        resolve(records);
      }, 400);
    });
  }
  
  async getViolations(params: QueryParams): Promise<Violation[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const [start, end] = params.dateRange;
        const records = ALL_VIOLATIONS
          .filter(v => v.occurTime >= start && v.occurTime <= end)
          .slice(0, 100);
        resolve(records);
      }, 300);
    });
  }
}

export const dataAdapter = new MockDataAdapter();
