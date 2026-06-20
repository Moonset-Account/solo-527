export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  SELECTING = 'selecting',
  SELECTED_CONFIRMED = 'selected_confirmed',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  REVISING = 'revising',
  COMPLETED = 'completed',
  REFUNDING = 'refunding',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum SatisfactionLevel {
  VERY_UNSATISFIED = 1,
  UNSATISFIED = 2,
  NEUTRAL = 3,
  SATISFIED = 4,
  VERY_SATISFIED = 5,
}

export enum PaymentMethod {
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
  BANK = 'bank',
  CREDIT = 'credit',
}
