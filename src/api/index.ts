const BASE_URL = '/api';

async function fetchAPI<T>(url: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
  }
  const fullUrl = `${BASE_URL}${url}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

import type {
  DishSatisfaction,
  ReturnReason,
  ReturnDetail,
  CostProfit,
  AbnormalDish,
  SupplierChangeEvent,
  BatchRecallEvent,
  ScoreTrend,
  FilterOptions,
  FilterParams,
} from '@/types';

export const api = {
  getFilterOptions: () => fetchAPI<FilterOptions>('/filters/options'),

  getSatisfaction: (filters: FilterParams) =>
    fetchAPI<DishSatisfaction[]>('/dishes/satisfaction', filters as Record<string, string | number | boolean | undefined>),

  getReturnReasons: (filters: FilterParams) =>
    fetchAPI<ReturnReason[]>('/returns/reasons', filters as Record<string, string | number | boolean | undefined>),

  getReturnDetails: (reason?: string, window_id?: string, date?: string) =>
    fetchAPI<ReturnDetail[]>('/returns/details', { reason, window_id, date }),

  getCostProfits: (filters: FilterParams) =>
    fetchAPI<CostProfit[]>('/costs/profits', filters as Record<string, string | number | boolean | undefined>),

  getAbnormalDishes: (filters: FilterParams) =>
    fetchAPI<AbnormalDish[]>('/dishes/abnormal', filters as Record<string, string | number | boolean | undefined>),

  getSupplierChanges: () => fetchAPI<SupplierChangeEvent[]>('/supplier-changes'),

  createSupplierChange: (data: { window_id: string; change_date: string; old_supplier: string; new_supplier: string }) =>
    fetch(`${BASE_URL}/supplier-changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  getBatchRecalls: () => fetchAPI<BatchRecallEvent[]>('/batch-recalls'),

  createBatchRecall: (data: { batch_id: string; ingredient_name: string; recall_date: string; affected_dish_ids: string[] }) =>
    fetch(`${BASE_URL}/batch-recalls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  getDishTrend: (dish_id: string, date_from?: string, date_to?: string) =>
    fetchAPI<ScoreTrend>('/dishes/trend', { dish_id: Number(dish_id), date_from, date_to }),

  exportReport: (filters: FilterParams, format: string = 'csv') => {
    const params = new URLSearchParams();
    params.append('format', format);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    window.open(`${BASE_URL}/reports/export?${params.toString()}`);
  },
};
