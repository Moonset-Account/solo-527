export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface MembershipPlan {
  id: number;
  name: string;
  description?: string;
  price: string;
  durationDays: number;
  features: Record<string, any>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Subscription {
  id: number;
  userId: number;
  planId: number;
  startDate: string;
  endDate: string;
  status: string;
  autoRenew: boolean;
  owner?: string;
  renewCount: number;
  canceledAt?: string;
  cancelReason?: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  planName?: string;
  planPrice?: string;
  planFeatures?: Record<string, any>;
}

export interface SubscriptionListResponse {
  items: Subscription[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SubscriptionDetailResponse {
  subscription: Subscription;
  renewOrders: Order[];
}

export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  subscriptionId?: number;
  amount: string;
  status: string;
  paidAt?: string;
  owner?: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrderNode {
  id: number;
  name: string;
  code: string;
  description?: string;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface OrderNodeLog {
  id: number;
  orderId: number;
  nodeId: number;
  status: string;
  operator?: string;
  note?: string;
  executedAt?: string;
  createdAt: string;
  nodeName?: string;
  nodeCode?: string;
}

export interface Material {
  id: number;
  name: string;
  type: string;
  licenseType: string;
  fee: string;
  owner?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MaterialListResponse {
  items: Material[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MaterialLicense {
  id: number;
  materialId: number;
  userId: number;
  orderId?: number;
  startDate: string;
  endDate?: string;
  status: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
}

export interface MaterialLicenseListResponse {
  items: MaterialLicense[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RevenueCostStats {
  revenue: {
    total: string;
    count: number;
    byType: { type: string; amount: string }[];
  };
  cost: {
    total: string;
    count: number;
    byType: { type: string; amount: string }[];
  };
  profit: number;
  byDate?: { date: string; revenue: string; cost: string; profit: number }[];
  byOwner?: { owner: string; revenue: string; cost: string; profit: number; revenueCount: number; costCount: number }[];
}

export interface RetentionStats {
  total: number;
  active: number;
  renewed: number;
  activeRate: number;
  renewalRate: number;
  byPlan: {
    planId: number;
    planName: string;
    total: number;
    active: number;
  }[];
  byDate?: { date: string; total: number; active: number; renewed: number }[];
  byOwner?: { owner: string; total: number; active: number; renewed: number; activeRate: number; renewalRate: number }[];
}

export interface MembersStats {
  total: number;
  byRole: { role: string; count: number }[];
}

export interface Exception {
  id: number;
  category: string;
  title: string;
  description?: string;
  relatedOrderId?: number;
  delayDays: number;
  priority: string;
  status: string;
  assignee?: string;
  closer?: string;
  closeReason?: string;
  resultSummary?: string;
  resultNote?: string;
  reopenedFrom?: number;
  originalExceptionId?: number;
  originalException?: Exception;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  orderNo?: string;
  orderAmount?: string;
}

export interface ExceptionLog {
  id: number;
  exceptionId: number;
  action: string;
  operator?: string;
  detail?: Record<string, any>;
  createdAt: string;
}

export interface ExceptionListResponse {
  items: Exception[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ExceptionSummary {
  id: number;
  title: string;
  status: string;
  createdAt: string;
}

export interface ExceptionDetailResponse {
  exception: Exception;
  logs: ExceptionLog[];
  sourceException: ExceptionSummary | null;
  reopenedTo: ExceptionSummary[];
}

export interface Feature {
  id: number;
  featureKey: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface FeatureListResponse {
  features: Feature[];
}

export interface FeatureDetailResponse {
  feature: Feature;
}

export interface Rule {
  id: number;
  name: string;
  category: string;
  version: string;
  content: Record<string, any>;
  description?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  activatedAt?: string;
}

export interface RuleListResponse {
  items: Rule[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PodcastContent {
  id: number;
  title: string;
  description?: string;
  audioUrl?: string;
  isMemberOnly: boolean;
  publishDate: string;
  createdAt: string;
}

export interface PodcastContentListResponse {
  items: PodcastContent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PodcastContentDetailResponse {
  content: PodcastContent;
}

export interface AuthMeResponse {
  user: User;
  activeSubscription?: Subscription;
  membershipStatus: 'none' | 'active' | 'expired';
}

export interface CreateOrderResponse {
  subscription: Subscription;
  order: Order;
  plan: MembershipPlan;
}
