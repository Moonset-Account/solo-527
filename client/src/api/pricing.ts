import request from './request';
import type { PricingPlan, PaginatedResponse } from '@/types';

export const getPlanList = (params?: {
  page?: number;
  pageSize?: number;
  pluginId?: number;
  status?: string;
  billingCycle?: string;
}) => {
  return request.get<PaginatedResponse<PricingPlan>>('/pricing/plans', { params });
};

export const createPlan = (data: {
  pluginId: number;
  name: string;
  code: string;
  description: string;
  seatCount: number;
  features: string[];
  billingCycle: string;
  price: number;
}) => {
  return request.post<PricingPlan>('/pricing/plans', data);
};

export const updatePlan = (id: number, data: Partial<{
  name: string;
  description: string;
  seatCount: number;
  features: string[];
  billingCycle: string;
  price: number;
  status: string;
}>) => {
  return request.put<PricingPlan>(`/pricing/plans/${id}`, data);
};
