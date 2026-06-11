import request from './request';

export interface PageParams {
  keyword?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export const authApi = {
  login: (data: { username: string; password: string }) =>
    request.post<any, any>('/auth/login', data),
  register: (data: any) => request.post<any, any>('/auth/register', data),
  me: () => request.get<any, any>('/auth/me'),
};

export const courseApi = {
  list: (params: PageParams) => request.get<any, PageResult<any>>('/courses', { params }),
  detail: (id: number) => request.get<any, any>(`/courses/${id}`),
  create: (data: any) => request.post<any, any>('/courses', data),
  update: (id: number, data: any) => request.put<any, any>(`/courses/${id}`, data),
  delete: (id: number) => request.delete<any, any>(`/courses/${id}`),
};

export const classApi = {
  list: (params: PageParams) => request.get<any, PageResult<any>>('/classes', { params }),
  detail: (id: number) => request.get<any, any>(`/classes/${id}`),
  create: (data: any) => request.post<any, any>('/classes', data),
  update: (id: number, data: any) => request.put<any, any>(`/classes/${id}`, data),
  delete: (id: number) => request.delete<any, any>(`/classes/${id}`),
  completionRate: (id: number) => request.get<any, number>(`/classes/${id}/completion-rate`),
};

export const orderApi = {
  list: (params: PageParams) => request.get<any, PageResult<any>>('/orders', { params }),
  detail: (id: number) => request.get<any, any>(`/orders/${id}`),
  create: (data: { courseId: number; classId?: number; couponId?: number }) =>
    request.post<any, any>('/orders', data),
  pay: (id: number) => request.post<any, any>(`/orders/${id}/pay`),
  updateStatus: (id: number, data: { status: string; remark?: string }) =>
    request.put<any, any>(`/orders/${id}/status`, data),
};

export const couponApi = {
  list: (params: PageParams) => request.get<any, PageResult<any>>('/coupons', { params }),
  detail: (id: number) => request.get<any, any>(`/coupons/${id}`),
  getByCode: (code: string) => request.get<any, any>(`/coupons/code/${code}`),
  create: (data: any) => request.post<any, any>('/coupons', data),
  update: (id: number, data: any) => request.put<any, any>(`/coupons/${id}`, data),
  delete: (id: number) => request.delete<any, any>(`/coupons/${id}`),
};

export const learningApi = {
  my: () => request.get<any, any[]>('/learning/my'),
  list: (params: PageParams) => request.get<any, PageResult<any>>('/learning', { params }),
  classProgress: (classId: number) => request.get<any, any[]>(`/learning/class/${classId}`),
  updateProgress: (id: number, data: { hours?: number; completedLessons?: number }) =>
    request.put<any, any>(`/learning/${id}/progress`, data),
};

export const refundApi = {
  list: (params: PageParams) => request.get<any, PageResult<any>>('/refunds', { params }),
  detail: (id: number) => request.get<any, any>(`/refunds/${id}`),
  create: (data: any) => request.post<any, any>('/refunds', data),
  sendReminder: (id: number) => request.post<any, any>(`/refunds/${id}/reminder`),
  approve: (id: number, data: { remark?: string }) =>
    request.post<any, any>(`/refunds/${id}/approve`, data),
  reject: (id: number, data: { remark?: string }) =>
    request.post<any, any>(`/refunds/${id}/reject`, data),
};

export const assignmentApi = {
  classList: (classId: number) => request.get<any, any[]>(`/assignments/class/${classId}`),
  submissions: (assignmentId: number) =>
    request.get<any, any[]>(`/assignments/${assignmentId}/submissions`),
  submit: (data: { assignmentId: number; content?: string; attachmentUrl?: string }) =>
    request.post<any, any>('/assignments/submit', data),
  review: (id: number, data: { score?: number; comment?: string }) =>
    request.post<any, any>(`/assignments/submissions/${id}/review`, data),
};

export const distributionApi = {
  commissions: (params: PageParams) =>
    request.get<any, PageResult<any>>('/distribution/commissions', { params }),
  settleCommission: (id: number, data: { remark?: string }) =>
    request.post<any, any>(`/distribution/commissions/${id}/settle`, data),
};

export const materialApi = {
  list: (classId: number) => request.get<any, any[]>(`/class-materials/class/${classId}`),
  create: (data: any) => request.post<any, any>('/class-materials', data),
  delete: (id: number) => request.delete<any, any>(`/class-materials/${id}`),
};

export const panelApi = {
  attachments: (bizType: string, bizId: number) =>
    request.get<any, any[]>(`/panel/${bizType}/${bizId}/attachments`),
  addAttachment: (bizType: string, bizId: number, data: any) =>
    request.post<any, any>(`/panel/${bizType}/${bizId}/attachments`, data),
  deleteAttachment: (id: number) => request.delete<any, any>(`/panel/attachments/${id}`),
  remarks: (bizType: string, bizId: number) =>
    request.get<any, any[]>(`/panel/${bizType}/${bizId}/remarks`),
  addRemark: (bizType: string, bizId: number, content: string) =>
    request.post<any, any>(`/panel/${bizType}/${bizId}/remarks`, { content }),
  history: (bizType: string, bizId: number) =>
    request.get<any, any[]>(`/panel/${bizType}/${bizId}/history`),
  statusFlow: (bizType: string, bizId: number) =>
    request.get<any, any[]>(`/panel/${bizType}/${bizId}/status-flow`),
};
