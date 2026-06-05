import type { User, Course, Session, Booking, Participant, Guide, ScheduleAssignment, TeachingAid, Feedback, Notification, AuditLog, School } from '@/types';

const BASE_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(method: string, url: string, data?: any): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('未授权');
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || '请求失败');
  }
  return json.data as T;
}

function get<T>(url: string): Promise<T> {
  return request<T>('GET', url);
}

function post<T>(url: string, data?: any): Promise<T> {
  return request<T>('POST', url, data);
}

function put<T>(url: string, data?: any): Promise<T> {
  return request<T>('PUT', url, data);
}

function del<T>(url: string): Promise<T> {
  return request<T>('DELETE', url);
}

export const authApi = {
  login: (username: string, password: string) =>
    post<{ token: string; user: User }>('/auth/login', { username, password }),
  register: (data: { email: string; username: string; password: string; name: string; phone?: string; role: string }) =>
    post<User>('/auth/register', data),
};

export const coursesApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<Course[]>(`/courses${query}`);
  },
  getById: (id: number) => get<Course>(`/courses/${id}`),
  create: (data: Partial<Course>) => post<Course>('/courses', data),
  update: (id: number, data: Partial<Course>) => put<Course>(`/courses/${id}`, data),
};

export const sessionsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<Session[]>(`/sessions${query}`);
  },
  getById: (id: number) => get<Session>(`/sessions/${id}`),
  create: (data: Partial<Session>) => post<Session>('/sessions', data),
  update: (id: number, data: Partial<Session>) => put<Session>(`/sessions/${id}`, data),
  getCalendar: (month: number, year: number) =>
    get<Record<string, Session[]>>(`/sessions/calendar?month=${month}&year=${year}`),
};

export const bookingsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<Booking[]>(`/bookings${query}`);
  },
  getById: (id: number) => get<Booking>(`/bookings/${id}`),
  createGroup: (session_id: number, school_id: number, participants: { name: string; age: number }[]) =>
    post<Booking>('/bookings/group', { session_id, school_id, participants }),
  createIndividual: (session_id: number, participants: { name: string; age: number }[]) =>
    post<Booking>('/bookings/individual', { session_id, participants }),
  review: (id: number, action: 'approve' | 'reject', note?: string) =>
    put<Booking>(`/bookings/${id}/review`, { action, note }),
  cancel: (id: number) => put<Booking>(`/bookings/${id}/cancel`),
};

export const schedulingApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<ScheduleAssignment[]>(`/scheduling${query}`);
  },
  assign: (session_id: number, guide_id: number) =>
    post<ScheduleAssignment>('/scheduling/assign', { session_id, guide_id }),
  remove: (id: number) => del<ScheduleAssignment>(`/scheduling/${id}`),
  checkConflicts: (guide_id: number, date: string, start_time: string, end_time: string) =>
    get<{ has_conflict: boolean }>(`/scheduling/conflicts?guide_id=${guide_id}&date=${date}&start_time=${start_time}&end_time=${end_time}`),
};

export const checkinApi = {
  checkin: (sessionId: number, participant_id: number) =>
    post<Participant>(`/checkin/${sessionId}`, { participant_id }),
  getStatus: (sessionId: number) =>
    get<{ participants: Participant[]; checked_in_count: number; total_count: number }>(`/checkin/${sessionId}/status`),
};

export const teachingAidsApi = {
  list: () => get<TeachingAid[]>('/teaching-aids'),
  create: (data: Partial<TeachingAid>) => post<TeachingAid>('/teaching-aids', data),
  update: (id: number, data: Partial<TeachingAid>) => put<TeachingAid>(`/teaching-aids/${id}`, data),
  allocate: (id: number, session_id: number, quantity: number) =>
    post<any>(`/teaching-aids/${id}/allocate`, { session_id, quantity }),
};

export const feedbackApi = {
  create: (session_id: number, booking_id: number, rating: number, comment?: string) =>
    post<Feedback>('/feedback', { session_id, booking_id, rating, comment }),
  getStats: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<any>(`/feedback/stats${query}`);
  },
};

export const notificationsApi = {
  list: () => get<Notification[]>('/notifications'),
  markRead: (id: number) => put<Notification>(`/notifications/${id}/read`),
};

export const kanbanApi = {
  getOverdue: () => get<any>('/kanban/overdue'),
  getIdleResources: () => get<any>('/kanban/idle-resources'),
  getMetrics: () => get<any>('/kanban/metrics'),
};

export const auditLogsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<AuditLog[]>(`/audit-logs${query}`);
  },
};

export const adminApi = {
  listUsers: () => get<User[]>('/admin/users'),
  createUser: (data: { username: string; email: string; password: string; name: string; phone?: string; role: string }) =>
    post<User>('/admin/users', data),
  updateUser: (id: number, data: Partial<User> & { password?: string }) =>
    put<User>(`/admin/users/${id}`, data),
  listSchools: () => get<School[]>('/admin/schools'),
  createSchool: (data: Partial<School>) => post<School>('/admin/schools', data),
};
