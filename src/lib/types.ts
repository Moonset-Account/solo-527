export type User = {
  id: string;
  email: string;
  name: string;
  role: 'host' | 'operator';
  avatarUrl: string | null;
  createdAt: string;
};

export type Brand = {
  id: string;
  name: string;
  hostId: string | null;
  createdAt: string;
};

export type Member = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

export type MemberSubscription = {
  id: string;
  memberId: string;
  memberName: string;
  brandId: string;
  brandName: string;
  planType: 'monthly' | 'quarterly' | 'yearly';
  materialAuthStatus: 'pending' | 'approved' | 'rejected';
  invoiceCycle: 'monthly' | 'quarterly' | 'yearly';
  subscriptionStatus: 'active' | 'expiring' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  createdAt: string;
};

export type TodoItem = {
  id: string;
  title: string;
  type: 'material_auth' | 'invoice_cycle' | 'subscription';
  priority: 'high' | 'medium' | 'low';
  materialAuthStatus?: 'pending' | 'approved' | 'rejected';
  invoiceCycle?: 'monthly' | 'quarterly' | 'yearly';
  subscriptionStatus?: 'active' | 'expiring' | 'expired' | 'cancelled';
  relatedBrandId?: string;
  relatedBrandName: string;
  relatedMemberId?: string;
  relatedMemberName?: string;
  dueDate: string;
  status: 'pending' | 'processing' | 'done';
  assigneeId: string;
  createdAt: string;
};

export type ExceptionRecord = {
  id: string;
  brandId: string;
  brandName: string;
  title: string;
  description: string | null;
  category: string;
  status: 'unconfirmed' | 'confirmed' | 'resolved';
  result: string | null;
  remark: string | null;
  hostId: string | null;
  hostName: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type Order = {
  id: string;
  orderNo: string;
  memberId: string;
  memberName: string;
  brandId: string;
  brandName: string;
  amount: string;
  status: 'pending' | 'paid' | 'delivering' | 'completed' | 'refunded';
  paidAt: string | null;
  createdAt: string;
  deliveryNodes: DeliveryNode[];
};

export type DeliveryNode = {
  id: string;
  orderId: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigneeId: string | null;
  assigneeName: string | null;
  completedAt: string | null;
  deadline: string;
  sortOrder: number;
};

export type RetentionAlert = {
  id: string;
  brandId: string;
  brandName: string;
  metric: string;
  currentValue: string;
  threshold: string;
  ownerId: string;
  ownerName: string;
  notifiedAt: string | null;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
};

export type ApiLog = {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  success: boolean;
  errorMessage: string | null;
  lastRetryAt: string | null;
  retryCount: number;
  requestedAt: string;
};
