import {
  WaterQualityRecord,
  SamplingPoint,
  RiverSection,
  SamplingAgency,
  IndicatorKey,
  FilterState
} from '@/types';
import { SAMPLING_POINTS, RIVER_SECTIONS, SAMPLING_AGENCIES, WATER_QUALITY_RECORDS } from '@/data/mockData';
import { INDICATOR_STANDARDS } from '@/data/indicators';

export function getPointById(pointId: string): SamplingPoint | undefined {
  return SAMPLING_POINTS.find(p => p.id === pointId);
}

export function getSectionById(sectionId: string): RiverSection | undefined {
  return RIVER_SECTIONS.find(s => s.id === sectionId);
}

export function getAgencyById(agencyId: string): SamplingAgency | undefined {
  return SAMPLING_AGENCIES.find(a => a.id === agencyId);
}

export function getPointsBySection(sectionId: string): SamplingPoint[] {
  return SAMPLING_POINTS.filter(p => p.sectionId === sectionId);
}

export function filterWaterQualityRecords(
  records: WaterQualityRecord[],
  filters: FilterState
): WaterQualityRecord[] {
  return records.filter(record => {
    if (filters.selectedPoints.length > 0 && !filters.selectedPoints.includes(record.pointId)) {
      return false;
    }
    
    if (filters.selectedSections.length > 0) {
      const point = getPointById(record.pointId);
      if (!point || !filters.selectedSections.includes(point.sectionId)) {
        return false;
      }
    }
    
    if (filters.selectedAgencies.length > 0) {
      const point = getPointById(record.pointId);
      if (!point || !filters.selectedAgencies.includes(point.agencyId)) {
        return false;
      }
    }
    
    if (filters.selectedMonths.length > 0) {
      const recordMonth = record.sampleTime.substring(0, 7);
      if (!filters.selectedMonths.includes(recordMonth)) {
        return false;
      }
    }
    
    const recordDate = record.sampleTime.split('T')[0];
    if (recordDate < filters.dateRange.start || recordDate > filters.dateRange.end) {
      return false;
    }
    
    return true;
  });
}

export function calculateSummaryStats(records: WaterQualityRecord[]) {
  const validRecords = records.filter(r => !r.isMissing);
  const totalSamples = validRecords.length;
  
  const exceedCount = validRecords.filter(r => r.status === 'exceed').length;
  const complianceRate = totalSamples > 0 
    ? Math.round(((totalSamples - exceedCount) / totalSamples) * 1000) / 10 
    : 0;
  
  const avgIndicators: Record<IndicatorKey, number | null> = {
    temperature: null,
    ph: null,
    dissolvedOxygen: null,
    ammoniaNitrogen: null
  };
  
  const sums: Record<IndicatorKey, { sum: number; count: number }> = {
    temperature: { sum: 0, count: 0 },
    ph: { sum: 0, count: 0 },
    dissolvedOxygen: { sum: 0, count: 0 },
    ammoniaNitrogen: { sum: 0, count: 0 }
  };
  
  validRecords.forEach(record => {
    (Object.keys(sums) as IndicatorKey[]).forEach(key => {
      const value = record[key];
      if (value !== null) {
        sums[key].sum += value;
        sums[key].count++;
      }
    });
  });
  
  (Object.keys(sums) as IndicatorKey[]).forEach(key => {
    if (sums[key].count > 0) {
      avgIndicators[key] = Math.round((sums[key].sum / sums[key].count) * 100) / 100;
    }
  });
  
  return {
    totalSamples,
    exceedCount,
    complianceRate,
    avgIndicators,
    warningCount: validRecords.filter(r => r.status === 'warning').length
  };
}

export function getExceedRecords(records: WaterQualityRecord[]): WaterQualityRecord[] {
  return records
    .filter(r => r.status === 'exceed' && !r.isMissing)
    .sort((a, b) => new Date(b.sampleTime).getTime() - new Date(a.sampleTime).getTime());
}

export function getIndicatorValue(record: WaterQualityRecord, indicator: IndicatorKey): number | null {
  return record[indicator];
}

export function isValueExceed(indicator: IndicatorKey, value: number | null): boolean {
  if (value === null) return false;
  const std = INDICATOR_STANDARDS[indicator].standard;
  if (std.min !== null && value < std.min) return true;
  if (std.max !== null && value > std.max) return true;
  return false;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(dateTimeStr: string): string {
  const date = new Date(dateTimeStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function getAvailableMonths(): string[] {
  const months = new Set<string>();
  WATER_QUALITY_RECORDS.forEach(r => {
    months.add(r.sampleTime.substring(0, 7));
  });
  return Array.from(months).sort();
}

export function getMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  return `${year}年${parseInt(month)}月`;
}
