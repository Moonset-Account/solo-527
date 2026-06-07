import axios from 'axios';
import type {
  LoginRequest, LoginResponse, SafetyEvent, EventListResponse,
  Checkpoint, NotificationRateStats, EventStatusStats, HandleDurationStats,
  PublicReportStats, CreateEventRequest, Attachment
} from './types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then(res => res.data),
};

export const eventsAPI = {
  getList: (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    level?: string;
    start_date?: string;
    end_date?: string;
  }) => api.get<EventListResponse>('/events', { params }).then(res => res.data),

  get: (id: string) =>
    api.get<SafetyEvent>(`/events/${id}`).then(res => res.data),

  create: (data: CreateEventRequest) =>
    api.post<SafetyEvent>('/events', data).then(res => res.data),

  update: (id: string, data: Partial<SafetyEvent>) =>
    api.put<SafetyEvent>(`/events/${id}`, data).then(res => res.data),

  confirm: (id: string) =>
    api.post<SafetyEvent>(`/events/${id}/confirm`).then(res => res.data),

  close: (id: string) =>
    api.post<SafetyEvent>(`/events/${id}/close`).then(res => res.data),

  getPendingNotifications: () =>
    api.get<SafetyEvent[]>('/events/pending-notifications').then(res => res.data),
};

export const checkpointsAPI = {
  getList: () => api.get<Checkpoint[]>('/checkpoints').then(res => res.data),
};

export const notificationsAPI = {
  resend: (eventId: string) =>
    api.post<SafetyEvent>(`/notifications/${eventId}/resend`).then(res => res.data),
};

export const reportsAPI = {
  getNotificationRate: (params?: { start_date?: string; end_date?: string }) =>
    api.get<NotificationRateStats>('/reports/notification-rate', { params }).then(res => res.data),

  getEventStatus: (params?: { start_date?: string; end_date?: string }) =>
    api.get<EventStatusStats>('/reports/event-status', { params }).then(res => res.data),

  getHandleDuration: (params?: { start_date?: string; end_date?: string }) =>
    api.get<HandleDurationStats>('/reports/handle-duration', { params }).then(res => res.data),

  getPublic: () =>
    api.get<PublicReportStats>('/reports/public').then(res => res.data),

  export: (anonymous: boolean = false) =>
    api.get('/reports/export', {
      params: { anonymous },
      responseType: 'blob'
    }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = res.headers['content-disposition'];
      const filename = contentDisposition?.match(/filename="?([^"]+)"?/)?.[1] || 'report.json';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }),
};

export const attachmentsAPI = {
  getByEvent: (eventId: string) =>
    api.get<Attachment[]>(`/events/${eventId}/attachments`).then(res => res.data),

  upload: (eventId: string, file: File, accessRole: string = 'all') => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Attachment>(`/events/${eventId}/attachments`, formData, {
      params: { access_role: accessRole },
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },

  getDownloadUrl: (id: string) => `/api/attachments/${id}`,
};

export default api;
