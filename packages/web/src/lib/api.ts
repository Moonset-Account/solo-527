import axios from 'axios';
import { buildQuery } from './utils';

export const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object' && 'success' in res.data) {
      if (!res.data.success) {
        return Promise.reject(new Error(res.data.error || '请求失败'));
      }
    }
    return res;
  },
  (err) => {
    const msg = err.response?.data?.error || err.message || '网络错误';
    return Promise.reject(new Error(msg));
  }
);

export function unwrap<T = any>(res: any): T {
  return res?.data?.data as T;
}

export const endpoints = {
  summary: () => api.get<any>('/common/summary').then((r) => unwrap<any>(r)),
  zoneStats: () => api.get<any>('/common/zone-stats').then((r) => unwrap<any[]>(r)),
  energyTrend: (params: any) =>
    api.get<any>(`/common/energy-trend?${buildQuery(params)}`).then((r) => unwrap<any[]>(r)),
  alertSummary: () => api.get<any>('/common/alert-summary').then((r) => unwrap<any>(r)),
  me: () => api.get<any>('/common/me').then((r) => unwrap<any>(r)),
  users: () => api.get<any>('/common/users/list').then((r) => unwrap<any[]>(r)),

  zones: {
    list: (params?: any) =>
      api.get<any>(`/zones?${buildQuery(params || {})}`).then((r) => unwrap<any>(r)),
    listAll: () => api.get<any>('/zones/list').then((r) => unwrap<any[]>(r)),
    get: (id: string) => api.get<any>(`/zones/${id}`).then((r) => unwrap<any>(r)),
    create: (data: any) => api.post('/zones', data).then((r) => unwrap<any>(r)),
    update: (id: string, data: any) => api.put(`/zones/${id}`, data).then((r) => unwrap<any>(r)),
    delete: (id: string) => api.delete(`/zones/${id}`).then((r) => unwrap<any>(r)),
  },
  meters: {
    list: (params?: any) =>
      api.get<any>(`/meters?${buildQuery(params || {})}`).then((r) => unwrap<any>(r)),
    listAll: (params?: any) =>
      api.get<any>(`/meters/list?${buildQuery(params || {})}`).then((r) => unwrap<any[]>(r)),
    get: (id: string) => api.get<any>(`/meters/${id}`).then((r) => unwrap<any>(r)),
    create: (data: any) => api.post('/meters', data).then((r) => unwrap<any>(r)),
    update: (id: string, data: any) => api.put(`/meters/${id}`, data).then((r) => unwrap<any>(r)),
    delete: (id: string) => api.delete(`/meters/${id}`).then((r) => unwrap<any>(r)),
  },
  devices: {
    list: (params?: any) =>
      api.get<any>(`/devices?${buildQuery(params || {})}`).then((r) => unwrap<any>(r)),
    listAll: (params?: any) =>
      api.get<any>(`/devices/list?${buildQuery(params || {})}`).then((r) => unwrap<any[]>(r)),
    get: (id: string) => api.get<any>(`/devices/${id}`).then((r) => unwrap<any>(r)),
  },
  alerts: {
    list: (params?: any) =>
      api.get<any>(`/alerts?${buildQuery(params || {})}`).then((r) => unwrap<any>(r)),
    reminders: (threshold = 30) =>
      api.get<any>(`/alerts/pending-reminders?threshold=${threshold}`).then((r) => unwrap<any[]>(r)),
    get: (id: string) => api.get<any>(`/alerts/${id}`).then((r) => unwrap<any>(r)),
    create: (data: any) => api.post('/alerts', data).then((r) => unwrap<any>(r)),
    acknowledge: (id: string, data?: any) =>
      api.post(`/alerts/${id}/acknowledge`, data || {}).then((r) => unwrap<any>(r)),
    assign: (id: string, data: any) =>
      api.post(`/alerts/${id}/assign`, data).then((r) => unwrap<any>(r)),
    resolve: (id: string, data?: any) =>
      api.post(`/alerts/${id}/resolve`, data || {}).then((r) => unwrap<any>(r)),
    ignore: (id: string, data?: any) =>
      api.post(`/alerts/${id}/ignore`, data || {}).then((r) => unwrap<any>(r)),
    comment: (id: string, data: any) =>
      api.post(`/alerts/${id}/comment`, data).then((r) => unwrap<any>(r)),
  },
  subsidies: {
    list: (params?: any) =>
      api.get<any>(`/subsidies?${buildQuery(params || {})}`).then((r) => unwrap<any>(r)),
    summary: () => api.get<any>('/subsidies/summary').then((r) => unwrap<any>(r)),
    get: (id: string) => api.get<any>(`/subsidies/${id}`).then((r) => unwrap<any>(r)),
    create: (data: any) => api.post('/subsidies', data).then((r) => unwrap<any>(r)),
    update: (id: string, data: any) =>
      api.put(`/subsidies/${id}`, data).then((r) => unwrap<any>(r)),
    approve: (id: string) => api.post(`/subsidies/${id}/approve`).then((r) => unwrap<any>(r)),
    delete: (id: string) => api.delete(`/subsidies/${id}`).then((r) => unwrap<any>(r)),
  },
  targets: {
    list: (params?: any) =>
      api.get<any>(`/targets?${buildQuery(params || {})}`).then((r) => unwrap<any>(r)),
    get: (id: string) => api.get<any>(`/targets/${id}`).then((r) => unwrap<any>(r)),
    details: (id: string, params?: any) =>
      api.get<any>(`/targets/${id}/details?${buildQuery(params || {})}`).then((r) => unwrap<any>(r)),
    trend: (id: string) => api.get<any>(`/targets/${id}/trend`).then((r) => unwrap<any>(r)),
    create: (data: any) => api.post('/targets', data).then((r) => unwrap<any>(r)),
    update: (id: string, data: any) =>
      api.put(`/targets/${id}`, data).then((r) => unwrap<any>(r)),
    delete: (id: string) => api.delete(`/targets/${id}`).then((r) => unwrap<any>(r)),
  },
  offline: {
    list: (params?: any) =>
      api.get<any>(`/offline?${buildQuery(params || {})}`).then((r) => unwrap<any>(r)),
    summary: () => api.get<any>('/offline/summary').then((r) => unwrap<any>(r)),
    get: (id: string) => api.get<any>(`/offline/${id}`).then((r) => unwrap<any>(r)),
    create: (data: any) => api.post('/offline', data).then((r) => unwrap<any>(r)),
    acknowledge: (id: string, data?: any) =>
      api.post(`/offline/${id}/acknowledge`, data || {}).then((r) => unwrap<any>(r)),
    resolve: (id: string, data?: any) =>
      api.post(`/offline/${id}/resolve`, data || {}).then((r) => unwrap<any>(r)),
    update: (id: string, data: any) =>
      api.put(`/offline/${id}`, data).then((r) => unwrap<any>(r)),
  },
  audit: {
    list: (params?: any) =>
      api.get<any>(`/misc/audit-logs?${buildQuery(params || {})}`).then((r) => unwrap<any>(r)),
  },
  filters: {
    list: (pageKey?: string) =>
      api
        .get<any>(`/misc/saved-filters?pageKey=${pageKey || ''}`)
        .then((r) => unwrap<any[]>(r)),
    create: (data: any) => api.post('/misc/saved-filters', data).then((r) => unwrap<any>(r)),
    update: (id: string, data: any) =>
      api.put(`/misc/saved-filters/${id}`, data).then((r) => unwrap<any>(r)),
    delete: (id: string) => api.delete(`/misc/saved-filters/${id}`).then((r) => unwrap<any>(r)),
  },
  energy: {
    list: (params?: any) =>
      api.get<any>(`/misc/energy-records?${buildQuery(params || {})}`).then((r) => unwrap<any>(r)),
  },
  exportUrl: {
    alerts: (params?: any) => `/api/export/alerts?${buildQuery(params || {})}`,
    energy: (params?: any) => `/api/export/energy?${buildQuery(params || {})}`,
    subsidies: (params?: any) => `/api/export/subsidies?${buildQuery(params || {})}`,
    offline: (params?: any) => `/api/export/offline?${buildQuery(params || {})}`,
  },
};
