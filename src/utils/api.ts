import type {
  AuthUser, Member, Coach, PackageType, MemberPackage,
  Appointment, Freeze, GroupClass, BodyTest, Message,
  Schedule, AuditLog, RenewalTracking, DashboardStats,
} from '../../shared/types';

const TOKEN_KEY = 'gym_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data as T;
}

export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ username, password }),
    }),
  logout: () =>
    request<void>('/api/auth/logout', { method: 'POST' }),
  getMe: () =>
    request<AuthUser>('/api/auth/me'),
};

export const memberApi = {
  list: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return request<Member[]>(`/api/members${params}`);
  },
  get: (id: number) => request<Member>(`/api/members/${id}`),
  create: (data: Partial<Member>) =>
    request<Member>('/api/members', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Member>) =>
    request<Member>(`/api/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) =>
    request<void>(`/api/members/${id}`, { method: 'DELETE' }),
};

export const coachApi = {
  list: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return request<Coach[]>(`/api/coaches${params}`);
  },
  get: (id: number) => request<Coach>(`/api/coaches/${id}`),
  create: (data: Partial<Coach>) =>
    request<Coach>('/api/coaches', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Coach>) =>
    request<Coach>(`/api/coaches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getPerformance: (id: number) =>
    request<{ sessions: number; revenue: number }>(`/api/coaches/${id}/performance`),
  getSchedule: (id: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    return request<Schedule[]>(`/api/coaches/${id}/schedule?${params.toString()}`);
  },
  createSchedule: (id: number, data: Partial<Schedule>) =>
    request<Schedule>(`/api/coaches/${id}/schedule`, { method: 'POST', body: JSON.stringify(data) }),
};

export const packageApi = {
  list: (activeOnly?: boolean) => {
    const params = activeOnly ? '?active=true' : '';
    return request<PackageType[]>(`/api/packages${params}`);
  },
  create: (data: Partial<PackageType>) =>
    request<PackageType>('/api/packages', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<PackageType>) =>
    request<PackageType>(`/api/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) =>
    request<void>(`/api/packages/${id}`, { method: 'DELETE' }),
  purchasePackage: (memberId: number, packageTypeId: number, paidAmount: number) =>
    request<MemberPackage>(`/api/packages/members/${memberId}/purchase-package`, {
      method: 'POST', body: JSON.stringify({ package_type_id: packageTypeId, paid_amount: paidAmount }),
    }),
  getMemberPackages: (memberId: number) =>
    request<MemberPackage[]>(`/api/packages/members/${memberId}/packages`),
};

export const appointmentApi = {
  list: (filters?: { member_id?: number; coach_id?: number; status?: string; date?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
    }
    return request<Appointment[]>(`/api/appointments?${params.toString()}`);
  },
  create: (data: Partial<Appointment>) =>
    request<Appointment>('/api/appointments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Appointment>) =>
    request<Appointment>(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) =>
    request<void>(`/api/appointments/${id}`, { method: 'DELETE' }),
  checkIn: (id: number) =>
    request<Appointment>(`/api/appointments/${id}/checkin`, { method: 'POST' }),
};

export const freezeApi = {
  list: (filters?: { member_id?: number; status?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
    }
    return request<Freeze[]>(`/api/freezes?${params.toString()}`);
  },
  create: (data: Partial<Freeze>) =>
    request<Freeze>('/api/freezes', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id: number) =>
    request<Freeze>(`/api/freezes/${id}/approve`, { method: 'PUT' }),
  getMemberFreezes: (memberId: number) =>
    request<Freeze[]>(`/api/freezes/members/${memberId}/freezes`),
};

export const groupClassApi = {
  list: (filters?: { coach_id?: number; status?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
    }
    return request<GroupClass[]>(`/api/group-classes?${params.toString()}`);
  },
  create: (data: Partial<GroupClass>) =>
    request<GroupClass>('/api/group-classes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<GroupClass>) =>
    request<GroupClass>(`/api/group-classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) =>
    request<void>(`/api/group-classes/${id}`, { method: 'DELETE' }),
  book: (id: number, memberId: number) =>
    request<Appointment>(`/api/group-classes/${id}/book`, { method: 'POST', body: JSON.stringify({ member_id: memberId }) }),
  cancelBooking: (id: number, memberId: number) =>
    request<void>(`/api/group-classes/${id}/book`, { method: 'DELETE', body: JSON.stringify({ member_id: memberId }) }),
};

export const bodyTestApi = {
  list: (memberId: number) =>
    request<BodyTest[]>(`/api/body-tests?member_id=${memberId}`),
  create: (data: Partial<BodyTest>) =>
    request<BodyTest>('/api/body-tests', { method: 'POST', body: JSON.stringify(data) }),
  getMemberBodyTests: (memberId: number) =>
    request<BodyTest[]>(`/api/body-tests/members/${memberId}/body-tests`),
};

export const messageApi = {
  list: (filters?: { read?: boolean; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
    }
    return request<Message[]>(`/api/messages?${params.toString()}`);
  },
  markRead: (id: number) =>
    request<void>(`/api/messages/${id}/read`, { method: 'PUT' }),
  send: (data: { userId: number; title: string; content: string; type?: string }) =>
    request<Message>('/api/messages/send', { method: 'POST', body: JSON.stringify(data) }),
  getUnreadCount: () =>
    request<{ count: number }>('/api/messages/unread-count'),
};

export const renewalApi = {
  getFunnel: () =>
    request<{ expiring: number; expired: number; renewed: number; lost: number }>('/api/renewal/funnel'),
  getExpiring: () =>
    request<RenewalTracking[]>('/api/renewal/expiring'),
  addFollowUp: (id: number, notes: string) =>
    request<RenewalTracking>(`/api/renewal/${id}/follow-up`, { method: 'PUT', body: JSON.stringify({ notes }) }),
};

export const auditLogApi = {
  list: (filters?: { entity_type?: string; user_id?: number; start_date?: string; end_date?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
    }
    return request<AuditLog[]>(`/api/audit-logs?${params.toString()}`);
  },
};

export const scheduleApi = {
  list: (filters?: { coach_id?: number; date?: string; start_date?: string; end_date?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
    }
    return request<Schedule[]>(`/api/schedules?${params.toString()}`);
  },
  create: (data: Partial<Schedule>) =>
    request<Schedule>('/api/schedules', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id: number, action: 'approve' | 'reject') =>
    request<Schedule>(`/api/schedules/${id}/approve`, { method: 'PUT', body: JSON.stringify({ action }) }),
};

export const uploadApi = {
  uploadFile: async (file: File): Promise<{ filename: string; path: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (res.status === 401) {
      removeToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Upload failed');
    return json.data;
  },
};

export const dashboardApi = {
  getStats: () => request<DashboardStats>('/api/dashboard'),
};
