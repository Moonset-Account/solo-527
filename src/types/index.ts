import type {
  UserRole,
  MetricCategory,
  MetricStatus,
  TrendDirection,
  AnomalySeverity,
  AnomalyStatus,
  RootCauseCategory,
  AlertType,
  AlertOperator,
  DetectionAlgorithm,
  NotificationChannel,
  ApprovalStatus,
  DeliveryStatus,
  MilestoneStatus,
  EntityType,
} from "@prisma/client";

export interface Metric {
  id: string;
  name: string;
  code: string;
  description: string | null;
  category: MetricCategory;
  unit: string;
  currentValue: number;
  previousValue: number;
  changeRate: number;
  trend: TrendDirection;
  status: MetricStatus;
  dimensions: DimensionConfig[];
  alertRules: AlertRule[];
  subscriptions: Subscription[];
  updatedAt: Date;
}

export interface DimensionConfig {
  id: string;
  name: string;
  key: string;
  values: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface AlertRule {
  id: string;
  metricId: string;
  name: string;
  type: AlertType;
  operator: AlertOperator;
  threshold: number;
  thresholdMin: number | null;
  thresholdMax: number | null;
  detectionAlgorithm: DetectionAlgorithm;
  notificationChannels: NotificationChannel[];
  notifyUsers: string[];
  silentPeriodStart: string | null;
  silentPeriodEnd: string | null;
  isEnabled: boolean;
}

export interface Alert {
  id: string;
  alertRuleId: string;
  anomalyId: string | null;
  message: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  triggeredAt: Date;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  resolvedAt: Date | null;
}

export interface Subscription {
  id: string;
  metricId: string;
  name: string;
  dimensions: Record<string, string[]> | null;
  channels: NotificationChannel[];
  subscribers: string[];
  schedule: {
    hour: number;
    minute: number;
    timezone: string;
  };
  templateId: string | null;
  isEnabled: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface Anomaly {
  id: string;
  metricId: string;
  metricName: string;
  detectedAt: Date;
  severity: AnomalySeverity;
  actualValue: number;
  expectedValue: number;
  deviation: number;
  deviationPercent: number;
  status: AnomalyStatus;
  rootCause: string | null;
  rootCauseCategory: RootCauseCategory | null;
  impactAssessment: string | null;
  resolution: string | null;
  assignee: string | null;
  assigneeName: string | null;
  resolvedAt: Date | null;
  relatedAnomalies: string[] | null;
  createdAt: Date;
}

export interface MetricDefinition {
  id: string;
  metricId: string;
  version: number;
  name: string;
  description: string | null;
  calculationLogic: string;
  sqlQuery: string | null;
  dataSource: string | null;
  businessOwner: string | null;
  businessOwnerName: string | null;
  technicalOwner: string | null;
  technicalOwnerName: string | null;
  changeReason: string;
  changeImpact: string | null;
  approvalStatus: ApprovalStatus;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: Date | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  isCurrent: boolean;
}

export interface DeliveryProject {
  id: string;
  name: string;
  description: string | null;
  owner: string;
  ownerName: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: DeliveryStatus;
  milestones: Milestone[];
  remarks: ProgressRemark[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: Date;
  completedAt: Date | null;
  status: MilestoneStatus;
  sortOrder: number;
}

export interface ProgressRemark {
  id: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  progressSnapshot: number;
}

export interface ReviewReport {
  id: string;
  month: string;
  metricsSummary: {
    metricId: string;
    metricName: string;
    targetValue: number;
    actualValue: number;
    completionRate: number;
    anomalyCount: number;
  }[];
  anomaliesSummary: {
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    avgResolutionTime: number;
  };
  deliverySummary: {
    totalProjects: number;
    completedProjects: number;
    onTimeRate: number;
  };
  generatedBy: string;
  generatedByName: string;
  generatedAt: Date;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: EntityType;
  entityId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  remark: string;
  operatorId: string;
  operatorName: string;
  createdAt: Date;
}

export interface MetricDataPoint {
  date: string;
  value: number;
  dimensions?: Record<string, string>;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
}
