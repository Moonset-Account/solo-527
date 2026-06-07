export interface FilterParams {
  projectIds?: string[];
  consultantIds?: string[];
  channelIds?: string[];
  customerStage?: string;
  months?: string[];
}

export interface FunnelStage {
  name: string;
  count: number;
  rate: number;
  prevRate: number;
}

export interface FunnelResponse {
  stages: FunnelStage[];
}

export interface ChannelItem {
  id: string;
  name: string;
  conversionRate: number;
  visitRate: number;
  dealRate: number;
  rank: number;
  prevRank: number;
}

export interface ChannelQualityResponse {
  channels: ChannelItem[];
}

export interface ConsultantItem {
  id: string;
  name: string;
  totalCustomers: number;
  stageDistribution: Record<string, number>;
  conversionRate: number;
}

export interface ConsultantLoadResponse {
  consultants: ConsultantItem[];
}

export interface FollowUpMonthly {
  month: string;
  followUpRate: number;
  avgIntervalDays: number;
}

export interface IntervalDistribution {
  range: string;
  count: number;
}

export interface CategoryBreakdown {
  category: string;
  followUpRate: number;
  patientCount: number;
}

export interface FollowUpTrendResponse {
  monthly: FollowUpMonthly[];
  intervalDistribution: IntervalDistribution[];
  categoryBreakdown: CategoryBreakdown[];
}

export type AnomalyLevel = 'critical' | 'warning' | 'info';

export interface Anomaly {
  id: string;
  level: AnomalyLevel;
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  relatedView: ViewPerspective;
  relatedFilter: FilterParams;
}

export interface AnomalySummaryResponse {
  anomalies: Anomaly[];
}

export type ExportStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type ExportFormat = 'csv' | 'xlsx';

export interface ExportTask {
  id: string;
  viewType: string;
  filters: FilterParams;
  format: ExportFormat;
  status: ExportStatus;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

export type ViewPerspective = 'project' | 'consultant' | 'channel' | 'stage' | 'month';

export interface FilterOption {
  id: string;
  name: string;
}
