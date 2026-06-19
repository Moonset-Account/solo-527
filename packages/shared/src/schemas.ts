import { z } from 'zod';
import type {
  SeatStatus,
  TrialStatus,
  ReminderLevel,
  ReminderStatus,
  PaymentCallbackStatus,
  RiskLevel,
  ExportTaskStatus,
} from './types';

export const SeatStatusSchema = z.enum(['active', 'inactive', 'trial', 'expired', 'suspended'] as const satisfies readonly SeatStatus[]);
export const TrialStatusSchema = z.enum(['not_started', 'in_progress', 'ended'] as const satisfies readonly TrialStatus[]);
export const ReminderLevelSchema = z.enum(['info', 'warning', 'critical', 'urgent'] as const satisfies readonly ReminderLevel[]);
export const ReminderStatusSchema = z.enum(['pending', 'sent', 'read', 'dismissed', 'expired'] as const satisfies readonly ReminderStatus[]);
export const PaymentCallbackStatusSchema = z.enum(['pending', 'success', 'failed', 'retrying', 'resolved'] as const satisfies readonly PaymentCallbackStatus[]);
export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical'] as const satisfies readonly RiskLevel[]);
export const ExportTaskStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed'] as const satisfies readonly ExportTaskStatus[]);

export const CreateSeatSchema = z.object({
  seatCode: z.string().min(2).max(50),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  status: SeatStatusSchema.default('active'),
  trialStatus: TrialStatusSchema.default('not_started'),
  trialStartDate: z.string().optional(),
  trialEndDate: z.string().optional(),
  quota: z.number().int().positive(),
  usedQuota: z.number().int().nonnegative().default(0),
  usageThreshold: z.number().int().min(0).max(100).default(80),
  warningThreshold: z.number().int().min(0).max(100).default(70),
  criticalThreshold: z.number().int().min(0).max(100).default(95),
  expireDate: z.string().optional(),
  ownerName: z.string().optional(),
  ownerEmail: z.string().email().optional(),
});

export const UpdateSeatSchema = z.object({
  customerName: z.string().min(1).max(200).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  status: SeatStatusSchema.optional(),
  trialStatus: TrialStatusSchema.optional(),
  trialStartDate: z.string().optional(),
  trialEndDate: z.string().optional(),
  quota: z.number().int().positive().optional(),
  usageThreshold: z.number().int().min(0).max(100).optional(),
  warningThreshold: z.number().int().min(0).max(100).optional(),
  criticalThreshold: z.number().int().min(0).max(100).optional(),
  expireDate: z.string().optional(),
  ownerName: z.string().optional(),
  ownerEmail: z.string().email().optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(500).default(20),
});

export const SeatQuerySchema = PaginationSchema.extend({
  status: SeatStatusSchema.optional(),
  trialStatus: TrialStatusSchema.optional(),
  keyword: z.string().optional(),
  ownerName: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'usedQuota', 'expireDate']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const UsageTrendQuerySchema = z.object({
  seatId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
});

export const CreateReminderSchema = z.object({
  seatId: z.string(),
  level: ReminderLevelSchema,
  type: z.enum(['quota', 'trial_expire', 'payment_failed', 'abnormal_usage']),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  threshold: z.number().optional(),
  currentUsage: z.number().optional(),
  recipientEmails: z.array(z.string().email()),
});

export const BatchSendReminderSchema = z.object({
  seatIds: z.array(z.string()).min(1),
  level: ReminderLevelSchema,
  type: z.enum(['quota', 'trial_expire', 'payment_failed', 'abnormal_usage']),
  name: z.string().min(1).max(200),
  titleTemplate: z.string().min(1),
  contentTemplate: z.string().min(1),
});

export const ReminderQuerySchema = PaginationSchema.extend({
  status: ReminderStatusSchema.optional(),
  level: ReminderLevelSchema.optional(),
  type: z.enum(['quota', 'trial_expire', 'payment_failed', 'abnormal_usage']).optional(),
  seatId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const UpdatePaymentCallbackSchema = z.object({
  callbackStatus: PaymentCallbackStatusSchema.optional(),
  remark: z.string().optional(),
  resolution: z.string().optional(),
  riskLevel: RiskLevelSchema.optional(),
  resolvedBy: z.string().optional(),
});

export const PaymentCallbackQuerySchema = PaginationSchema.extend({
  callbackStatus: PaymentCallbackStatusSchema.optional(),
  riskLevel: RiskLevelSchema.optional(),
  seatId: z.string().optional(),
  keyword: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const RetryPaymentCallbackSchema = z.object({
  remark: z.string().optional(),
});

export const AuditLogQuerySchema = PaginationSchema.extend({
  entityType: z.enum(['seat', 'reminder', 'payment', 'export']).optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const CreateExportTaskSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['seats', 'usage', 'reminders', 'payments', 'audit_logs', 'operations']),
  filters: z.record(z.unknown()).default({}),
});

export const ExportTaskQuerySchema = PaginationSchema.extend({
  status: ExportTaskStatusSchema.optional(),
  type: z.enum(['seats', 'usage', 'reminders', 'payments', 'audit_logs', 'operations']).optional(),
  createdBy: z.string().optional(),
});

export const OperationLogQuerySchema = PaginationSchema.extend({
  userId: z.string().optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
