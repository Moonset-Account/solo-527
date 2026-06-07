export interface RentalRecord {
  id: string;
  sourcePlatforms: string[];
  community: string;
  district: string;
  area: number;
  layout: string;
  bedrooms: number;
  rent: number;
  unitRent: number;
  floor: string;
  buildingAge: number;
  subwayDistance: number;
  listingDate: string;
  dealDate?: string;
  dealCycle?: number;
  lat: number;
  lng: number;
  isAnomaly: boolean;
  anomalyReason?: string;
  annotation?: string;
  mergeHistory: string[];
}

export interface DistrictAggregation {
  district: string;
  sampleCount: number;
  avgRent: number;
  medianRent: number;
  q1Rent: number;
  q3Rent: number;
  minRent: number;
  maxRent: number;
  avgUnitRent: number;
  avgDealCycle: number;
  avgBuildingAge: number;
  avgSubwayDistance: number;
  layoutDistribution: Record<string, number>;
  isLowSample: boolean;
  boundary: [number, number][];
  center: [number, number];
}

export interface CommunityAggregation {
  community: string;
  district: string;
  sampleCount: number;
  avgRent: number;
  medianRent: number;
  lat: number;
  lng: number;
  isLowSample: boolean;
}

export interface FilterState {
  districts: string[];
  layouts: string[];
  dateRange: [string, string];
  sources: string[];
  rentRange: [number, number];
  areaRange: [number, number];
  buildingAgeRange: [number, number];
  subwayDistanceRange: [number, number];
  dealCycleRange: [number, number];
  excludeAnomaly: boolean;
  iqrThreshold: number;
}

export interface ExportContext {
  exportTime: string;
  dataUpdateTime: string;
  filterState: FilterState;
  sampleCount: number;
  anomalyCount: number;
  userId: string;
  userRole: string;
}

export interface TrendDataPoint {
  month: string;
  avgRent: number;
  medianRent: number;
  sampleCount: number;
}

export interface BoxPlotData {
  name: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

export type UserRole = 'student' | 'mentor' | 'admin';

export const DISTRICTS = [
  '朝阳区', '海淀区', '西城区', '东城区', '丰台区',
  '石景山区', '通州区', '昌平区', '大兴区', '顺义区'
];

export const LAYOUTS = [
  '1室1厅', '2室1厅', '2室2厅', '3室1厅', '3室2厅', '4室及以上'
];

export const SOURCES = ['链家', '贝壳', '安居客', '58同城', '自如'];

export const SAMPLE_THRESHOLD = 30;
