export interface FilterState {
  entrance: string[];
  area: string[];
  timeRange: { start: Date; end: Date };
  ticketType: string[];
  activity: string[];
}

export interface HeatmapData {
  areaId: string;
  areaName: string;
  visitorCount: number;
  capacity: number;
  density: number;
  isClosed: boolean;
  coordinates: [number, number][];
}

export interface QueuePrediction {
  timestamp: Date;
  areaId: string;
  areaName: string;
  predictedWait: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  actualWait?: number;
  sampleSize: number;
  isAnomaly?: boolean;
}

export interface TicketAnalysis {
  ticketType: string;
  soldCount: number;
  enteredCount: number;
  entryRate: number;
  avgSpend: number;
  sampleSize: number;
}

export interface ConversionFunnel {
  stage: string;
  stageLabel: string;
  count: number;
  conversionRate: number;
  sampleSize: number;
}

export interface RawRecord {
  id: string;
  timestamp: Date;
  type: 'ticket' | 'gate' | 'parking' | 'consumption';
  data: Record<string, any>;
}

export interface DataQualityReport {
  missingValueRate: number;
  anomalyCount: number;
  totalSampleSize: number;
  lastUpdateTime: Date;
  caliberVersion: string;
  fieldMissingRates: Record<string, number>;
}

export interface ApiResponse<T> {
  data: T;
  filters: FilterState;
  sampleSize: number;
  queryTime: number;
  cacheHit: boolean;
}

export interface KPIData {
  realtimeVisitors: number;
  avgWaitTime: number;
  todayEntries: number;
  foodRevenue: number;
  visitorChange: number;
  waitChange: number;
  entryChange: number;
  revenueChange: number;
}

export interface DataCaliber {
  id: string;
  metricName: string;
  name: string;
  formula: string;
  source: string[];
  timeWindow: string;
  granularity: string;
  version: string;
}

export interface ClosedAreaNotice {
  areaId: string;
  areaName: string;
  reason: string;
  capacityDeducted: number;
  startTime: Date;
  endTime: Date;
}
