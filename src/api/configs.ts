import api from './client';
import type { InvoiceConfig, PrepaidConfig, CashForecastConfig, ConfigChangelog, PaginatedResponse } from '@/types';

export function getInvoiceConfig() {
  return api.get<InvoiceConfig>('/api/invoice-config/1/');
}

export function updateInvoiceConfig(data: Partial<InvoiceConfig>) {
  return api.put<InvoiceConfig>('/api/invoice-config/1/', data);
}

export function getPrepaidConfig() {
  return api.get<PrepaidConfig>('/api/prepaid-config/1/');
}

export function updatePrepaidConfig(data: Partial<PrepaidConfig>) {
  return api.put<PrepaidConfig>('/api/prepaid-config/1/', data);
}

export function getCashForecastConfig() {
  return api.get<CashForecastConfig>('/api/cash-forecast-config/1/');
}

export function updateCashForecastConfig(data: Partial<CashForecastConfig>) {
  return api.put<CashForecastConfig>('/api/cash-forecast-config/1/', data);
}

export function getConfigChangelog(params?: Record<string, unknown>) {
  return api.get<PaginatedResponse<ConfigChangelog>>('/api/config-changelog/', { params });
}
