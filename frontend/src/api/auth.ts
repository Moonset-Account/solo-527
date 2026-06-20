import request from '@/utils/request';
import { LoginResponse } from '@/types';

export interface LoginParams {
  email: string;
  password: string;
}

export const login = (data: LoginParams): Promise<LoginResponse> => {
  return request.post('/auth/login', data);
};

export const logout = (): Promise<void> => {
  return request.post('/auth/logout');
};

export const getCurrentUser = (): Promise<any> => {
  return request.get('/users/me');
};
