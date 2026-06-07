export type DataSource = 'manual' | 'automatic';

export type WaterQualityGrade = 'Ⅰ' | 'Ⅱ' | 'Ⅲ' | 'Ⅳ' | 'Ⅴ' | '劣Ⅴ';

export type UserRole = 'researcher' | 'admin';

export interface MonitoringSite {
  id: string;
  name: string;
  code: string;
  riverSection: string;
  longitude: number;
  latitude: number;
  organization: string;
  type: DataSource;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Measurement {
  id: string;
  siteId: string;
  sampleTime: string;
  temperature: number | null;
  ph: number | null;
  dissolvedOxygen: number | null;
  ammoniaNitrogen: number | null;
  rainfall: number | null;
  dataSource: DataSource;
  organization: string;
  isAnomaly: boolean;
  anomalyReason?: string;
  note?: string;
  sampledBy?: string;
}

export interface IndicatorConfig {
  code: string;
  name: string;
  unit: string;
  standardMin: number;
  standardMax: number;
  color: string;
  gradeThresholds: Record<WaterQualityGrade, number>;
}

export interface DataDictionary {
  indicators: IndicatorConfig[];
  riverSections: string[];
  organizations: string[];
  waterQualityGrades: Array<{
    grade: WaterQualityGrade;
    color: string;
    description: string;
  }>;
}

export interface QualityCheckResult {
  totalRecords: number;
  missingValues: {
    temperature: number;
    ph: number;
    dissolvedOxygen: number;
    ammoniaNitrogen: number;
    rainfall: number;
  };
  anomalyCount: number;
  sampleCountBySite: Record<string, number>;
  sampleCountByMonth: Record<string, number>;
}

export interface MeasurementQuery {
  siteIds?: string[];
  riverSections?: string[];
  organizations?: string[];
  indicators?: string[];
  startDate?: string;
  endDate?: string;
  dataSource?: DataSource | 'all';
  onlyAnomalies?: boolean;
}

export interface OverviewStats {
  totalSites: number;
  totalRecords: number;
  anomalyCount: number;
  complianceRate: number;
  latestDataTime: string;
  indicators: Array<{
    code: string;
    name: string;
    avgValue: number | null;
    complianceRate: number;
    anomalyCount: number;
    unit: string;
  }>;
  riverSections: Array<{
    name: string;
    siteCount: number;
    avgGrade: WaterQualityGrade;
    anomalyCount: number;
  }>;
  recentAnomalies: Array<{
    id: string;
    siteName: string;
    indicator: string;
    value: number;
    sampleTime: string;
    reason?: string;
  }>;
}

export interface TrendPoint {
  time: string;
  value: number | null;
  isAnomaly?: boolean;
  note?: string;
}

export interface TrendData {
  indicator: string;
  indicatorName: string;
  unit: string;
  dataSource: DataSource;
  siteName?: string;
  points: TrendPoint[];
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  organization: string;
}

export interface AnomalyNote {
  id: string;
  measurementId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}
