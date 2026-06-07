import { RentalRecord, FilterState, TrendDataPoint, BoxPlotData, UserRole } from '@/types';

export function calculateIQR(values: number[], threshold = 1.5): {
  q1: number;
  median: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  outliers: number[];
} {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const median = percentile(sorted, 50);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  const lowerBound = q1 - threshold * iqr;
  const upperBound = q3 + threshold * iqr;
  const outliers = sorted.filter(v => v < lowerBound || v > upperBound);

  return { q1, median, q3, iqr, lowerBound, upperBound, outliers };
}

function percentile(sorted: number[], p: number): number {
  const index = (p / 100) * (sorted.length - 1);
  const floor = Math.floor(index);
  const ceil = Math.ceil(index);
  if (floor === ceil) return sorted[floor];
  return sorted[floor] + (sorted[ceil] - sorted[floor]) * (index - floor);
}

export function detectAnomalies(records: RentalRecord[], threshold = 1.5): RentalRecord[] {
  const rents = records.map(r => r.rent);
  const { lowerBound, upperBound } = calculateIQR(rents, threshold);

  return records.map(r => ({
    ...r,
    isAnomaly: r.rent < lowerBound || r.rent > upperBound,
    anomalyReason: r.rent < lowerBound ? '租金异常偏低' : r.rent > upperBound ? '租金异常偏高' : undefined
  }));
}

export function filterRecords(records: RentalRecord[], filter: FilterState): RentalRecord[] {
  return records.filter(r => {
    if (filter.districts.length > 0 && !filter.districts.includes(r.district)) return false;
    if (filter.layouts.length > 0 && !filter.layouts.includes(r.layout)) return false;
    if (filter.sources.length > 0 && !r.sourcePlatforms.some(s => filter.sources.includes(s))) return false;
    if (r.rent < filter.rentRange[0] || r.rent > filter.rentRange[1]) return false;
    if (r.area < filter.areaRange[0] || r.area > filter.areaRange[1]) return false;
    if (r.buildingAge < filter.buildingAgeRange[0] || r.buildingAge > filter.buildingAgeRange[1]) return false;
    if (r.subwayDistance < filter.subwayDistanceRange[0] || r.subwayDistance > filter.subwayDistanceRange[1]) return false;
    if (filter.excludeAnomaly && r.isAnomaly) return false;
    if (r.dealCycle !== undefined && (r.dealCycle < filter.dealCycleRange[0] || r.dealCycle > filter.dealCycleRange[1])) return false;
    if (r.listingDate < filter.dateRange[0] || r.listingDate > filter.dateRange[1]) return false;
    return true;
  });
}

export function mergeDuplicateRecords(records: RentalRecord[]): RentalRecord[] {
  const groups = new Map<string, RentalRecord[]>();

  records.forEach(r => {
    const key = `${r.community}-${Math.round(r.area)}-${r.layout}-${r.floor.split('/')[0]}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(r);
  });

  const merged: RentalRecord[] = [];
  let idCounter = 0;

  groups.forEach(groupRecords => {
    if (groupRecords.length === 1) {
      merged.push(groupRecords[0]);
    } else {
      const base = groupRecords[0];
      const allSources = [...new Set(groupRecords.flatMap(r => r.sourcePlatforms))];
      const allMergeHistory = groupRecords.flatMap(r => r.mergeHistory);
      const rents = groupRecords.map(r => r.rent).sort((a, b) => a - b);
      const medianRent = rents[Math.floor(rents.length / 2)];

      merged.push({
        ...base,
        id: `MERGED-${String(idCounter++).padStart(5, '0')}`,
        sourcePlatforms: allSources,
        rent: medianRent,
        unitRent: Math.round((medianRent / base.area) * 100) / 100,
        lat: groupRecords.reduce((a, b) => a + b.lat, 0) / groupRecords.length,
        lng: groupRecords.reduce((a, b) => a + b.lng, 0) / groupRecords.length,
        mergeHistory: allMergeHistory
      });
    }
  });

  return merged;
}

export function generateTrendData(records: RentalRecord[]): TrendDataPoint[] {
  const monthMap = new Map<string, RentalRecord[]>();

  records.forEach(r => {
    const month = r.listingDate.substring(0, 7);
    if (!monthMap.has(month)) {
      monthMap.set(month, []);
    }
    monthMap.get(month)!.push(r);
  });

  const months = Array.from(monthMap.keys()).sort();
  return months.map(month => {
    const monthRecords = monthMap.get(month)!;
    const rents = monthRecords.map(r => r.rent);
    return {
      month,
      avgRent: Math.round(rents.reduce((a, b) => a + b, 0) / rents.length),
      medianRent: [...rents].sort((a, b) => a - b)[Math.floor(rents.length / 2)],
      sampleCount: monthRecords.length
    };
  });
}

export function generateBoxPlotData(records: RentalRecord[], groupBy: 'district' | 'layout'): BoxPlotData[] {
  const groups = new Map<string, RentalRecord[]>();

  records.forEach(r => {
    const key = r[groupBy];
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(r);
  });

  return Array.from(groups.entries()).map(([name, groupRecords]) => {
    const values = groupRecords.map(r => r.rent).sort((a, b) => a - b);
    const { q1, median, q3, lowerBound, upperBound, outliers } = calculateIQR(values);

    return {
      name,
      min: Math.max(values[0], lowerBound),
      q1,
      median,
      q3,
      max: Math.min(values[values.length - 1], upperBound),
      outliers
    };
  });
}

export function applyRoleBasedFiltering(records: RentalRecord[], role: UserRole): RentalRecord[] {
  if (role === 'student') {
    return records.map(r => ({
      ...r,
      annotation: undefined,
      mergeHistory: []
    }));
  }
  return records;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN').format(num);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

export function getPriceColor(price: number, min: number, max: number): string {
  const ratio = (price - min) / (max - min || 1);
  const h = 240 - ratio * 200;
  return `hsl(${h}, 70%, 50%)`;
}
