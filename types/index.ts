export interface User {
  id: string
  username: string
  name: string
  email?: string
  roleId: string
  role?: Role
  avatarUrl?: string
  createdAt: string
}

export interface Role {
  id: string
  name: string
  description?: string
}

export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'custom'

export interface MetricsOverview {
  salesAmount: number
  orderCount: number
  avgOrderValue: number
  grossMargin: number
  salesAmountYoY: number
  orderCountYoY: number
  avgOrderValueYoY: number
  grossMarginYoY: number
  salesAmountMoM: number
  orderCountMoM: number
  avgOrderValueMoM: number
  grossMarginMoM: number
}

export interface TrendPoint {
  date: string
  value: number
}

export interface MetricsTrend {
  current: TrendPoint[]
  previous?: TrendPoint[]
  unit: string
}

export type Priority = 'high' | 'medium' | 'low'
export type FluctuationStatus = 'pending' | 'processing' | 'closed'
export type FluctuationSource = 'metric_monitor' | 'api_error' | 'manual'

export interface Fluctuation {
  id: string
  title: string
  description?: string
  readableReason: string
  metricId?: string
  metric?: string
  currentValue?: number
  expectedValue?: number
  deviation?: number
  priority: Priority
  status: FluctuationStatus
  assigneeId?: string
  assigneeName?: string
  deadline?: string
  source: FluctuationSource
  detectedAt: string
  closedAt?: string
  resolution?: string
}

export interface AlertOverview {
  pendingCount: number
  todayNewCount: number
  highPriorityCount: number
  avgProcessingHours: number
}

export interface PermissionApplication {
  id: string
  applicantId: string
  applicantName: string
  permissionType: string
  datasetId?: string
  datasetName?: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  approverId?: string
  approverName?: string
  approvalComment?: string
  approvedAt?: string
}

export interface DataMaskingConfig {
  id: string
  fieldName: string
  displayName: string
  maskType: 'none' | 'partial' | 'full'
  roleConfig?: Record<string, string>
}

export interface Dataset {
  id: string
  name: string
  description?: string
  businessLine?: string
  ownerId: string
  ownerName?: string
  createdAt: string
}

export interface TodoItem {
  id: string
  type: 'alert' | 'approval' | 'summary'
  refId: string
  title: string
  description?: string
  priority: Priority
  status: 'pending' | 'processing' | 'done'
  assigneeId?: string
  assigneeName?: string
  deadline?: string
  createdAt: string
}

export interface TodoGroup {
  assigneeId: string
  assigneeName: string
  count: number
  items: TodoItem[]
}

export interface SummaryPush {
  id: string
  name: string
  type: 'daily' | 'weekly'
  metricIds: string[]
  frequency: string
  userId: string
  enabled: boolean
  createdAt: string
}

export interface AlertRule {
  id: string
  metricId: string
  metricName?: string
  ruleType: string
  thresholdConfig: Record<string, any>
  notificationType: string
  assigneeId?: string
  assigneeName?: string
  enabled: boolean
  createdAt: string
}

export interface ApiErrorLog {
  id: string
  endpoint: string
  method: string
  statusCode: number
  errorMessage: string
  timestamp: string
  notified: boolean
}

export interface MonthlyReport {
  month: string
  totalSales: number
  totalOrders: number
  avgMargin: number
  fluctuationCount: number
  closedFluctuations: number
  avgProcessingHours: number
  apiErrorFluctuationCount: number
  apiErrorClosedCount: number
  apiErrorByEndpoint: { endpoint: string; count: number }[]
  fluctuationByCategory: { name: string; value: number }[]
  processingTimeDistribution: { name: string; value: number }[]
}

export interface FluctuationLog {
  id: string
  fluctuationId: string
  action: string
  operatorId?: string
  operatorName?: string
  remark?: string
  createdAt: string
}
