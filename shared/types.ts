export interface FilterParams {
  storeIds?: string[];
  categoryIds?: string[];
  supplierIds?: string[];
  batchIds?: string[];
  startDate: string;
  endDate: string;
}

export type AnomalyType = 
  | 'high_loss' 
  | 'near_expiry' 
  | 'poor_promotion' 
  | 'weather_impact' 
  | 'low_traffic';

export type SeverityLevel = 'high' | 'medium' | 'low';

export interface Anomaly {
  id: string;
  type: AnomalyType;
  title: string;
  description: string;
  severity: SeverityLevel;
  metric: {
    value: number;
    unit: string;
    change: number;
  };
  filterContext: Partial<FilterParams>;
}

export interface OverviewSummary {
  totalLoss: number;
  lossRate: number;
  nearExpiryCount: number;
  promotionEffectiveness: number;
}

export interface OverviewResponse {
  anomalies: Anomaly[];
  summary: OverviewSummary;
}

export type FunnelStageType = 
  | 'received' 
  | 'sellable' 
  | 'near_expiry' 
  | 'promotion' 
  | 'written_off' 
  | 'returned';

export interface FunnelBatch {
  batchId: string;
  skuId: string;
  skuName: string;
  quantity: number;
  expiryDate: string;
}

export interface FunnelStage {
  stage: FunnelStageType;
  name: string;
  quantity: number;
  amount: number;
  conversionRate: number;
  batches: FunnelBatch[];
}

export interface FunnelResponse {
  stages: FunnelStage[];
  totalBatches: number;
}

export interface ParetoItem {
  id: string;
  name: string;
  lossAmount: number;
  lossQty: number;
  cumulativePercent: number;
}

export interface ParetoResponse {
  items: ParetoItem[];
  totalLossAmount: number;
}

export interface PromotionComparison {
  categoryId: string;
  categoryName: string;
  beforePeriod: {
    dailyAvgSales: number;
    dailyAvgLoss: number;
    nearExpiryRate: number;
  };
  duringPeriod: {
    dailyAvgSales: number;
    dailyAvgLoss: number;
    nearExpiryRate: number;
  };
  improvement: {
    salesChange: number;
    lossChange: number;
    expiryRateChange: number;
  };
}

export interface PromotionResponse {
  comparisons: PromotionComparison[];
}

export interface SupplierRanking {
  supplierId: string;
  supplierName: string;
  lossRate: number;
  onTimeDeliveryRate: number;
  qualityIssueRate: number;
  totalSupplyQty: number;
  compositeScore: number;
}

export interface SupplierResponse {
  rankings: SupplierRanking[];
}

export interface FilterOption {
  id: string;
  name: string;
}

export interface FilterOptionsResponse {
  stores: FilterOption[];
  categories: FilterOption[];
  suppliers: FilterOption[];
  batches: FilterOption[];
}

export interface ExportTaskRequest {
  filters: FilterParams;
  format: 'xlsx' | 'csv';
  includeCharts?: boolean;
}

export interface WeatherTrafficItem {
  date: string;
  weatherType: string;
  temperature: number;
  rainfall: number;
  customerCount: number;
  lossAmount: number;
  lossQty: number;
  conversionRate: number;
}

export interface WeatherTrafficResponse {
  items: WeatherTrafficItem[];
  correlation: {
    rainfallVsLoss: number;
    temperatureVsLoss: number;
    trafficVsLoss: number;
    weatherVsTraffic: number;
  };
}

export interface ExportTaskStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  createdAt: string;
  completedAt?: string;
  progress?: number;
}
