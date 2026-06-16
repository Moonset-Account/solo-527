import request, { buildQuery, PaginatedParams } from '../lib/request';
import type { PaginatedResult } from '@shared/types';

export interface CampListItem {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  maxMembers: number;
  currentMembers: number;
  price: string;
  operatorId?: string;
  createdAt: string;
  updatedAt: string;
  chaptersCount?: number;
  materialsCount?: number;
  membersCount?: number;
}

export interface CampDetail extends CampListItem {
  chapters: Chapter[];
  materials: CampMaterial[];
}

export interface Chapter {
  id: string;
  campId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration: number;
  sortOrder: number;
  status: 'draft' | 'published';
  isPreview: boolean;
  materials?: ChapterMaterial[];
  createdAt: string;
  updatedAt: string;
}

export interface ChapterMaterial {
  id: string;
  chapterId: string;
  name: string;
  type: string;
  url: string;
  fileSize?: number;
  createdAt: string;
}

export interface CampMaterial {
  id: string;
  campId: string;
  name: string;
  type: string;
  url: string;
  fileSize?: number;
  createdAt: string;
}

export interface MemberListItem {
  id: string;
  userId: string;
  campId: string;
  memberNo: string;
  status: 'active' | 'expired' | 'refunded' | 'paused';
  joinDate: string;
  expiryDate?: string;
  conversionSource: string;
  conversionSourceDetail?: string;
  lastActiveAt?: string;
  progress: string;
  totalChapters: number;
  completedChapters: number;
  isFallingBehind: boolean;
  salesPerson?: string;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  campName?: string;
}

export interface MemberDetail extends MemberListItem {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  camp: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  progress?: {
    id: string;
    chapterId: string;
    isCompleted: boolean;
    completedAt?: string;
    watchDuration: number;
    chapterTitle?: string;
  }[];
}

export interface CheckinListItem {
  id: string;
  memberId: string;
  chapterId: string;
  campId: string;
  content?: string;
  imageUrls?: string[];
  status: 'pending' | 'approved' | 'rejected';
  checkedInAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  memberNo?: string;
  userName?: string;
  chapterTitle?: string;
  campName?: string;
  reviewerName?: string;
}

export interface RefundRule {
  id: string;
  campId: string;
  name: string;
  description?: string;
  daysFromJoin: number;
  refundRate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRequestListItem {
  id: string;
  memberId: string;
  ruleId?: string;
  reason: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestedAt: string;
  processedBy?: string;
  processedAt?: string;
  processComment?: string;
  createdAt: string;
  memberNo?: string;
  userName?: string;
  campId?: string;
  campName?: string;
  ruleName?: string;
}

export interface BenefitListItem {
  id: string;
  memberId: string;
  type: 'discount' | 'gift' | 'service' | 'other';
  name: string;
  description?: string;
  value?: string;
  isUsed: boolean;
  usedAt?: string;
  expiresAt?: string;
  createdAt: string;
  memberNo?: string;
  userName?: string;
}

export interface TodoListItem {
  id: string;
  title: string;
  description?: string;
  type: 'fall_behind_warning' | 'checkin_review' | 'refund_review' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigneeId?: string;
  memberId?: string;
  campId?: string;
  dueDate?: string;
  completedAt?: string;
  completedBy?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  assigneeName?: string;
  creatorName?: string;
  completerName?: string;
  memberNo?: string;
  memberName?: string;
  campName?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'operator' | 'member';
  avatarUrl?: string;
  createdAt: string;
}

export const campsApi = {
  list: (params?: PaginatedParams): Promise<PaginatedResult<CampListItem>> =>
    request.get(`/camps${buildQuery(params)}`),
  get: (id: string): Promise<CampDetail> => request.get(`/camps/${id}`),
  create: (data: Partial<CampListItem>): Promise<CampListItem> => request.post('/camps', data),
  update: (id: string, data: Partial<CampListItem>): Promise<CampListItem> =>
    request.put(`/camps/${id}`, data),
  remove: (id: string): Promise<any> => request.delete(`/camps/${id}`),
  listMaterials: (id: string): Promise<CampMaterial[]> => request.get(`/camps/${id}/materials`),
  addMaterial: (id: string, data: any): Promise<CampMaterial> =>
    request.post(`/camps/${id}/materials`, data),
  removeMaterial: (id: string, materialId: string): Promise<any> =>
    request.delete(`/camps/${id}/materials/${materialId}`),
};

export const chaptersApi = {
  list: (params?: { campId?: string }): Promise<Chapter[]> =>
    request.get(`/chapters${buildQuery(params)}`),
  listPreview: (params?: { campId?: string }): Promise<any[]> =>
    request.get(`/chapters/preview${buildQuery(params)}`),
  get: (id: string): Promise<Chapter> => request.get(`/chapters/${id}`),
  create: (data: Partial<Chapter>): Promise<Chapter> => request.post('/chapters', data),
  update: (id: string, data: Partial<Chapter>): Promise<Chapter> =>
    request.put(`/chapters/${id}`, data),
  remove: (id: string): Promise<any> => request.delete(`/chapters/${id}`),
  togglePreview: (id: string): Promise<Chapter> =>
    request.patch(`/chapters/${id}/toggle-preview`),
  listMaterials: (id: string): Promise<ChapterMaterial[]> =>
    request.get(`/chapters/${id}/materials`),
  addMaterial: (id: string, data: any): Promise<ChapterMaterial> =>
    request.post(`/chapters/${id}/materials`, data),
  removeMaterial: (id: string, materialId: string): Promise<any> =>
    request.delete(`/chapters/${id}/materials/${materialId}`),
};

export const membersApi = {
  list: (params?: PaginatedParams): Promise<PaginatedResult<MemberListItem>> =>
    request.get(`/members${buildQuery(params)}`),
  getFallingBehind: (): Promise<any[]> => request.get('/members/falling-behind'),
  get: (id: string): Promise<MemberDetail> => request.get(`/members/${id}`),
  create: (data: any): Promise<MemberListItem> => request.post('/members', data),
  update: (id: string, data: any): Promise<MemberListItem> =>
    request.put(`/members/${id}`, data),
  remove: (id: string): Promise<any> => request.delete(`/members/${id}`),
  updateProgress: (id: string, data: any): Promise<any> =>
    request.post(`/members/${id}/progress`, data),
  refreshProgress: (id: string): Promise<any> =>
    request.post(`/members/${id}/refresh-progress`),
};

export const checkinsApi = {
  list: (params?: PaginatedParams): Promise<PaginatedResult<CheckinListItem>> =>
    request.get(`/checkins${buildQuery(params)}`),
  get: (id: string): Promise<CheckinListItem> => request.get(`/checkins/${id}`),
  create: (data: any): Promise<CheckinListItem> => request.post('/checkins', data),
  review: (id: string, data: any): Promise<CheckinListItem> =>
    request.patch(`/checkins/${id}/review`, data),
  remove: (id: string): Promise<any> => request.delete(`/checkins/${id}`),
};

export const refundsApi = {
  listRules: (params?: { campId?: string }): Promise<RefundRule[]> =>
    request.get(`/refunds/rules${buildQuery(params)}`),
  createRule: (data: any): Promise<RefundRule> => request.post('/refunds/rules', data),
  updateRule: (id: string, data: any): Promise<RefundRule> =>
    request.put(`/refunds/rules/${id}`, data),
  removeRule: (id: string): Promise<any> => request.delete(`/refunds/rules/${id}`),
  listRequests: (params?: PaginatedParams): Promise<PaginatedResult<RefundRequestListItem>> =>
    request.get(`/refunds/requests${buildQuery(params)}`),
  getRequest: (id: string): Promise<RefundRequestListItem> =>
    request.get(`/refunds/requests/${id}`),
  createRequest: (data: any): Promise<RefundRequestListItem> =>
    request.post('/refunds/requests', data),
  processRequest: (id: string, data: any): Promise<RefundRequestListItem> =>
    request.patch(`/refunds/requests/${id}/process`, data),
};

export const benefitsApi = {
  list: (params?: PaginatedParams): Promise<PaginatedResult<BenefitListItem>> =>
    request.get(`/benefits${buildQuery(params)}`),
  get: (id: string): Promise<BenefitListItem> => request.get(`/benefits/${id}`),
  create: (data: any): Promise<BenefitListItem> => request.post('/benefits', data),
  use: (id: string, data?: any): Promise<BenefitListItem> =>
    request.patch(`/benefits/${id}/use`, data || {}),
  remove: (id: string): Promise<any> => request.delete(`/benefits/${id}`),
};

export const todosApi = {
  list: (params?: PaginatedParams): Promise<PaginatedResult<TodoListItem>> =>
    request.get(`/todos${buildQuery(params)}`),
  getOverdue: (params?: { assigneeId?: string }): Promise<any[]> =>
    request.get(`/todos/overdue${buildQuery(params)}`),
  getStats: (params?: { assigneeId?: string; campId?: string }): Promise<any> =>
    request.get(`/todos/stats${buildQuery(params)}`),
  get: (id: string): Promise<TodoListItem> => request.get(`/todos/${id}`),
  create: (data: any): Promise<TodoListItem> => request.post('/todos', data),
  update: (id: string, data: any): Promise<TodoListItem> => request.put(`/todos/${id}`, data),
  complete: (id: string, data?: any): Promise<TodoListItem> =>
    request.patch(`/todos/${id}/complete`, data || {}),
  remove: (id: string): Promise<any> => request.delete(`/todos/${id}`),
};

export const usersApi = {
  list: (params?: PaginatedParams): Promise<PaginatedResult<User>> =>
    request.get(`/users${buildQuery(params)}`),
  listOperators: (): Promise<User[]> => request.get('/users/operators'),
  get: (id: string): Promise<User> => request.get(`/users/${id}`),
  create: (data: any): Promise<User> => request.post('/users', data),
  update: (id: string, data: any): Promise<User> => request.put(`/users/${id}`, data),
  remove: (id: string): Promise<any> => request.delete(`/users/${id}`),
};

export const statsApi = {
  overview: (): Promise<any> => request.get('/stats/overview'),
  completion: (params?: { campId?: string }): Promise<any> =>
    request.get(`/stats/completion${buildQuery(params)}`),
  checkins: (params?: any): Promise<any> =>
    request.get(`/stats/checkins${buildQuery(params)}`),
  conversionSources: (params?: any): Promise<any> =>
    request.get(`/stats/conversion-sources${buildQuery(params)}`),
};

export const exportApi = {
  members: (params?: any) => {
    const url = `/api/export/members${buildQuery(params)}`;
    window.open(url, '_blank');
  },
  checkins: (params?: any) => {
    const url = `/api/export/checkins${buildQuery(params)}`;
    window.open(url, '_blank');
  },
  refunds: (params?: any) => {
    const url = `/api/export/refunds${buildQuery(params)}`;
    window.open(url, '_blank');
  },
  benefits: (params?: any) => {
    const url = `/api/export/benefits${buildQuery(params)}`;
    window.open(url, '_blank');
  },
  todos: (params?: any) => {
    const url = `/api/export/todos${buildQuery(params)}`;
    window.open(url, '_blank');
  },
  conversionBySource: (params?: any) => {
    const url = `/api/export/conversion-by-source${buildQuery(params)}`;
    window.open(url, '_blank');
  },
};
