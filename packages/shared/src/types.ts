export type SeatStatus = 'active' | 'inactive' | 'trial' | 'expired' | 'suspended';

export type TrialStatus = 'not_started' | 'in_progress' | 'ended';

export type ReminderLevel = 'info' | 'warning' | 'critical' | 'urgent';

export type ReminderStatus = 'pending' | 'sent' | 'read' | 'dismissed' | 'expired';

export type PaymentCallbackStatus = 'pending' | 'success' | 'failed' | 'retrying' | 'resolved';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ExportTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type OperationAction =
  | 'seat.create'
  | 'seat.update'
  | 'seat.status_change'
  | 'seat.threshold_update'
  | 'usage.sync'
  | 'reminder.send'
  | 'reminder.batch_send'
  | 'payment.callback'
  | 'payment.callback_retry'
  | 'payment.callback_resolve'
  | 'export.create'
  | 'export.download'
  | 'user.login'
  | 'user.logout';

export interface Seat {
  id: string;
  seatCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: SeatStatus;
  trialStatus: TrialStatus;
  trialStartDate?: string;
  trialEndDate?: string;
  quota: number;
  usedQuota: number;
  usageThreshold: number;
  warningThreshold: number;
  criticalThreshold: number;
  expireDate?: string;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  apiKeys: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecord {
  id: string;
  seatId: string;
  seatCode: string;
  timestamp: string;
  apiCalls: number;
  errorCount: number;
  avgLatency: number;
  endpoint?: string;
  statusCode?: number;
  rawData?: Record<string, unknown>;
}

export interface UsageTrendPoint {
  date: string;
  apiCalls: number;
  errorCount: number;
  avgLatency: number;
}

export interface Reminder {
  id: string;
  seatId: string;
  seatCode: string;
  customerName: string;
  level: ReminderLevel;
  status: ReminderStatus;
  type: 'quota' | 'trial_expire' | 'payment_failed' | 'abnormal_usage';
  title: string;
  content: string;
  threshold?: number;
  currentUsage?: number;
  recipientEmails: string[];
  sentAt?: string;
  readAt?: string;
  dismissedAt?: string;
  createdAt: string;
}

export interface ReminderBatch {
  id: string;
  name: string;
  level: ReminderLevel;
  type: Reminder['type'];
  seatIds: string[];
  totalCount: number;
  successCount: number;
  failedCount: number;
  templateId?: string;
  createdAt: string;
  createdBy: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface PaymentCallback {
  id: string;
  seatId: string;
  seatCode: string;
  customerName: string;
  transactionId: string;
  amount: number;
  currency: string;
  callbackStatus: PaymentCallbackStatus;
  rawPayload: Record<string, unknown>;
  errorMessage?: string;
  retryCount: number;
  lastRetryAt?: string;
  remark?: string;
  resolution?: string;
  riskLevel: RiskLevel;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  entityType: 'seat' | 'reminder' | 'payment' | 'export';
  entityId: string;
  action: OperationAction;
  fieldName?: string;
  oldValue?: unknown;
  newValue?: unknown;
  operatorId?: string;
  operatorName: string;
  remark?: string;
  createdAt: string;
}

export interface OperationLog {
  id: string;
  userId: string;
  userName: string;
  action: OperationAction;
  targetType: string;
  targetId?: string;
  detail: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ExportTask {
  id: string;
  name: string;
  type: 'seats' | 'usage' | 'reminders' | 'payments' | 'audit_logs' | 'operations';
  status: ExportTaskStatus;
  filters: Record<string, unknown>;
  totalRows: number;
  exportedRows: number;
  filePath?: string;
  fileSize?: number;
  errorMessage?: string;
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  expiredAt: string;
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

export interface RiskStatistics {
  totalFailedCallbacks: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  unresolvedCount: number;
  avgResolutionTimeHours?: number;
}

export interface SeatChangeSnapshot {
  status?: { before: SeatStatus; after: SeatStatus };
  trialStatus?: { before: TrialStatus; after: TrialStatus };
  quota?: { before: number; after: number };
  usageThreshold?: { before: number; after: number };
  warningThreshold?: { before: number; after: number };
  criticalThreshold?: { before: number; after: number };
  expireDate?: { before?: string; after?: string };
}

export * from './schemas';
