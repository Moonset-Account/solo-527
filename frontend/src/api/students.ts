import apiClient from './client';
import { Student, PaginatedResponse } from '../types';

export const studentsApi = {
  list: (params?: any) => 
    apiClient.get<PaginatedResponse<Student>>('/students', { params }),
  get: (id: number) => apiClient.get<Student>(`/students/${id}`),
  update: (id: number, data: any) => apiClient.put(`/students/${id}`, data),
  review: (id: number, status: string) => 
    apiClient.post(`/students/${id}/review`, { status }),
};
