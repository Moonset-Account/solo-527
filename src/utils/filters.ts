import type { Prescription, FilterState } from '@/types';
import type { DrillDownFilter } from '@/store/useFilterStore';
import { windows } from '@/data/mockData';

export function isDateInRange(dateStr: string, start: string, end: string): boolean {
  const date = new Date(dateStr);
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  return date >= startDate && date <= endDate;
}

export function parseWaitTimeRange(range: string): { min: number; max: number } {
  if (range === '60分钟以上') {
    return { min: 60, max: Infinity };
  }
  const match = range.match(/(\d+)-(\d+)分钟/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }
  return { min: 0, max: Infinity };
}

export function applyFilters(
  prescriptions: Prescription[],
  filters: FilterState,
  drillDown: DrillDownFilter = {}
): Prescription[] {
  return prescriptions.filter((p) => {
    if (!isDateInRange(p.createdAt, filters.dateRange.start, filters.dateRange.end)) {
      return false;
    }

    if (filters.windows.length > 0 && !filters.windows.includes(p.windowId)) {
      return false;
    }

    if (filters.pharmacists.length > 0 && !filters.pharmacists.includes(p.pharmacistId)) {
      return false;
    }

    if (filters.departments.length > 0 && !filters.departments.includes(p.departmentId)) {
      return false;
    }

    if (filters.prescriptionTypes.length > 0 && !filters.prescriptionTypes.includes(p.type)) {
      return false;
    }

    if (filters.timePeriods.length > 0 && !filters.timePeriods.includes(p.timePeriod)) {
      return false;
    }

    if (drillDown.waitTimeRange) {
      const { min, max } = parseWaitTimeRange(drillDown.waitTimeRange);
      if (p.waitTime < min || p.waitTime >= max) {
        return false;
      }
    }

    if (drillDown.windowNo) {
      if (p.windowNo !== drillDown.windowNo) {
        return false;
      }
    }

    if (drillDown.hour) {
      const hourMatch = drillDown.hour.match(/(\d+):00/);
      if (hourMatch) {
        const targetHour = parseInt(hourMatch[1]);
        if (p.hour !== targetHour) {
          return false;
        }
      }
    }

    return true;
  });
}

export function getWindowIdByNo(windowNo: string): string | undefined {
  const w = windows.find((w) => w.windowNo === windowNo);
  return w?.id;
}

export function getWaitTimeRangeLabel(min: number, max: number): string {
  if (max === Infinity) {
    return `${min}分钟以上`;
  }
  return `${min}-${max}分钟`;
}
