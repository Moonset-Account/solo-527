import api from './client';
import type { OverdueDetail, MismatchRecord, PaginatedResponse } from '@/types';

interface LastAction {
  reminder_id: number;
  reconciliation_id: number;
  project_name: string;
  assignee_name: string;
  status: string;
  handled_at: string | null;
  escalation_level: number;
}

export function getOverdueDetails(params?: Record<string, unknown>) {
  return api.get<OverdueDetail[]>('/api/reports/overdue/', { params });
}

export function getMismatches(params?: Record<string, unknown>) {
  return api.get<MismatchRecord[]>('/api/reports/mismatches/', { params });
}

export function getLastActions(params?: Record<string, unknown>) {
  return api.get<LastAction[]>('/api/reports/last-actions/', { params });
}

export function getOverdueExportUrl() {
  return '/api/reports/overdue/export/';
}

export function getMismatchExportUrl() {
  return '/api/reports/mismatches/export/';
}
