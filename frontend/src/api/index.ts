import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('legal_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data;
    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        return Promise.reject(new Error(data.message || '请求失败'));
      }
      return data.data;
    }
    return data;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('legal_token');
      localStorage.removeItem('legal_user');
      window.location.href = '/login';
      return Promise.reject(new Error('登录已过期，请重新登录'));
    }
    const msg = (error.response?.data as any)?.message || error.message || '网络错误';
    return Promise.reject(new Error(msg));
  },
);

export const http = instance;

export const authApi = {
  login: (username: string, password: string) => http.post<any>('/auth/login', { username, password }),
  profile: () => http.get<any>('/auth/profile'),
  listUsers: (keyword?: string) => http.get<any>('/auth/users', { params: { keyword } }),
  listRoles: () => http.get<any>('/auth/roles'),
  listPermissions: () => http.get<any>('/auth/permissions'),
  assignRoles: (userId: string, roleIds: string[]) => http.put<any>(`/auth/users/${userId}/roles`, { roleIds }),
  assignPermissions: (roleId: string, permissionIds: string[]) => http.put<any>(`/auth/roles/${roleId}/permissions`, { permissionIds }),
};

export const contractApi = {
  reserveNumber: (data?: { ruleType?: string; prefix?: string }) => http.post<any>('/contracts/numbers/reserve', data),
  getNumberStats: () => http.get<any>('/contracts/numbers/stats'),
  listNumberPool: (page = 1, pageSize = 20, status?: string) => http.get<any>('/contracts/numbers/pool', { params: { page, pageSize, status } }),
  create: (data: any) => http.post<any>('/contracts', data),
  update: (id: string, data: any) => http.put<any>(`/contracts/${id}`, data),
  getById: (id: string) => http.get<any>(`/contracts/${id}`),
  query: (params: any) => http.get<any>('/contracts/query', { params }),
  stats: () => http.get<any>('/contracts/stats'),
  getApprovalProgress: (id: string) => http.get<any>(`/contracts/${id}/approval-progress`),
  verifyMaterials: (id: string, verified: boolean, remark?: string) => http.put<any>(`/contracts/${id}/verify-materials`, { verified, remark }),
  archive: (id: string) => http.post<any>(`/contracts/${id}/archive`),
  getResourcesUsage: () => http.get<any>('/contracts/resources/usage'),
  lockResource: (id: string, lockHours = 2) => http.post<any>(`/contracts/resources/${id}/lock`, { lockHours }),
  unlockResource: (id: string) => http.post<any>(`/contracts/resources/${id}/unlock`),
};

export const approvalApi = {
  submit: (data: { contractId: string; steps: any[] }) => http.post<any>('/approvals/submit', data),
  myTasks: (page = 1, pageSize = 20, status?: string) => http.get<any>('/approvals/my-tasks', { params: { page, pageSize, status } }),
  history: (contractId: string) => http.get<any>(`/approvals/contract/${contractId}/history`),
  approve: (id: string, opinion?: string) => http.post<any>(`/approvals/${id}/approve`, { opinion }),
  reject: (id: string, rejectionReason: string, opinion?: string) => http.post<any>(`/approvals/${id}/reject`, { rejectionReason, opinion }),
  transfer: (id: string, newApproverId: string, reason: string) => http.post<any>(`/approvals/${id}/transfer`, { newApproverId, reason }),
};

export const conflictApi = {
  create: (data: any) => http.post<any>('/conflicts', data),
  update: (id: string, data: any) => http.put<any>(`/conflicts/${id}`, data),
  getById: (id: string) => http.get<any>(`/conflicts/${id}`),
  query: (params: any) => http.get<any>('/conflicts/query', { params }),
  stats: () => http.get<any>('/conflicts/stats'),
};

export const notificationApi = {
  my: (page = 1, pageSize = 20, status?: string, type?: string) => http.get<any>('/notifications/my', { params: { page, pageSize, status, type } }),
  unreadCount: () => http.get<any>('/notifications/unread-count'),
  read: (id: string) => http.post<any>(`/notifications/${id}/read`),
  readAll: () => http.post<any>('/notifications/read-all'),
  send: (data: any) => http.post<any>('/notifications/send', data),
};

export const fileApi = {
  upload: (file: File, contractId: string, attachmentType: string, onProgress?: (p: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    form.append('contractId', contractId);
    form.append('attachmentType', attachmentType);
    return axios.post('/api/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('legal_token')}` },
      onUploadProgress: (ev) => {
        if (onProgress && ev.total) onProgress(Math.round((ev.loaded / ev.total) * 100));
      },
    }).then((r) => r.data.data);
  },
  queryAttachments: (params: any) => http.get<any>('/files/attachments/query', { params }),
  getAttachment: (id: string) => http.get<any>(`/files/attachments/${id}`),
  getAttachmentStats: () => http.get<any>('/files/attachments/stats'),
  getDownloadUrl: (id: string) => `/api/files/attachments/${id}/download`,
  updatePermission: (id: string, permissionConfig: any) => http.put<any>(`/files/attachments/${id}/permission`, { permissionConfig }),
  reviewAttachment: (id: string, status: string, remark?: string) => http.put<any>(`/files/attachments/${id}/review`, { status, remark }),
};

export const callbackApi = {
  create: (data: any) => http.post<any>('/callbacks', data),
  getById: (id: string) => http.get<any>(`/callbacks/${id}`),
  query: (params: any) => http.get<any>('/callbacks/query', { params }),
  stats: () => http.get<any>('/callbacks/stats'),
  retry: (id: string) => http.post<any>(`/callbacks/${id}/retry`),
  cancel: (id: string) => http.post<any>(`/callbacks/${id}/cancel`),
};
