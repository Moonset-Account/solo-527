import client from './client';
import type { DailyRecord, PaginatedResponse } from '@/types';

export async function getDailyRecords(params?: Record<string, unknown>): Promise<PaginatedResponse<DailyRecord>> {
  const res = await client.get<PaginatedResponse<DailyRecord>>('/daily-records/', { params });
  return res.data;
}

export async function createDailyRecord(data: Record<string, unknown>): Promise<DailyRecord> {
  const res = await client.post<DailyRecord>('/daily-records/', data);
  return res.data;
}

export async function updateDailyRecord(id: number, data: Record<string, unknown>): Promise<DailyRecord> {
  const res = await client.put<DailyRecord>(`/daily-records/${id}/`, data);
  return res.data;
}

export async function uploadPhoto(data: FormData): Promise<void> {
  await client.post('/daily-records/photos/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
