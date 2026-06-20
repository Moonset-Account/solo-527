export enum ExceptionType {
  REFUND = 'refund',
  DELIVERY_DELAY = 'delivery_delay',
  QUALITY_DISPUTE = 'quality_dispute',
  COPYRIGHT = 'copyright',
  LICENSE_DISPUTE = 'license_dispute',
  PAYMENT_ERROR = 'payment_error',
  OTHER = 'other',
}

export enum ExceptionStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  PROCESSING = 'processing',
  PENDING_REVIEW = 'pending_review',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum ExceptionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RefundStatus {
  NONE = 'none',
  REQUESTED = 'requested',
  APPROVING = 'approving',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PARTIAL = 'partial',
  REFUNDING = 'refunding',
  REFUNDED = 'refunded',
}
