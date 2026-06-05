import apiClient from './client';
import { IndustryTag } from '../types';

export const industryApi = {
  list: () => apiClient.get<IndustryTag[]>('/industry-tags'),
  create: (data: any) => apiClient.post('/industry-tags', data),
  update: (id: number, data: any) => apiClient.put(`/industry-tags/${id}`, data),
  delete: (id: number) => apiClient.delete(`/industry-tags/${id}`),
};
