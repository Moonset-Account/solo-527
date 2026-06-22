import request from './request';
import type { LoginResponse, User } from '@/types';

export const login = (username: string, password: string) => {
  return request.post<LoginResponse>('/auth/login', { username, password });
};

export const getCurrentUser = () => {
  return request.get<User>('/auth/me');
};
