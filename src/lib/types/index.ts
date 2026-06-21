export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyStatus = 'open' | 'investigating' | 'resolved' | 'ignored';
export type SummaryStatus = 'draft' | 'published';
export type PushChannel = 'email' | 'wework' | 'dingtalk';
export type PushStatus = 'pending' | 'sent' | 'failed';
export type ExportType = 'metrics' | 'anomalies' | 'summary';
export type ExportFormat = 'csv' | 'excel';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ErrorType = 'api' | 'system' | 'push';
export type ErrorSeverity = 'warning' | 'error' | 'critical';

export interface MetricDefinition {
  id: string;
  key: string;
  name: string;
  category: string;
  unit: string;
  formula?: string;
  dataSource?: string;
  updateFrequency: string;
  description?: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricData {
  id: string;
  date: string;
  metricKey: string;
  value: number;
  prevValue?: number;
  wow?: number;
  dod?: number;
  channel?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnomalyRecord {
  id: string;
  date: string;
  metricKey: string;
  metricName: string;
  value: number;
  expectedValue: number;
  deviation: number;
  deviationPercent: number;
  severity: Severity;
  status: AnomalyStatus;
  channel?: string;
  description?: string;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AnomalyNote {
  id: string;
  anomalyId: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailySummary {
  id: string;
  date: string;
  content: string;
  highlights?: string[];
  lows?: string[];
  generatedBy?: string;
  generatedAt: string;
  updatedAt: string;
  status: SummaryStatus;
}

export interface PushRecord {
  id: string;
  summaryId?: string;
  channel: PushChannel;
  recipients: string[];
  status: PushStatus;
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface ExportTask {
  id: string;
  type: ExportType;
  format: ExportFormat;
  status: ExportStatus;
  params?: Record<string, any>;
  fileUrl?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface OperationLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeData?: any;
  afterData?: any;
  operator: string;
  ip?: string;
  createdAt: string;
}

export interface ErrorLog {
  id: string;
  type: ErrorType;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  errorMessage: string;
  stackTrace?: string;
  severity: ErrorSeverity;
  alertSent: boolean;
  alertSentAt?: string;
  createdAt: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MetricQueryParams {
  dateFrom?: string;
  dateTo?: string;
  metricKey?: string;
  channel?: string;
  page?: number;
  pageSize?: number;
}

export interface AnomalyQueryParams {
  dateFrom?: string;
  dateTo?: string;
  severity?: Severity;
  status?: AnomalyStatus;
  metricKey?: string;
  page?: number;
  pageSize?: number;
}
