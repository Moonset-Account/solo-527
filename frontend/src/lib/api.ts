import type {
  RevenueCostStats,
  RetentionStats,
  MembersStats,
  SubscriptionListResponse,
  SubscriptionDetailResponse,
  MaterialListResponse,
  MaterialLicenseListResponse,
  OrderListResponse,
  OrderNode,
  OrderNodeLog,
  MembershipPlan,
  Exception,
  ExceptionLog,
  ExceptionListResponse,
  ExceptionDetailResponse,
  Feature,
  FeatureListResponse,
  FeatureDetailResponse,
  Rule,
  RuleListResponse,
  PodcastContent,
  PodcastContentListResponse,
  PodcastContentDetailResponse,
  AuthMeResponse,
  CreateOrderResponse,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const statsApi = {
  getRevenueCost: (params?: {
    startDate?: string;
    endDate?: string;
    owner?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.owner) query.set('owner', params.owner);
    return request<RevenueCostStats>(`/stats/revenue-cost?${query.toString()}`);
  },

  getRetention: (params?: {
    startDate?: string;
    endDate?: string;
    owner?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.owner) query.set('owner', params.owner);
    return request<RetentionStats>(`/stats/retention?${query.toString()}`);
  },

  getMembers: (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return request<MembersStats>(`/stats/members?${query.toString()}`);
  },

  getOwners: () => {
    return request<{ owners: string[] }>('/stats/owners');
  },
};

export const subscriptionsApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    planId?: string;
    owner?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    if (params?.planId) query.set('planId', params.planId);
    if (params?.owner) query.set('owner', params.owner);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.search) query.set('search', params.search);
    return request<SubscriptionListResponse>(`/subscriptions?${query.toString()}`);
  },

  get: (id: number) =>
    request<SubscriptionDetailResponse>(`/subscriptions/${id}`),

  getRenewals: (id: number) =>
    request<{ renewals: any[] }>(`/subscriptions/${id}/renewals`),

  getPlans: () =>
    request<{ plans: MembershipPlan[] }>('/subscriptions/plans/list'),

  createOrder: (data: { planId: number; userId: number; owner?: string }) =>
    request<CreateOrderResponse>('/subscriptions/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const materialsApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    licenseType?: string;
    owner?: string;
    isActive?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.type) query.set('type', params.type);
    if (params?.licenseType) query.set('licenseType', params.licenseType);
    if (params?.owner) query.set('owner', params.owner);
    if (params?.isActive !== undefined) query.set('isActive', params.isActive);
    if (params?.search) query.set('search', params.search);
    return request<MaterialListResponse>(`/materials?${query.toString()}`);
  },

  get: (id: number) =>
    request<{ material: any }>(`/materials/${id}`),

  update: (id: number, data: any) =>
    request<{ material: any }>(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getLicenses: (id: number, params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return request<MaterialLicenseListResponse>(`/materials/${id}/licenses?${query.toString()}`);
  },
};

export const ordersApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    userId?: string;
    owner?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.owner) query.set('owner', params.owner);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.search) query.set('search', params.search);
    return request<OrderListResponse>(`/orders?${query.toString()}`);
  },

  get: (id: number) =>
    request<{ order: any }>(`/orders/${id}`),

  getNodes: () =>
    request<{ nodes: OrderNode[] }>('/orders/nodes/list'),

  updateNode: (id: number, data: any) =>
    request<{ node: OrderNode }>(`/orders/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getNodeLogs: (id: number) =>
    request<{ logs: OrderNodeLog[] }>(`/orders/${id}/node-logs`),
};

export const exceptionsApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    category?: string;
    priority?: string;
    assignee?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.assignee) query.set('assignee', params.assignee);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.search) query.set('search', params.search);
    return request<ExceptionListResponse>(`/exceptions?${query.toString()}`);
  },

  get: (id: number) =>
    request<ExceptionDetailResponse>(`/exceptions/${id}`),

  create: (data: {
    category: string;
    title: string;
    description?: string;
    relatedOrderId?: number;
    delayDays?: number;
    priority?: string;
    assignee?: string;
  }) =>
    request<{ exception: Exception }>('/exceptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: {
    category?: string;
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    assignee?: string;
    delayDays?: number;
  }) =>
    request<{ exception: Exception }>(`/exceptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    request<{ message: string }>(`/exceptions/${id}`, {
      method: 'DELETE',
    }),

  getLogs: (id: number) =>
    request<{ logs: ExceptionLog[] }>(`/exceptions/${id}/logs`),

  addLog: (id: number, data: {
    action: string;
    operator?: string;
    detail?: Record<string, any>;
  }) =>
    request<{ log: ExceptionLog }>(`/exceptions/${id}/logs`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delay: (id: number, data: {
    delayDays: number;
    reason?: string;
    operator?: string;
  }) =>
    request<{ exception: Exception }>(`/exceptions/${id}/delay`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  close: (id: number, data: {
    closeReason: string;
    resultSummary?: string;
    resultNote?: string;
    closer?: string;
  }) =>
    request<{ exception: Exception }>(`/exceptions/${id}/close`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reopen: (id: number, data: {
    reason: string;
    operator?: string;
  }) =>
    request<{ exception: Exception }>(`/exceptions/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const featuresApi = {
  list: () =>
    request<FeatureListResponse>('/features'),

  get: (key: string) =>
    request<FeatureDetailResponse>(`/features/${key}`),

  create: (data: {
    featureKey: string;
    name: string;
    description?: string;
    isEnabled?: boolean;
  }) =>
    request<FeatureDetailResponse>('/features', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (key: string, data: {
    name?: string;
    description?: string;
    isEnabled?: boolean;
  }) =>
    request<FeatureDetailResponse>(`/features/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggle: (key: string, isEnabled: boolean) =>
    request<FeatureDetailResponse>(`/features/${key}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ isEnabled }),
    }),

  enable: (key: string) =>
    request<FeatureDetailResponse>(`/features/${key}/enable`, {
      method: 'POST',
    }),

  disable: (key: string) =>
    request<FeatureDetailResponse>(`/features/${key}/disable`, {
      method: 'POST',
    }),

  remove: (key: string) =>
    request<{ message: string }>(`/features/${key}`, {
      method: 'DELETE',
    }),
};

export const rulesApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    isActive?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.category) query.set('category', params.category);
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
    return request<RuleListResponse>(`/rules?${query.toString()}`);
  },

  get: (id: number) =>
    request<{ rule: Rule }>(`/rules/${id}`),

  create: (data: {
    name: string;
    category: string;
    version: string;
    content: Record<string, any>;
    description?: string;
    createdBy?: string;
  }) =>
    request<{ rule: Rule }>('/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  activate: (id: number, data?: {
    activatedBy?: string;
  }) =>
    request<{ rule: Rule }>(`/rules/${id}/activate`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  deactivate: (id: number) =>
    request<{ rule: Rule }>(`/rules/${id}/deactivate`, {
      method: 'POST',
    }),

  rollback: (id: number) =>
    request<{ rule: Rule; message: string }>(`/rules/${id}/rollback`, {
      method: 'POST',
    }),

  remove: (id: number) =>
    request<{ message: string }>(`/rules/${id}`, {
      method: 'DELETE',
    }),

  getActiveByCategory: (category: string) =>
    request<{ rule: Rule }>(`/rules/category/${category}/active`),
};

export const contentApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    isMemberOnly?: boolean;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.isMemberOnly !== undefined) query.set('isMemberOnly', String(params.isMemberOnly));
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.search) query.set('search', params.search);
    return request<PodcastContentListResponse>(`/content?${query.toString()}`);
  },

  get: (id: number) =>
    request<PodcastContentDetailResponse>(`/content/${id}`),

  listPublic: (params?: {
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return request<PodcastContentListResponse>(`/content/public?${query.toString()}`);
  },

  listMember: (params?: {
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return request<PodcastContentListResponse>(`/content/member?${query.toString()}`);
  },

  create: (data: {
    title: string;
    description?: string;
    audioUrl?: string;
    isMemberOnly?: boolean;
    publishDate?: string;
  }) =>
    request<PodcastContentDetailResponse>('/content', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: {
    title?: string;
    description?: string;
    audioUrl?: string;
    isMemberOnly?: boolean;
    publishDate?: string;
  }) =>
    request<PodcastContentDetailResponse>(`/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    request<{ message: string }>(`/content/${id}`, {
      method: 'DELETE',
    }),
};

export const authApi = {
  getCurrentUser: () =>
    request<AuthMeResponse>('/auth/me'),
};
