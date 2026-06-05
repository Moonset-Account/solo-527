import client from './client';
import type { FeeItem, Payment, LeaveRequest, PaginatedResponse } from '@/types';

export async function getFeeItems(params?: Record<string, unknown>): Promise<PaginatedResponse<FeeItem>> {
  const res = await client.get<PaginatedResponse<FeeItem>>('/finance/fee-items/', { params });
  return res.data;
}

export async function createFeeItem(data: Record<string, unknown>): Promise<FeeItem> {
  const res = await client.post<FeeItem>('/finance/fee-items/', data);
  return res.data;
}

export async function getPayments(params?: Record<string, unknown>): Promise<PaginatedResponse<Payment>> {
  const res = await client.get<PaginatedResponse<Payment>>('/finance/payments/', { params });
  return res.data;
}

export async function updatePayment(id: number, data: Record<string, unknown>): Promise<Payment> {
  const res = await client.put<Payment>(`/finance/payments/${id}/`, data);
  return res.data;
}

export async function exportPayments(): Promise<Blob> {
  const res = await client.get('/finance/payments/export/', { responseType: 'blob' });
  return res.data as Blob;
}

export async function getLeaves(params?: Record<string, unknown>): Promise<PaginatedResponse<LeaveRequest>> {
  const res = await client.get<PaginatedResponse<LeaveRequest>>('/finance/leaves/', { params });
  return res.data;
}

export async function createLeave(data: Record<string, unknown>): Promise<LeaveRequest> {
  const res = await client.post<LeaveRequest>('/finance/leaves/', data);
  return res.data;
}

export async function reviewLeave(id: number, action: 'approved' | 'rejected', remark?: string): Promise<LeaveRequest> {
  const res = await client.post<LeaveRequest>(`/finance/leaves/${id}/review/`, { action, remark });
  return res.data;
}
