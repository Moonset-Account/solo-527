import api, { ApiResponse, PaginatedResponse } from '../utils/api';
import type { User } from '../store/authStore';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: (data: LoginParams): Promise<ApiResponse<LoginResponse>> =>
    api.post('/auth/login', data),

  register: (data: any): Promise<ApiResponse<User>> =>
    api.post('/auth/register', data),

  getProfile: (): Promise<ApiResponse<User>> =>
    api.get('/auth/profile'),

  getUsers: (params?: { role?: string; page?: number; pageSize?: number }): Promise<ApiResponse<PaginatedResponse<User>>> =>
    api.get('/auth/users', { params }),

  updateUser: (id: string, data: any): Promise<ApiResponse<User>> =>
    api.put(`/auth/users/${id}`, data),

  deleteUser: (id: string): Promise<ApiResponse<null>> =>
    api.delete(`/auth/users/${id}`),
};
