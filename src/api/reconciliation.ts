import api from './client';
import type { Reconciliation, Difference, PaginatedResponse } from '@/types';

export function getReconciliations(params?: Record<string, unknown>) {
  return api.get<PaginatedResponse<Reconciliation>>('/api/reconciliations/', { params });
}

export function createReconciliation(formData: FormData) {
  return api.post<Reconciliation>('/api/reconciliations/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function getReconciliation(id: number) {
  return api.get<Reconciliation>(`/api/reconciliations/${id}/`);
}

export function confirmReconciliation(id: number) {
  return api.post<Reconciliation>(`/api/reconciliations/${id}/confirm/`);
}

export function rejectReconciliation(id: number) {
  return api.post<Reconciliation>(`/api/reconciliations/${id}/reject/`);
}

export function getDifferences(id: number) {
  return api.get<Difference[]>(`/api/reconciliations/${id}/differences/`);
}
