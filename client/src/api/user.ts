import request from './request';
import type { User, PaginatedResponse } from '@/types';

export const getUserList = (params?: {
  page?: number;
  pageSize?: number;
  role?: string;
  department?: string;
  keyword?: string;
}) => {
  return request.get<PaginatedResponse<User>>('/users', { params });
};

export const createUser = (data: {
  username: string;
  password?: string;
  name: string;
  email?: string;
  department: string;
  role?: string;
}) => {
  return request.post<User>('/users', data);
};

export const updateUser = (id: number, data: Partial<{
  name: string;
  email: string;
  department: string;
  role: string;
  password: string;
}>) => {
  return request.put<User>(`/users/${id}`, data);
};

export const getDepartmentList = () => {
  return request.get<string[]>('/users/departments');
};
