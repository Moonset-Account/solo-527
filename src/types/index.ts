export type SampleType = 'manual' | 'auto';
export type DataStatus = 'normal' | 'warning' | 'exceed';
export type IndicatorKey = 'temperature' | 'ph' | 'dissolvedOxygen' | 'ammoniaNitrogen';
export type UserRole = 'public' | 'researcher' | 'admin';

export interface RiverSection {
  id: string;
  name: string;
  riverName: string;
  coordinates: [number, number][];
}

export interface SamplingPoint {
  id: string;
  name: string;
  sectionId: string;
  type: SampleType;
  lat: number;
  lng: number;
  agencyId: string;
}

export interface WaterQualityRecord {
  id: string;
  pointId: string;
  sampleTime: string;
  sampleType: SampleType;
  temperature: number | null;
  ph: number | null;
  dissolvedOxygen: number | null;
  ammoniaNitrogen: number | null;
  isMissing: boolean;
  status: DataStatus;
  exceedIndicators: IndicatorKey[];
}

export interface RainfallRecord {
  id: string;
  pointId: string;
  date: string;
  rainfallMm: number;
}

export interface SamplingAgency {
  id: string;
  name: string;
  contact: string;
}

export interface IndicatorStandard {
  name: string;
  unit: string;
  standard: { min: number | null; max: number | null };
  description: string;
  detectionMethod: string;
  limitation: string;
}

export interface FilterState {
  selectedSections: string[];
  selectedPoints: string[];
  selectedMonths: string[];
  selectedIndicators: IndicatorKey[];
  selectedAgencies: string[];
  dateRange: { start: string; end: string };
}

export interface ChartInteractionState {
  selectedPointId: string | null;
  highlightedTime: string | null;
  zoomRange: { start: string; end: string } | null;
}

export interface ReportConfig {
  id: string;
  title: string;
  generatedAt: string;
  filterSnapshot: FilterState;
  summaryStats: {
    totalSamples: number;
    complianceRate: number;
    exceedCount: number;
    avgIndicators: Record<IndicatorKey, number | null>;
  };
}

export interface PermissionState {
  role: UserRole;
  canExportRawData: boolean;
  canViewExceedDetail: boolean;
  canManageScheduledReports: boolean;
}
