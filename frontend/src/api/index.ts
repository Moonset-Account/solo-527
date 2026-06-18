import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

const instance = axios.create({
  baseURL: '/api',
  timeout: 30000
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || { message: error.message });
  }
);

async function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return instance.request(config) as Promise<T>;
}

export const api = {
  auth: {
    login: (data: { userName: string; password: string }) =>
      request({ method: 'POST', url: '/auth/login', data }),
    register: (data: any) => request({ method: 'POST', url: '/auth/register', data }),
    me: () => request({ method: 'GET', url: '/auth/me' }),
    getUsersByRole: (role: string) =>
      request({ method: 'GET', url: `/auth/users?role=${role}` })
  },
  classes: {
    list: (params?: { teacherId?: number; activeOnly?: boolean }) =>
      request({ method: 'GET', url: '/classes', params }),
    get: (id: number) => request({ method: 'GET', url: `/classes/${id}` }),
    my: () => request({ method: 'GET', url: '/classes/my' }),
    create: (data: any) => request({ method: 'POST', url: '/classes', data }),
    update: (id: number, data: any) =>
      request({ method: 'PUT', url: `/classes/${id}`, data }),
    enrollStudent: (classId: number, studentId: number) =>
      request({ method: 'POST', url: `/classes/${classId}/students/${studentId}` }),
    removeStudent: (classId: number, studentId: number) =>
      request({ method: 'DELETE', url: `/classes/${classId}/students/${studentId}` })
  },
  schedules: {
    list: (params?: { classId?: number; startDate?: string; endDate?: string }) =>
      request({ method: 'GET', url: '/schedules', params }),
    get: (id: number) => request({ method: 'GET', url: `/schedules/${id}` }),
    my: (params?: { startDate?: string; endDate?: string }) =>
      request({ method: 'GET', url: '/schedules/my', params }),
    create: (data: any) => request({ method: 'POST', url: '/schedules', data }),
    reschedule: (data: any) => request({ method: 'POST', url: '/schedules/reschedule', data }),
    cancel: (id: number, data: { reason: string }) =>
      request({ method: 'POST', url: `/schedules/${id}/cancel`, data }),
    batchCreate: (data: any[]) => request({ method: 'POST', url: '/schedules/batch', data })
  },
  attendances: {
    bySchedule: (scheduleId: number) =>
      request({ method: 'GET', url: `/attendances/schedule/${scheduleId}` }),
    my: (params?: { startDate?: string; endDate?: string }) =>
      request({ method: 'GET', url: '/attendances/my', params }),
    mark: (data: any) => request({ method: 'POST', url: '/attendances/mark', data }),
    batchMark: (data: any) => request({ method: 'POST', url: '/attendances/batch', data })
  },
  leaves: {
    list: (params?: { studentId?: number; status?: string }) =>
      request({ method: 'GET', url: '/leaves', params }),
    my: () => request({ method: 'GET', url: '/leaves/my' }),
    create: (data: any) => request({ method: 'POST', url: '/leaves', data }),
    process: (data: any) => request({ method: 'POST', url: '/leaves/process', data })
  },
  feedbacks: {
    workList: (params?: { studentId?: number; scheduleId?: number }) =>
      request({ method: 'GET', url: '/feedbacks/work', params }),
    myWorkFeedbacks: () => request({ method: 'GET', url: '/feedbacks/work/my' }),
    createWork: (data: any) => request({ method: 'POST', url: '/feedbacks/work', data }),
    notifyParent: (id: number) =>
      request({ method: 'POST', url: `/feedbacks/work/${id}/notify` }),
    homeSchoolList: (params?: { studentId?: number; pendingRemindersOnly?: boolean }) =>
      request({ method: 'GET', url: '/feedbacks/homeschool', params }),
    createHomeSchool: (data: any) =>
      request({ method: 'POST', url: '/feedbacks/homeschool', data }),
    markRead: (id: number) =>
      request({ method: 'POST', url: `/feedbacks/homeschool/${id}/read` })
  },
  notifications: {
    list: (unreadOnly = false) =>
      request({ method: 'GET', url: '/notifications', params: { unreadOnly } }),
    unreadCount: () => request({ method: 'GET', url: '/notifications/unread-count' }),
    markRead: (id: number) => request({ method: 'POST', url: `/notifications/${id}/read` }),
    markAllRead: () => request({ method: 'POST', url: '/notifications/read-all' })
  },
  operationLogs: {
    list: (params?: any) => request({ method: 'GET', url: '/operation-logs', params })
  },
  hoursWarnings: {
    list: (onlyUnnotified = false) =>
      request({ method: 'GET', url: '/hours-warnings', params: { onlyUnnotified } }),
    byStudent: (studentId: number) =>
      request({ method: 'GET', url: `/hours-warnings/student/${studentId}` }),
    resolve: (id: number) => request({ method: 'POST', url: `/hours-warnings/${id}/resolve` })
  },
  reports: {
    monthly: (year: number, month: number) =>
      request({ method: 'GET', url: `/reports/monthly/${year}/${month}` }),
    myMonthly: (year: number, month: number) =>
      request({ method: 'GET', url: `/reports/monthly/${year}/${month}/my` }),
    studentMonthly: (year: number, month: number, studentId: number) =>
      request({ method: 'GET', url: `/reports/monthly/${year}/${month}/student/${studentId}` }),
    generateMonthly: (year: number, month: number, studentId?: number) =>
      request({
        method: 'POST',
        url: `/reports/monthly/${year}/${month}/generate`,
        params: studentId ? { studentId } : undefined
      })
  },
  batchOperations: {
    list: (params?: { operatorId?: number }) =>
      request({ method: 'GET', url: '/batch-operations', params }),
    get: (id: string) => request({ method: 'GET', url: `/batch-operations/${id}` })
  }
};
