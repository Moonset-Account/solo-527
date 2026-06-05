import client from './client';
import type { PickupRecord, TodayPickupStats, PaginatedResponse } from '@/types';

export async function getPickupRecords(params?: Record<string, unknown>): Promise<PaginatedResponse<PickupRecord>> {
  const res = await client.get<PaginatedResponse<PickupRecord>>('/pickup/', { params });
  return res.data;
}

export async function createPickupRecord(data: Record<string, unknown>): Promise<PickupRecord> {
  const res = await client.post<PickupRecord>('/pickup/', data);
  return res.data;
}

export async function verifyPickup(id: number, action: 'verified' | 'rejected', remark?: string): Promise<PickupRecord> {
  const res = await client.post<PickupRecord>(`/pickup/${id}/verify/`, { action, remark });
  return res.data;
}

export async function getTodayStats(): Promise<TodayPickupStats> {
  const res = await client.get<TodayPickupStats>('/pickup/stats/today/');
  return res.data;
}
