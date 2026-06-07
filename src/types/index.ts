export interface FilterState {
  entrance: string[];
  area: string[];
  timeRange: [Date, Date] | null;
  ticketType: string[];
  activity: string[];
}

export interface HeatmapData {
  areaId: string;
  areaName: string;
  visitorCount: number;
  density: number;
  avgQueueTime: number;
  capacity: number;
  isClosed: boolean;
  coordinates: [number, number][];
}

export interface QueuePrediction {
  time: string;
  actualCount: number | null;
  predictedCount: number | null;
  confidenceLower: number | null;
  confidenceUpper: number | null;
  avgWaitTime: number;
  isAnomaly: boolean;
  isHistory: boolean;
}

export interface TicketAnalysis {
  ticketType: string;
  soldCount: number;
  enteredCount: number;
  entryRate: number;
  avgPrice: number;
  totalRevenue: number;
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  rate: number;
}

export interface RawRecord {
  id: string;
  source: 'ticket' | 'gate' | 'parking' | 'consumption' | 'weather' | 'show';
  time: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
}

export interface DataQualityReport {
  missingRate: number;
  outlierCount: number;
  sampleSize: number;
  updatedAt: string;
  fieldStats: Array<{
    fieldName: string;
    completeness: number;
    hasOutliers: boolean;
  }>;
}

export interface ClosedAreaNotice {
  areaId: string;
  areaName: string;
  reason: string;
  capacityReduced: number;
  startTime: string;
  endTime: string;
}

export interface KPIData {
  realtimeVisitor: number;
  totalCapacity: number;
  occupancyRate: number;
  avgWaitTime: number;
  ticketSales: number;
  totalRevenue: number;
  parkingOccupancy: number;
  parkingCapacity: number;
  parkingRate: number;
  updatedAt: string;
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
