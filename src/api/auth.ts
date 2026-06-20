import api from './client';
import type { User } from '@/types';

interface LoginResponse {
  access: string;
  refresh: string;
}

interface RefreshResponse {
  access: string;
}

export function login(username: string, password: string) {
  return api.post<LoginResponse>('/api/auth/login/', { username, password });
}

export function refreshToken(refresh: string) {
  return api.post<RefreshResponse>('/api/auth/refresh/', { refresh });
}

export function getProfile() {
  return api.get<User>('/api/auth/profile/');
}

export function getUsers() {
  return api.get<User[]>('/api/users/');
}
