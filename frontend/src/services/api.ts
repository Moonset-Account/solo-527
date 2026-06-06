import axios from 'axios';
import type {
  LoginResponse,
  User,
  Demand,
  Quote,
  Supplier,
  Contract,
  DashboardOverview,
  ResourceUtilization,
  ProfitReport,
  MonthlyTrend,
  PaymentNode,
  PaginatedResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }).then((r) => r.data),
  getProfile: () => api.get<User>('/auth/profile').then((r) => r.data),
};

export const demandApi = {
  findAll: (params?: any) =>
    api.get<PaginatedResponse<Demand>>('/demands', { params }).then((r) => r.data),
  findOne: (id: string) => api.get<Demand>(`/demands/${id}`).then((r) => r.data),
  create: (data: any) => api.post<Demand>('/demands', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<Demand>(`/demands/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/demands/${id}`).then((r) => r.data),
};

export const quoteApi = {
  findAll: (params?: any) =>
    api.get<PaginatedResponse<Quote>>('/quotes', { params }).then((r) => r.data),
  findOne: (id: string) => api.get<Quote>(`/quotes/${id}`).then((r) => r.data),
  getVersions: (id: string) => api.get<Quote[]>(`/quotes/${id}/versions`).then((r) => r.data),
  compareVersions: (id: string, version1: number, version2: number) =>
    api.get(`/quotes/${id}/compare`, { params: { version1, version2 } }).then((r) => r.data),
  create: (data: any) => api.post<Quote>('/quotes', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<Quote>(`/quotes/${id}`, data).then((r) => r.data),
  submitForApproval: (id: string) => api.post<Quote>(`/quotes/${id}/submit`).then((r) => r.data),
  remove: (id: string) => api.delete(`/quotes/${id}`).then((r) => r.data),
};

export const supplierApi = {
  findAll: (params?: any) =>
    api.get<PaginatedResponse<Supplier>>('/suppliers', { params }).then((r) => r.data),
  findOne: (id: string) => api.get<Supplier>(`/suppliers/${id}`).then((r) => r.data),
  create: (data: any) => api.post<Supplier>('/suppliers', data).then((r) => r.data),
  update: (id: string, data: any) => api.put<Supplier>(`/suppliers/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/suppliers/${id}`).then((r) => r.data),
};

export const contractApi = {
  findAll: (params?: any) =>
    api.get<PaginatedResponse<Contract>>('/contracts', { params }).then((r) => r.data),
  findOne: (id: string) => api.get<Contract>(`/contracts/${id}`).then((r) => r.data),
  create: (data: any) => api.post<Contract>('/contracts', data).then((r) => r.data),
  submit: (id: string, comment?: string) =>
    api.post<Contract>(`/contracts/${id}/submit`, { comment }).then((r) => r.data),
  approve: (id: string, comment?: string) =>
    api.post<Contract>(`/contracts/${id}/approve`, { comment }).then((r) => r.data),
  reject: (id: string, comment?: string) =>
    api.post<Contract>(`/contracts/${id}/reject`, { comment }).then((r) => r.data),
};

export const dashboardApi = {
  getOverview: (params?: any) =>
    api.get<DashboardOverview>('/dashboard/overview', { params }).then((r) => r.data),
  getOverdueTasks: (params?: any) =>
    api.get<PaginatedResponse<Demand>>('/dashboard/overdue-tasks', { params }).then((r) => r.data),
  getResourceUtilization: () =>
    api.get<ResourceUtilization[]>('/dashboard/resource-utilization').then((r) => r.data),
  getProcessStuck: () => api.get('/dashboard/process-stuck').then((r) => r.data),
};

export const financeApi = {
  getProfitReport: (params?: any) =>
    api.get<ProfitReport>('/finance/profit-report', { params }).then((r) => r.data),
  getPaymentNodes: (params?: any) =>
    api.get<PaymentNode[]>('/finance/payment-nodes', { params }).then((r) => r.data),
  markPaymentPaid: (id: string) =>
    api.post(`/finance/payment-nodes/${id}/paid`).then((r) => r.data),
  getMonthlyTrend: (months?: number) =>
    api.get<MonthlyTrend[]>('/finance/monthly-trend', { params: { months } }).then((r) => r.data),
};

export default api;
