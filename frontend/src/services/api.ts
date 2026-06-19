import api from '../utils/request';
import type { ApiResponse, LoginResponse, PagedResult, PagedQuery, UserInfo, Space, SpaceQuery, Appointment, NoShowRecord, Contract, Bill, Order, OperationLog } from '../types';

export const authApi = {
  login: (data: { userName: string; password: string }) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', data).then((res) => res.data),
  register: (data: any) =>
    api.post<ApiResponse>('/auth/register', data).then((res) => res.data),
  me: () =>
    api.get<ApiResponse<UserInfo>>('/auth/me').then((res) => res.data),
};

export const spaceApi = {
  list: (params: any) =>
    api.get<ApiResponse<PagedResult<Space>>>('/spaces', { params }).then((res) => res.data),
  detail: (id: string) =>
    api.get<ApiResponse<Space>>(`/spaces/${id}`).then((res) => res.data),
  create: (data: any) =>
    api.post<ApiResponse<Space>>('/spaces', data).then((res) => res.data),
  update: (id: string, data: any) =>
    api.put<ApiResponse>(`/spaces/${id}`, data).then((res) => res.data),
  remove: (id: string) =>
    api.delete<ApiResponse>(`/spaces/${id}`).then((res) => res.data),
  addPrice: (spaceId: string, data: any) =>
    api.post<ApiResponse>(`/spaces/${spaceId}/prices`, data).then((res) => res.data),
  exportAppointments: (params: any) =>
    api.get('/appointments/export', { params, responseType: 'blob' }).then((res) => res.data),
};

export const appointmentApi = {
  list: (params: any) =>
    api.get<ApiResponse<PagedResult<Appointment>>>('/appointments', { params }).then((res) => res.data),
  detail: (id: string) =>
    api.get<ApiResponse<Appointment>>(`/appointments/${id}`).then((res) => res.data),
  create: (data: any) =>
    api.post<ApiResponse<Appointment>>('/appointments', data).then((res) => res.data),
  assignConsultant: (id: string, data: { consultantId: string }) =>
    api.put<ApiResponse>(`/appointments/${id}/assign`, data).then((res) => res.data),
  updateStatus: (id: string, data: any) =>
    api.put<ApiResponse>(`/appointments/${id}/status`, data).then((res) => res.data),
  addFollowUp: (id: string, data: any) =>
    api.post<ApiResponse>(`/appointments/${id}/followups`, data).then((res) => res.data),
  markNoShow: (id: string, reason?: string) =>
    api.put<ApiResponse>(`/appointments/${id}/noshow`, null, { params: { reason } }).then((res) => res.data),
  noShowList: (params: any) =>
    api.get<ApiResponse<PagedResult<NoShowRecord>>>('/appointments/noshow', { params }).then((res) => res.data),
  noShowDetail: (id: string) =>
    api.get<ApiResponse<NoShowRecord>>(`/appointments/noshow/${id}`).then((res) => res.data),
  handleNoShow: (id: string, data: any) =>
    api.put<ApiResponse>(`/appointments/noshow/${id}/handle`, data).then((res) => res.data),
  export: (params: any) =>
    api.get('/appointments/export', { params, responseType: 'blob' }).then((res) => res.data),
};

export const contractApi = {
  list: (params: any) =>
    api.get<ApiResponse<PagedResult<Contract>>>('/contracts', { params }).then((res) => res.data),
  detail: (id: string) =>
    api.get<ApiResponse<Contract>>(`/contracts/${id}`).then((res) => res.data),
  create: (data: any) =>
    api.post<ApiResponse<Contract>>('/contracts', data).then((res) => res.data),
  sign: (id: string, data: any) =>
    api.put<ApiResponse>(`/contracts/${id}/sign`, data).then((res) => res.data),
  terminate: (id: string, reason: string) =>
    api.put<ApiResponse>(`/contracts/${id}/terminate`, null, { params: { reason } }).then((res) => res.data),
  bills: (params: any) =>
    api.get<ApiResponse<PagedResult<Bill>>>('/contracts/bills', { params }).then((res) => res.data),
  billDetail: (id: string) =>
    api.get<ApiResponse<Bill>>(`/contracts/bills/${id}`).then((res) => res.data),
  createBill: (data: any) =>
    api.post<ApiResponse<Bill>>('/contracts/bills', data).then((res) => res.data),
  payBill: (billId: string, data: any) =>
    api.put<ApiResponse>(`/contracts/bills/${billId}/pay`, data).then((res) => res.data),
  exportContracts: (params: any) =>
    api.get('/contracts/export', { params, responseType: 'blob' }).then((res) => res.data),
  exportBills: (params: any) =>
    api.get('/contracts/bills/export', { params, responseType: 'blob' }).then((res) => res.data),
};

export const orderApi = {
  list: (params: any) =>
    api.get<ApiResponse<PagedResult<Order>>>('/orders', { params }).then((res) => res.data),
  detail: (id: string) =>
    api.get<ApiResponse<Order>>(`/orders/${id}`).then((res) => res.data),
  create: (data: any) =>
    api.post<ApiResponse<Order>>('/orders', data).then((res) => res.data),
  pay: (id: string, data: any) =>
    api.put<ApiResponse>(`/orders/${id}/pay`, data).then((res) => res.data),
  cancel: (id: string, reason: string) =>
    api.put<ApiResponse>(`/orders/${id}/cancel`, null, { params: { reason } }).then((res) => res.data),
  updateFulfillment: (orderId: string, fulfillmentId: string, data: any) =>
    api.put<ApiResponse>(`/orders/${orderId}/fulfillments/${fulfillmentId}`, data).then((res) => res.data),
  export: (params: any) =>
    api.get('/orders/export', { params, responseType: 'blob' }).then((res) => res.data),
};

export const logApi = {
  list: (params: any) =>
    api.get<ApiResponse<PagedResult<OperationLog>>>('/logs', { params }).then((res) => res.data),
  export: (params: any) =>
    api.get('/logs/export', { params, responseType: 'blob' }).then((res) => res.data),
};
