export enum SettlementStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum SettlementType {
  NORMAL = 'normal',
  REFUND = 'refund',
  COMPENSATION = 'compensation',
  ADJUSTMENT = 'adjustment',
}
