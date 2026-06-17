import axios from 'axios';
import type {
  ApiResult,
  User,
  Alert,
  AlertProcessLog,
  Asset,
  BatchTask,
  BatchTaskDetail,
  Notification,
  AuditLog,
  Vulnerability,
  PagedResult,
  LoginRequest,
  LoginResponse,
  CreateAlertRequest,
  AssignAlertRequest,
  ProcessAlertRequest,
  AlertQueryParams,
} from '../types';
import { AlertStatus, AlertPriority, AlertType, AssetType, AssetStatus, UserRole, BatchTaskStatus, BatchTaskType, AuditActionType } from '../types';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: LoginRequest) =>
    request.post<LoginRequest, ApiResult<LoginResponse>>('/auth/login', data),
  logout: () => request.post<unknown, ApiResult>('/auth/logout'),
  getCurrentUser: () => request.get<unknown, ApiResult<User>>('/auth/me'),
};

export const userApi = {
  getList: (params: { page?: number; pageSize?: number; keyword?: string; role?: UserRole }) =>
    request.get<unknown, ApiResult<PagedResult<User>>>('/users', { params }),
  getById: (id: number) => request.get<unknown, ApiResult<User>>(`/users/${id}`),
  create: (data: unknown) => request.post<unknown, ApiResult<User>>('/users', data),
  update: (id: number, data: unknown) => request.put<unknown, ApiResult<User>>(`/users/${id}`, data),
  delete: (id: number) => request.delete<unknown, ApiResult>(`/users/${id}`),
  getByRole: (role: UserRole) =>
    request.get<unknown, User[]>(`/users/by-role/${role}`),
};

export const alertApi = {
  getList: (params: AlertQueryParams) =>
    request.get<unknown, ApiResult<PagedResult<Alert>>>('/alerts', { params }),
  getById: (id: number) => request.get<unknown, ApiResult<Alert>>(`/alerts/${id}`),
  create: (data: CreateAlertRequest) =>
    request.post<CreateAlertRequest, ApiResult<Alert>>('/alerts', data),
  update: (id: number, data: unknown) =>
    request.put<unknown, ApiResult<Alert>>(`/alerts/${id}`, data),
  assign: (id: number, data: AssignAlertRequest) =>
    request.post<AssignAlertRequest, ApiResult<Alert>>(`/alerts/${id}/assign`, data),
  process: (id: number, data: ProcessAlertRequest) =>
    request.post<ProcessAlertRequest, ApiResult<Alert>>(`/alerts/${id}/process`, data),
  getProcessLogs: (id: number) =>
    request.get<unknown, ApiResult<AlertProcessLog[]>>(`/alerts/${id}/logs`),
  getCount: (status?: AlertStatus) =>
    request.get<unknown, ApiResult<number>>('/alerts/count', { params: { status } }),
};

export const assetApi = {
  getList: (params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    type?: AssetType;
    status?: AssetStatus;
    syncRequired?: boolean;
  }) => request.get<unknown, ApiResult<PagedResult<Asset>>>('/assets', { params }),
  getById: (id: number) => request.get<unknown, ApiResult<Asset>>(`/assets/${id}`),
  getAll: () => request.get<unknown, ApiResult<Asset[]>>('/assets/all'),
  create: (data: unknown) => request.post<unknown, ApiResult<Asset>>('/assets', data),
  update: (id: number, data: unknown) =>
    request.put<unknown, ApiResult<Asset>>(`/assets/${id}`, data),
  delete: (id: number) => request.delete<unknown, ApiResult>(`/assets/${id}`),
  confirmSync: (id: number, data: { configuration: string; remark?: string }) =>
    request.post<unknown, ApiResult<Asset>>(`/assets/${id}/confirm-sync`, data),
};

export const batchTaskApi = {
  getList: (params: {
    page?: number;
    pageSize?: number;
    status?: BatchTaskStatus;
    type?: BatchTaskType;
  }) => request.get<unknown, ApiResult<PagedResult<BatchTask>>>('/batchTasks', { params }),
  getById: (id: number) =>
    request.get<unknown, ApiResult<BatchTaskDetail>>(`/batchTasks/${id}`),
  create: (data: { taskName: string; taskType: BatchTaskType; itemIds: number[]; parameters?: string }) =>
    request.post<unknown, ApiResult<BatchTask>>('/batchTasks', data),
  cancel: (id: number) => request.post<unknown, ApiResult>(`/batchTasks/${id}/cancel`),
};

export const notificationApi = {
  getList: (params?: { isRead?: boolean; count?: number }) =>
    request.get<unknown, ApiResult<Notification[]>>('/notifications', { params }),
  getUnreadCount: () =>
    request.get<unknown, ApiResult<number>>('/notifications/unread-count'),
  markAsRead: (id: number) =>
    request.post<unknown, ApiResult>(`/notifications/${id}/read`),
  markAllAsRead: () => request.post<unknown, ApiResult>('/notifications/read-all'),
};

export const auditLogApi = {
  getList: (params: {
    page?: number;
    pageSize?: number;
    userId?: number;
    entityType?: string;
    actionType?: AuditActionType;
    startDate?: string;
    endDate?: string;
  }) => request.get<unknown, ApiResult<PagedResult<AuditLog>>>('/auditLogs', { params }),
};

export const vulnerabilityApi = {
  getList: (params: {
    page?: number;
    pageSize?: number;
    severity?: AlertPriority;
    isOverdue?: boolean;
    assetId?: number;
    keyword?: string;
  }) => request.get<unknown, ApiResult<PagedResult<Vulnerability>>>('/vulnerabilities', { params }),
  getById: (id: number) =>
    request.get<unknown, ApiResult<Vulnerability>>(`/vulnerabilities/${id}`),
  extendDueDate: (id: number, data: { newDueDate: string; reason: string }) =>
    request.post<unknown, ApiResult<Vulnerability>>(`/vulnerabilities/${id}/extend`, data),
  resolve: (id: number, remark: string) =>
    request.post<unknown, ApiResult<Vulnerability>>(`/vulnerabilities/${id}/resolve`, remark),
};

export default request;
