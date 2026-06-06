export interface Station {
  id: string;
  name: string;
  area: string;
  lng: number;
  lat: number;
  capacity: number;
  availableBikes: number;
  availableDocks: number;
  maintenanceBikes: number;
  status: 'normal' | 'low' | 'full' | 'maintenance';
  lastUpdate: number;
}

export interface TripRecord {
  id: string;
  startTime: number;
  endTime: number;
  startStationId: string;
  endStationId: string;
  bikeId: string;
  duration: number;
  distance: number;
  weather: string;
}

export interface DispatchRecord {
  id: string;
  createTime: number;
  executeTime: number;
  fromStationId: string;
  toStationId: string;
  bikeCount: number;
  operator: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  effectScore?: number;
}

export interface Alert {
  id: string;
  stationId: string;
  stationName?: string;
  type: 'shortage' | 'overflow' | 'maintenance_timeout';
  level: 'low' | 'medium' | 'high';
  message: string;
  createTime: number;
}

export interface EtlStatus {
  source: string;
  lastUpdate: number;
  status: 'success' | 'failed' | 'running';
  recordCount: number;
  missingFields: string[];
  errorMessage?: string;
}

export interface FilterCondition {
  id?: string;
  name?: string;
  timeRange: [number, number];
  areas: string[];
  stationIds: string[];
  bikeStatus: ('available' | 'maintenance' | 'all')[];
  weatherTypes: string[];
}

export interface KPIData {
  todayTrips: number;
  activeBikes: number;
  availableBikes: number;
  maintenanceBikes: number;
  dispatchCount: number;
  alertCount: number;
  tripGrowth: number;
  availabilityRate: number;
}

export interface ODRoute {
  startArea: string;
  endArea: string;
  count: number;
  avgDuration: number;
}

export interface HourlyData {
  hour: number;
  trips: number;
  isWeekend?: boolean;
}

export interface ForecastPoint {
  time: number;
  value: number;
  lower: number;
  upper: number;
  isActual: boolean;
  anomaly?: string;
}

export interface WeatherImpact {
  type: string;
  avgTrips: number;
  impactFactor: number;
}

export interface MetricConfig {
  availableInventory: {
    formula: string;
    description: string;
  };
  peakHours: {
    morning: [number, number];
    evening: [number, number];
    description: string;
  };
  alertThresholds: {
    shortage: number;
    overflow: number;
    description: string;
  };
  serviceLevel: {
    formula: string;
    thresholds: {
      good: number;
      warning: number;
      critical: number;
    };
  };
}

export interface StationTrend {
  timestamp: number;
  availableBikes: number;
  incomingTrips: number;
  outgoingTrips: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId?: string;
  etlInfo?: {
    updateTime: number;
    dataVersion: string;
    warnings: string[];
  };
}

export interface ExportTask {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: number;
  downloadUrl?: string;
}
