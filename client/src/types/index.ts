export type UserRole = 'USER' | 'OP_ADMIN' | 'FIN_ADMIN' | 'SYS_ADMIN';

export type ApplicationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CLOSED_ABNORMAL';

export type LicenseType = 'TRIAL' | 'PAID';

export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export type TrialHandleResult = 'CONVERT' | 'CLOSE' | 'EXTEND';

export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type NotificationType = 'RENEWAL_REMINDER' | 'TRIAL_EXPIRING' | 'APPROVAL_RESULT';

export type NotificationStatus = 'PENDING' | 'SENT' | 'READ';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  createdAt: string;
}

export interface Plugin {
  id: number;
  name: string;
  code: string;
  description: string;
  icon: string;
  category: string;
  status: string;
  createdAt: string;
  plans?: PricingPlan[];
}

export interface PricingPlan {
  id: number;
  pluginId: number;
  name: string;
  code: string;
  description: string;
  seatCount: number;
  features: string[];
  billingCycle: BillingCycle;
  price: number;
  status: string;
  plugin?: { id: number; name: string; code: string };
  createdAt: string;
}

export interface Application {
  id: number;
  pluginId: number;
  planId: number;
  userId: number;
  applicantName: string;
  department: string;
  reason: string;
  status: ApplicationStatus;
  seatCount: number;
  trialDays: number;
  processingNote?: string;
  closeReason?: string;
  approvedBy?: number;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  plugin?: { id: number; name: string; icon: string };
  plan?: { id: number; name: string; price: number; billingCycle: BillingCycle };
  user?: { id: number; name: string; department: string };
  approver?: { id: number; name: string };
  license?: License;
}

export interface License {
  id: number;
  pluginId: number;
  userId: number;
  applicationId: number;
  planId: number;
  type: LicenseType;
  status: LicenseStatus;
  seatCount: number;
  usedSeats: number;
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  plugin?: { id: number; name: string; icon: string; category: string };
  plan?: { id: number; name: string; price: number; billingCycle: BillingCycle };
  user?: { id: number; name: string; department: string; email: string };
  application?: { id: number; reason: string };
  trialHandles?: TrialHandleRecord[];
  daysLeft?: number;
  trialStatus?: string;
  renewalStatus?: string;
  isExpiringSoon?: boolean;
  lastHandle?: TrialHandleRecord;
}

export interface TrialHandleRecord {
  id: number;
  licenseId: number;
  handlerId: number;
  result: TrialHandleResult;
  remark: string;
  extendDays: number;
  createdAt: string;
  handler?: { id: number; name: string };
}

export interface UsageRecord {
  id: number;
  licenseId: number;
  pluginId: number;
  date: string;
  usageCount: number;
  activeUsers: number;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UsageTrendData {
  summary: {
    totalUsage: number;
    totalActiveUsers: number;
    dateRange: { start: string; end: string };
  };
  overallData: Array<{ date: string; usageCount: number; activeUsers: number }>;
  pluginData: Array<{
    plugin: { id: number; name: string; icon: string };
    series: Array<{ date: string; value: number }>;
    total: number;
  }>;
}

export interface SeatUtilizationData {
  summary: {
    totalLicenses: number;
    totalSeats: number;
    totalUsed: number;
    overallUtilization: number;
    departmentCount: number;
  };
  departmentData: Array<{
    department: string;
    totalSeats: number;
    usedSeats: number;
    licenseCount: number;
    utilizationRate: number;
    plugins: Array<{
      pluginId: number;
      pluginName: string;
      totalSeats: number;
      usedSeats: number;
      utilizationRate: number;
    }>;
  }>;
}

export interface DepartmentSummaryData {
  summary: {
    totalDepartments: number;
    totalLicenses: number;
    totalMonthlyCost: number;
    period: string;
  };
  departmentData: Array<{
    department: string;
    licenseCount: number;
    totalSeats: number;
    usedSeats: number;
    monthlyCost: number;
    seatUtilization: number;
    plugins: Array<{
      pluginId: number;
      pluginName: string;
      category: string;
      licenseCount: number;
      totalSeats: number;
      usedSeats: number;
      monthlyCost: number;
      seatUtilization: number;
    }>;
  }>;
}

export interface Notification {
  id: number;
  licenseId: number;
  notifierId: number;
  receiverId: number;
  type: NotificationType;
  title: string;
  content: string;
  handleResult?: string;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
  license?: { id: number; plugin: { id: number; name: string }; user: { id: number; name: string; department: string } };
  notifier?: { id: number; name: string };
  receiver?: { id: number; name: string };
}
