import request from '@/utils/request';
import type { User, LoginCredentials, ApiResponse } from '@/types';

interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    return request.post('/auth/login', credentials);
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return request.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return request.get('/auth/me');
  },
};
