export enum ARStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WRITEOFF = 'writeoff',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHECK = 'check',
  ELECTRONIC = 'electronic',
  OTHER = 'other',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed',
}

export enum WriteoffStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum GapStatus {
  FORECASTED = 'forecasted',
  ACTUAL = 'actual',
  RESOLVED = 'resolved',
}

export enum ReminderType {
  OVERDUE = 'overdue',
  PAYMENT_DUE = 'payment_due',
  CASH_GAP = 'cash_gap',
  REVIEW_NEEDED = 'review_needed',
}

export enum ReminderStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

export interface ARRecord {
  id: string
  customer_name: string
  invoice_number: string
  invoice_date: string
  due_date: string
  amount: number
  paid_amount: number
  remaining_amount: number
  status: ARStatus
  responsible_person: string
  contract_number: string
  notes: string
  created_at: string
  updated_at: string
}

export interface ARRecordSummary {
  total_amount: number
  total_paid: number
  total_remaining: number
  overdue_count: number
  overdue_amount: number
  by_status: Record<ARStatus, { count: number; amount: number }>
}

export interface ARRecordListResponse {
  items: ARRecord[]
  total: number
  page: number
  page_size: number
  summary?: ARRecordSummary
}

export interface Payment {
  id: string
  ar_record_id: string
  customer_name: string
  invoice_number: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  status: PaymentStatus
  reference_number: string
  notes: string
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
  customer_name: string
  invoice_number: string
  amount: number
  reason: string
  status: RefundStatus
  reviewed_by: string | null
  reviewed_at: string | null
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
  customer_name: string
  invoice_number: string
  amount: number
  reason: string
  status: WriteoffStatus
  approved_by: string | null
  approved_at: string | null
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
  date: string
  expected_inflow: number
  expected_outflow: number
  net_gap: number
  cumulative_gap: number
  status: GapStatus
  notes: string
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
  type: ReminderType
  title: string
  message: string
  related_id: string | null
  status: ReminderStatus
  acknowledged_by: string | null
  acknowledged_at: string | null
  resolved_by: string | null
  resolved_at: string | null
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

export interface ExportParams {
  module: string
  format: 'csv' | 'xlsx' | 'pdf'
  filters: Partial<FilterParams>
}
