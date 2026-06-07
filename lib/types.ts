export interface FilterParams {
  dateRange: { start: string; end: string };
  timeWindow: "today" | "7d" | "30d" | "custom";
  products: string[];
  stores: string[];
  reasons: string[];
  warehouses: string[];
  logistics: string[];
}

export interface SummaryData {
  totalReturns: number;
  returnRate: number;
  avgRefundCycle: number;
  avgServiceTime: number;
  repeatUserRate: number;
  sampleSize: number;
  trend: {
    returns: number;
    refundCycle: number;
    serviceTime: number;
  };
  validation: {
    dataConsistency: number;
    missingFields: number;
    lastUpdate: string;
  };
}

export interface ReasonNode {
  name: string;
  value: number;
  children?: ReasonNode[];
  path: string;
}

export interface CycleDistribution {
  bins: { range: string; count: number; avgDays: number }[];
  percentiles: { p50: number; p90: number; p99: number };
  stageBreakdown: {
    applyToQuality: number;
    qualityToRefund: number;
    total: number;
  };
}

export interface ProductRank {
  sku: string;
  name: string;
  category: string;
  returns: number;
  returnRate: number;
  topReason: string;
}

export interface ServiceMetrics {
  avgHandleTime: number;
  agentRanking: { agentId: string; avgTime: number; cases: number }[];
  distribution: { range: string; count: number }[];
}

export interface ReturnRecord {
  returnId: string;
  orderId: string;
  productName: string;
  sku: string;
  category: string;
  store: string;
  reason: string;
  reasonDetail: string;
  warehouse: string;
  logistics: string;
  applyTime: string;
  qualityTime: string;
  refundTime: string;
  refundCycle: number;
  serviceHandleTime: number;
  agentId: string;
  customerRemark: string;
  isRepeatUser: boolean;
  userHash: string;
  qualityResult: string;
}

export interface FilterOptions {
  products: { id: string; name: string; category: string }[];
  stores: { id: string; name: string }[];
  reasons: { id: string; name: string; category: string }[];
  warehouses: { id: string; name: string }[];
  logistics: { id: string; name: string }[];
}

export interface ExportData {
  records: ReturnRecord[];
  filters: FilterParams;
  dataDefinitions: { field: string; definition: string; source: string }[];
  generatedAt: string;
}
