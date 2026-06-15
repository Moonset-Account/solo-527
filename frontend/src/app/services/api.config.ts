export const API_CONFIG = {
  baseUrl: 'http://localhost:3002/api/v1',
};

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface Bill {
  id: string;
  customerId: string;
  subscriptionId: string;
  billNumber: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: string;
  overdueDays: number;
  lateFee: number;
  interestRate: number;
  description: string;
  customer?: { name: string; email: string; phone: string };
  subscription?: { planName: string };
  statusHistory?: StatusHistory[];
  collectionRecords?: CollectionRecord[];
  invoices?: any[];
  attachments?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistory {
  id: string;
  billId: string;
  fromStatus: string;
  toStatus: string;
  reason: string;
  changedFields: any;
  createdAt: string;
  createdBy: string;
}

export interface CollectionRhythm {
  id: string;
  name: string;
  description: string;
  daysOverdue: number;
  severity: string;
  channel: string;
  template: string;
  subject: string;
  isActive: boolean;
  priority: number;
  escalationRules: any[];
  conditions: any;
  createdAt: string;
}

export interface CollectionRecord {
  id: string;
  billId: string;
  rhythmId: string;
  status: string;
  severity: string;
  channel: string;
  customerResponse: string;
  contactDate: string;
  scheduledDate: string;
  promisedPaymentDate: string;
  promisedAmount: number;
  notes: string;
  content: string;
  conversationRecord: string;
  followUpActions: any[];
  bill?: Bill;
  rhythm?: CollectionRhythm;
  createdAt: string;
}

export interface Reconciliation {
  id: string;
  period: string;
  periodStartDate: string;
  periodEndDate: string;
  status: string;
  systemBillsTotal: number;
  bankDepositsTotal: number;
  totalVariance: number;
  reconciledVariance: number;
  unreconciledVariance: number;
  totalBills: number;
  matchedBills: number;
  unmatchedBills: number;
  pendingBills: number;
  matchedItems: any[];
  unmatchedItems: any[];
  varianceBreakdown: any[];
  linkedRecords: any[];
  notes: string;
  createdAt: string;
}

export interface CashForecast {
  id: string;
  forecastPeriod: string;
  forecastDate: string;
  openingBalance: number;
  expectedReceivables: number;
  expectedPayables: number;
  otherIncome: number;
  otherExpenses: number;
  projectedClosingBalance: number;
  projectedCashGap: number;
  actualClosingBalance: number;
  actualCashGap: number;
  status: string;
  billBreakdown: any[];
  reconciliationNotes: any[];
  createdAt: string;
}

export interface ExportQueue {
  id: string;
  type: string;
  format: string;
  status: string;
  filters: any;
  columns: string[];
  fileName: string;
  storagePath: string;
  downloadUrl: string;
  fileSize: number;
  recordCount: number;
  startedAt: string;
  completedAt: string;
  errorMessage: string;
  exportSummary: {
    reconciliationVariance?: number;
    cashGap?: number;
    lastChangeDate?: string;
    totalAmount?: number;
    paidAmount?: number;
    overdueAmount?: number;
  };
  retryCount: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  billId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  sentDate?: string;
  paidDate?: string;
  paidAmount?: number;
  customerAddress?: string;
  subtotal: number;
  tax?: number;
  discount?: number;
  notes?: string;
  bill?: Bill;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  entityType: string;
  entityId: string;
  billId?: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  description?: string;
  isPublic: boolean;
  uploadUrl?: string;
  downloadUrl?: string;
  bill?: Bill;
  createdAt: string;
  createdBy?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  username?: string;
  description?: string;
  oldValues?: any;
  newValues?: any;
  changedFields?: string[];
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: string;
}
