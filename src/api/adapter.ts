import {
  ALL_RESERVATIONS,
  ALL_VIOLATIONS,
  ALL_GATE_ENTRIES,
  AREAS,
  calculateHeatmapData,
  calculateAreaUtilization,
  calculateViolationStats,
  calculateDashboardStats,
} from '@/mock/dataGenerator';
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
import { useSystemConfigStore } from '@/stores/systemConfig';
import { isSameDay } from 'date-fns';

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

class MockDataAdapter implements DataAdapter {
  private getConfig() {
    const configStore = useSystemConfigStore();
    return {
      closedDates: configStore.closedDates,
      examPeriods: configStore.examPeriods,
      normalThreshold: configStore.normalNoShowThreshold,
    };
  }

  async getHeatmapData(params: QueryParams): Promise<HeatmapCell[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const config = this.getConfig();
        const data = calculateHeatmapData(
          ALL_RESERVATIONS,
          params.dateRange[0],
          params.dateRange[1],
          config,
          params.areas,
          params.floors
        );
        resolve(data);
      }, 300);
    });
  }

  async getAreaUtilization(params: QueryParams): Promise<AreaUtilization[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const config = this.getConfig();
        const data = calculateAreaUtilization(
          ALL_RESERVATIONS,
          params.dateRange[0],
          params.dateRange[1],
          config,
          params.areas,
          params.floors
        );
        resolve(data);
      }, 300);
    });
  }

  async getViolationStats(params: QueryParams): Promise<ViolationStats[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const config = this.getConfig();
        const data = calculateViolationStats(
          ALL_RESERVATIONS,
          ALL_VIOLATIONS,
          params.dateRange[0],
          params.dateRange[1],
          config,
          params.areas,
          params.floors
        );
        resolve(data);
      }, 300);
    });
  }

  async getDashboardStats(params: QueryParams): Promise<DashboardStats> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const config = this.getConfig();
        const data = calculateDashboardStats(
          ALL_RESERVATIONS,
          ALL_VIOLATIONS,
          ALL_GATE_ENTRIES,
          params.dateRange[0],
          params.dateRange[1],
          config,
          params.areas,
          params.floors
        );
        resolve(data);
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
      const configStore = useSystemConfigStore();
      setTimeout(() => resolve(configStore.closedDates), 100);
    });
  }

  async getExamPeriods(): Promise<ExamPeriod[]> {
    return new Promise((resolve) => {
      const configStore = useSystemConfigStore();
      setTimeout(() => resolve(configStore.examPeriods), 100);
    });
  }

  async getRawRecords(date: Date, hour?: number, studentId?: string): Promise<(Reservation | Violation)[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const records: (Reservation | Violation)[] = ALL_RESERVATIONS.filter((r) => {
          const matchDate = isSameDay(r.startTime, date);
          const matchHour = hour === undefined || r.startTime.getHours() === hour;
          const matchStudent = !studentId || r.studentId === studentId;
          return matchDate && matchHour && matchStudent;
        });

        if (studentId) {
          const violationRecords = ALL_VIOLATIONS.filter((v) => isSameDay(v.occurTime, date) && v.studentId === studentId);
          records.push(...violationRecords);
        }

        resolve(records.slice(0, 50));
      }, 400);
    });
  }

  async getViolations(params: QueryParams, studentId?: string): Promise<Violation[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const [start, end] = params.dateRange;
        let records = ALL_VIOLATIONS.filter(
          (v) => v.occurTime >= start && v.occurTime <= end
        );
        if (studentId) {
          records = records.filter((v) => v.studentId === studentId);
        }
        if (params.areas && params.areas.length > 0) {
          records = records.filter((v) => {
            const res = ALL_RESERVATIONS.find(r => r.reservationId === v.reservationId);
            return res && params.areas?.includes(res.areaId);
          });
        }
        if (params.floors && params.floors.length > 0) {
          records = records.filter((v) => {
            const res = ALL_RESERVATIONS.find(r => r.reservationId === v.reservationId);
            if (!res) return false;
            const area = AREAS.find(a => a.areaId === res.areaId);
            return area && params.floors?.includes(area.floor);
          });
        }
        resolve(records.slice(0, 100));
      }, 300);
    });
  }

  async getStudentReservations(studentId: string, params: QueryParams): Promise<Reservation[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const [start, end] = params.dateRange;
        const records = ALL_RESERVATIONS.filter(
          (r) => r.studentId === studentId && r.startTime >= start && r.startTime <= end
        );
        resolve(records.slice(0, 100));
      }, 300);
    });
  }
}

export const dataAdapter = new MockDataAdapter();
