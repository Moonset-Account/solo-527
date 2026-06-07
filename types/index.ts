export type DataSource = 'manual' | 'automatic';
export type WaterQualityGrade = 'Ⅰ' | 'Ⅱ' | 'Ⅲ' | 'Ⅳ' | 'Ⅴ' | '劣Ⅴ';
export type UserRole = 'admin' | 'researcher';

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

export interface User {
  id: string;
  username: string;
  password_hash?: string;
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

export interface MeasurementQuery {
  siteIds?: string[];
  riverSections?: string[];
  organizations?: string[];
  startDate?: string;
  endDate?: string;
  dataSource?: 'manual' | 'automatic' | 'all';
  onlyAnomalies?: boolean;
}

export interface TrendPoint {
  date: string;
  value: number | null;
  isAnomaly: boolean;
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
    unit: string;
    avgValue: number | null;
    complianceRate: number;
  }>;
  riverSections: Array<{
    name: string;
    siteCount: number;
    avgGrade: WaterQualityGrade;
    anomalyCount: number;
  }>;
  recentAnomalies: Array<{
    id: string;
    siteId: string;
    siteName: string;
    indicator: string;
    sampleTime: string;
    reason?: string;
  }>;
}

export interface QualityCheckResult {
  totalRecords: number;
  anomalyCount: number;
  missingValues: {
    temperature: number;
    ph: number;
    dissolvedOxygen: number;
    ammoniaNitrogen: number;
  };
  monthlySamples: Array<{ month: string; count: number }>;
  siteSampleCounts: Array<{ siteName: string; count: number }>;
  siteMissingRates: Array<{ siteName: string; missingRate: number; total: number }>;
}

export interface TrendData {
  dates: string[];
  values: (number | null)[];
  anomalies: boolean[];
}

export interface AnomalyRecord {
  measurementId: string;
  siteName: string;
  indicator: string;
  value: number;
  standard: number;
  sampleTime: string;
}

export interface DataDictionaryItem {
  code: string;
  name: string;
  unit: string;
  description: string;
  standard: number;
  color: string;
}
