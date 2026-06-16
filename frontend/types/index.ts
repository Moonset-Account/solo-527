export enum ARStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  OTHER = 'other',
}

export enum PaymentStatus {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  FAILED = 'failed',
}

export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISPUTED = 'disputed',
}

export enum WriteoffStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum GapStatus {
  SAFE = 'safe',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum ReminderType {
  PAYMENT_DUE = 'payment_due',
  REFUND_PENDING = 'refund_pending',
  WRITEOFF_PENDING = 'writeoff_pending',
  ESCALATION = 'escalation',
}

export enum ReminderStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

export interface ARRecord {
  id: string
  customer_name: string
  customer_id: string
  amount: number
  currency: string
  due_date: string
  status: ARStatus
  responsible_person: string
  description: string | null
  subscription_id: string | null
  paid_amount: number
  created_at: string
  updated_at: string
}

export interface ARRecordSummary {
  customer_name: string
  total_amount: number
  paid_amount: number
  outstanding_amount: number
  status: string
}

export interface ARRecordListResponse {
  items: ARRecord[]
  total: number
  page: number
  page_size: number
}

export interface Payment {
  id: string
  ar_record_id: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  reference_number: string | null
  status: PaymentStatus
  operator: string
  created_at: string
  updated_at: string
}

export interface PaymentListResponse {
  items: Payment[]
  total: number
  page: number
  page_size: number
}

export interface Refund {
  id: string
  ar_record_id: string
  amount: number
  reason: string
  status: RefundStatus
  applicant: string
  reviewer: string | null
  review_note: string | null
  created_at: string
  updated_at: string
}

export interface RefundListResponse {
  items: Refund[]
  total: number
  page: number
  page_size: number
}

export interface Writeoff {
  id: string
  ar_record_id: string
  amount: number
  reason: string
  status: WriteoffStatus
  operator: string
  approver: string | null
  created_at: string
  updated_at: string
}

export interface WriteoffListResponse {
  items: Writeoff[]
  total: number
  page: number
  page_size: number
}

export interface CashGapForecast {
  id: string
  forecast_date: string
  period_start: string
  period_end: string
  expected_inflow: number
  expected_outflow: number
  gap_amount: number
  gap_status: GapStatus
  responsible_person: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CashGapForecastListResponse {
  items: CashGapForecast[]
  total: number
  page: number
  page_size: number
}

export interface Reminder {
  id: string
  ar_record_id: string | null
  type: ReminderType
  title: string
  message: string
  assigned_to: string
  status: ReminderStatus
  due_at: string
  escalated_at: string | null
  escalated_to: string | null
  created_at: string
  updated_at: string
}

export interface ReminderListResponse {
  items: Reminder[]
  total: number
  page: number
  page_size: number
}

export interface FilterParams {
  date_from: string | null
  date_to: string | null
  responsible_person: string | null
  status: string | null
  page: number
  page_size: number
}

export type ExportModule = 'ar_collection' | 'refund_dispute' | 'processing_record'
export type ExportFormat = 'xlsx' | 'csv'

export interface ExportParams {
  module: ExportModule
  format: ExportFormat
  filters: Record<string, any>
}
