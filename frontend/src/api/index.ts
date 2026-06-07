import axios from 'axios';
import { FilterState } from '../types';

const api = axios.create({
  baseURL: '/api',
});

function buildParams(filters: FilterState) {
  const params: Record<string, string | number | boolean> = {};
  if (filters.start_date) params.start_date = filters.start_date;
  if (filters.end_date) params.end_date = filters.end_date;
  if (filters.floor !== null) params.floor = filters.floor;
  if (filters.shift !== null) params.shift = filters.shift;
  if (filters.is_vip !== null) params.is_vip = filters.is_vip;
  if (filters.is_late_checkout !== null) params.is_late_checkout = filters.is_late_checkout;
  if (filters.cleaner_id !== null) params.cleaner_id = filters.cleaner_id;
  return params;
}

export async function fetchFloorHeatmap(filters: FilterState) {
  const res = await api.get('/floor-heatmap', { params: buildParams(filters) });
  return res.data;
}

export async function fetchReworkTrend(filters: FilterState) {
  const res = await api.get('/rework-trend', { params: buildParams(filters) });
  return res.data;
}

export async function fetchShiftComparison(filters: FilterState) {
  const res = await api.get('/shift-comparison', { params: buildParams(filters) });
  return res.data;
}

export async function fetchWorkOrders(filters: FilterState) {
  const res = await api.get('/work-orders', { params: buildParams(filters) });
  return res.data;
}

export async function fetchCleanerPerformance(filters: FilterState) {
  const res = await api.get('/cleaner-performance', { params: buildParams(filters) });
  return res.data;
}

export async function fetchRooms() {
  const res = await api.get('/rooms');
  return res.data;
}

export async function fetchCleaners() {
  const res = await api.get('/cleaners');
  return res.data;
}

export function getWeeklyReportUrl(filters: FilterState) {
  const params = new URLSearchParams();
  if (filters.start_date) params.set('start_date', filters.start_date);
  if (filters.end_date) params.set('end_date', filters.end_date);
  if (filters.floor !== null) params.set('floor', String(filters.floor));
  if (filters.shift !== null) params.set('shift', filters.shift);
  if (filters.is_vip !== null) params.set('is_vip', String(filters.is_vip));
  if (filters.is_late_checkout !== null) params.set('is_late_checkout', String(filters.is_late_checkout));
  if (filters.cleaner_id !== null) params.set('cleaner_id', String(filters.cleaner_id));
  return `/api/weekly-report-export?${params.toString()}`;
}
