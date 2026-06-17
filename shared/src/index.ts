export type UserRole = 'member' | 'ecommerce' | 'admin';

export interface MemberLevel {
  id: string;
  name: string;
  minGrowth: number;
  icon?: string;
  benefits?: string;
  sortOrder: number;
}

export interface Member {
  id: string;
  phone: string;
  nickname?: string;
  avatar?: string;
  points: number;
  levelId?: string;
  level?: MemberLevel;
  growthValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  pointsPrice: number;
  stock: number;
  soldCount: number;
  category?: string;
  requiredLevelId?: string;
  requiredLevel?: MemberLevel;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'redeemed' | 'cancelled' | 'expired';

export interface ExchangeOrder {
  id: string;
  orderNo: string;
  memberId: string;
  member?: Member;
  productId: string;
  product?: Product;
  quantity: number;
  totalPoints: number;
  status: OrderStatus;
  redeemCode?: string;
  redeemedAt?: string;
  createdAt: string;
}

export type PointTransactionType = 'earn' | 'spend' | 'adjust';

export interface PointTransaction {
  id: string;
  memberId: string;
  points: number;
  type: PointTransactionType;
  reason?: string;
  refId?: string;
  createdAt: string;
}

export type ReachTaskStatus = 'draft' | 'verifying' | 'verified' | 'executing' | 'completed' | 'failed';
export type ReachTaskType = 'sms' | 'push' | 'email';

export interface ReachTask {
  id: string;
  name: string;
  type: ReachTaskType;
  status: ReachTaskStatus;
  totalCount: number;
  successCount: number;
  failedCount: number;
  filterCriteria?: Record<string, any>;
  createdBy?: string;
  createdAt: string;
}

export type ReachLogStatus = 'success' | 'failed' | 'pending';

export interface ReachLog {
  id: string;
  taskId: string;
  memberId?: string;
  memberPhone?: string;
  member?: Member;
  status: ReachLogStatus;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  role: 'ecommerce' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: AdminUser;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FilterState {
  [key: string]: any;
}

export interface PointCostItem {
  dimension: string;
  label: string;
  orderCount: number;
  totalPoints: number;
  memberCount: number;
}

export interface PointCostSummary {
  totalOrders: number;
  totalPoints: number;
  totalMembers: number;
  avgPointsPerOrder: number;
}

export interface ExchangeTrendData {
  dates: string[];
  orders: number[];
  points: number[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
