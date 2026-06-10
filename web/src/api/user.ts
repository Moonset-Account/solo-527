import request from './request';
import type { User, PaginatedResponse, PaginationParams, UserRole } from '@/types';

export const userApi = {
  findAll: (params?: PaginationParams): Promise<PaginatedResponse<User>> => {
    return request.get('/users', { params });
  },

  findByRole: (role: UserRole, params?: PaginationParams): Promise<PaginatedResponse<User>> => {
    return request.get(`/users/role/${role}`, { params });
  },

  findOne: (id: string): Promise<User> => {
    return request.get(`/users/${id}`);
  },

  create: (dto: Partial<User>, operator?: string): Promise<User> => {
    return request.post('/users', dto, { params: { operator } });
  },

  update: (id: string, dto: Partial<User>, operator?: string): Promise<User> => {
    return request.put(`/users/${id}`, dto, { params: { operator } });
  },

  remove: (id: string): Promise<{ success: boolean }> => {
    return request.delete(`/users/${id}`);
  },
};
