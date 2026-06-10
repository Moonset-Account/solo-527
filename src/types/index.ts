export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: 'MONTHLY' | 'YEARLY';
  seatLimit: number;
  trialDays: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  features: string[];
  sortOrder: number;
  isPopular: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan?: Plan;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'UNPAID';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart: string | null;
  trialEnd: string | null;
  trialUsed: boolean;
  seatsIncluded: number;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId: string | null;
  amount: number;
  paidAmount: number;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'UNCOLLECTIBLE' | 'VOID' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  dueDate: string | null;
  paidAt: string | null;
  billingPeriod: string | null;
  invoiceNumber: string;
  currency: string;
  description: string | null;
  items?: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  amount: number;
  quantity: number;
  type: string;
  unitPrice: number | null;
  createdAt: string;
}

export interface Seat {
  id: string;
  userId: string;
  subscriptionId: string;
  email: string;
  name: string | null;
  role: string | null;
  status: string;
  invitedAt: string;
  activatedAt: string | null;
  lastActiveAt: string | null;
}

export interface Refund {
  id: string;
  invoiceId: string;
  userId: string;
  amount: number;
  reasonCode: string;
  reason: string;
  note: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'FAILED';
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeLog {
  id: string;
  subscriptionId: string;
  type: string;
  oldPlanId: string | null;
  newPlanId: string | null;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  result: string | null;
  changedBy: string | null;
  createdAt: string;
}

export interface Trial {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CONVERTED' | 'CANCELLED';
  converted: boolean;
  convertedAt: string | null;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageThreshold {
  id: string;
  planId: string;
  metric: string;
  threshold: number;
  warningPercent: number;
  notificationType: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingRule {
  id: string;
  key: string;
  value: string;
  type: string;
  isEnabled: boolean;
  note: string | null;
  updatedAt: string;
  createdAt: string;
}
