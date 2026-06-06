export type UserRole = 'admin' | 'manager' | 'product' | 'sales' | 'finance';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  createdAt?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export type DemandStatus = 'pending' | 'quoting' | 'quoted' | 'confirmed' | 'cancelled';

export interface Demand {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  travelStart: string;
  travelEnd: string;
  days: number;
  peopleCount: number;
  adultCount: number;
  childCount: number;
  destinations?: string;
  specialRequirements?: string;
  status: DemandStatus;
  assigneeId?: string;
  assignee?: User;
  quotes?: Quote[];
  createdAt: string;
  updatedAt: string;
}

export type QuoteStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent';

export interface Quote {
  id: string;
  demandId?: string;
  demand?: Demand;
  version: number;
  status: QuoteStatus;
  totalCost: number;
  totalPrice: number;
  profitMargin: number;
  requiresManagerApproval: boolean;
  createdById?: string;
  createdBy?: User;
  items: QuoteItem[];
  paymentNodes: PaymentNode[];
  createdAt: string;
}

export type QuoteItemType = 'hotel' | 'vehicle' | 'ticket' | 'service' | 'other';

export interface QuoteItem {
  id?: string;
  type: QuoteItemType;
  name: string;
  description?: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  supplierId?: string;
  supplier?: Supplier;
}

export type SupplierType = 'hotel' | 'vehicle' | 'ticket' | 'guide';

export interface Supplier {
  id: string;
  type: SupplierType;
  name: string;
  contactPerson?: string;
  contactPhone?: string;
  address?: string;
  rating: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type ContractStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'signed';

export interface Contract {
  id: string;
  quoteId?: string;
  quote?: Quote;
  status: ContractStatus;
  signedFileUrl?: string;
  approvalLogs?: ApprovalLog[];
  createdAt: string;
}

export type ApprovalAction = 'submit' | 'approve' | 'reject';

export interface ApprovalLog {
  id: string;
  contractId?: string;
  approverId?: string;
  approver?: User;
  action: ApprovalAction;
  comment?: string;
  createdAt: string;
}

export type PaymentNodeStatus = 'pending' | 'paid' | 'overdue';

export interface PaymentNode {
  id?: string;
  name: string;
  percentage: number;
  amount: number;
  dueDate?: string;
  status: PaymentNodeStatus;
  paidAt?: string;
}

export interface DashboardStats {
  totalDemands: number;
  pendingDemands: number;
  quotingDemands: number;
  confirmedDemands: number;
  totalQuotes: number;
  pendingApprovalQuotes: number;
  approvedQuotes: number;
  totalContracts: number;
  pendingContracts: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  overdueTasks: Demand[];
  recentActivities: any[];
}

export interface ResourceUtilization {
  userId: string;
  userName: string;
  assignedCount: number;
  completedCount: number;
  utilizationRate: number;
}

export interface ProfitReport {
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    overallMargin: number;
    quoteCount: number;
  };
  details: Array<{
    quoteId: string;
    customerName: string;
    createdByName: string;
    revenue: number;
    cost: number;
    profit: number;
    profitMargin: number;
    createdAt: string;
  }>;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  quoteCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
