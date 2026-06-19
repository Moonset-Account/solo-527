import { get, post, patch, del } from '../utils/request';
import type { PaginatedData } from '../types';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
    phone?: string;
    email?: string;
    avatar?: string;
  };
}

export const authApi = {
  login: (data: LoginParams) => post<LoginResponse>('/auth/login', data),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
};

export const userApi = {
  list: (params?: any) => get<PaginatedData<any>>('/users', params),
  teachers: () => get<any[]>('/users/teachers'),
  create: (data: any) => post('/users', data),
  update: (id: number, data: any) => patch(`/users/${id}`, data),
  updatePassword: (id: number, data: any) => patch(`/users/${id}/password`, data),
  delete: (id: number) => del(`/users/${id}`),
};

export const campApi = {
  list: (params?: any) => get<PaginatedData<any>>('/camps', params),
  active: () => get<any[]>('/camps/active'),
  detail: (id: number) => get(`/camps/${id}`),
  members: (id: number, params?: any) => get<PaginatedData<any>>(`/camps/${id}/members`, params),
  create: (data: any) => post('/camps', data),
  update: (id: number, data: any) => patch(`/camps/${id}`, data),
  addMembers: (id: number, data: any) => post(`/camps/${id}/members`, data),
  removeMember: (campId: number, memberId: number) => del(`/camps/${campId}/members/${memberId}`),
};

export const courseApi = {
  list: (params?: any) => get<any[]>('/courses', params),
  detail: (id: number) => get(`/courses/${id}`),
  trial: (id: number) => get(`/courses/${id}/trial`),
  create: (data: any) => post('/courses', data),
  update: (id: number, data: any) => patch(`/courses/${id}`, data),
  delete: (id: number) => del(`/courses/${id}`),
};

export const memberApi = {
  list: (params?: any) => get<PaginatedData<any>>('/members', params),
  summary: () => get<any>('/members/stats/summary'),
  detail: (id: number) => get(`/members/${id}`),
  create: (data: any) => post('/members', data),
  update: (id: number, data: any) => patch(`/members/${id}`, data),
  addBenefit: (id: number, data: any) => post(`/members/${id}/benefits`, data),
  updateBenefit: (memberId: number, benefitId: number, data: any) =>
    patch(`/members/${memberId}/benefits/${benefitId}`, data),
};

export const checkInApi = {
  list: (params?: any) => get<PaginatedData<any>>('/checkins', params),
  dailyStats: (params?: any) => get<any[]>('/checkins/stats/daily', params),
  memberCampDetail: (memberCampId: number) => get(`/checkins/member-camp/${memberCampId}`),
  create: (data: any) => post('/checkins', data),
  update: (id: number, data: any) => patch(`/checkins/${id}`, data),
  batchMissed: (data: any) => post('/checkins/batch-missed', data),
};

export const conversionApi = {
  sources: (params?: any) => get<any[]>('/conversions/sources', params),
  createSource: (data: any) => post('/conversions/sources', data),
  updateSource: (id: number, data: any) => patch(`/conversions/sources/${id}`, data),
  logs: (params?: any) => get<PaginatedData<any>>('/conversions/logs', params),
  statsSummary: (params?: any) => get<any>('/conversions/stats/summary', params),
  statsFunnel: (params?: any) => get<any[]>('/conversions/stats/funnel', params),
  createLog: (data: any) => post('/conversions/logs', data),
  updateLog: (id: number, data: any) => patch(`/conversions/logs/${id}`, data),
};

export const todoApi = {
  list: (params?: any) => get<PaginatedData<any>>('/todos', params),
  boardStats: (params?: any) => get<any>('/todos/stats/board', params),
  detail: (id: number) => get(`/todos/${id}`),
  create: (data: any) => post('/todos', data),
  update: (id: number, data: any) => patch(`/todos/${id}`, data),
  assign: (id: number, data: any) => post(`/todos/${id}/assign`, data),
  delete: (id: number) => del(`/todos/${id}`),
};

export const laggingApi = {
  list: (params?: any) => get<PaginatedData<any>>('/lagging', params),
  detail: (id: number) => get(`/lagging/${id}`),
  update: (id: number, data: any) => patch(`/lagging/${id}`, data),
  createTodo: (id: number, data: any) => post(`/lagging/${id}/todos`, data),
  batchFollow: (data: any) => post('/lagging/batch-follow', data),
};

export const reportApi = {
  dashboard: () => get<any>('/reports/dashboard'),
  checkIn: (params?: any) => get<any>('/reports/checkin', params),
  retention: (params?: any) => get<any>('/reports/retention', params),
  conversion: (params?: any) => get<any>('/reports/conversion', params),
  exportMembers: () => get<any>('/reports/export/members'),
  handover: () => get<any>('/reports/handover'),
};

export const logApi = {
  list: (params?: any) => get<PaginatedData<any>>('/logs', params),
  detail: (id: number) => get(`/logs/${id}`),
  byTarget: (type: string, targetId: number) => get<any[]>(`/logs/target/${type}/${targetId}`),
  byMember: (memberId: number) => get<any[]>(`/logs/member/${memberId}`),
};
