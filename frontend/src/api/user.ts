import request from './request';
import type { User } from '@/types';

export const login = (data: { username: string; password: string }) =>
  request.post('/auth/login', data);

export const getProfile = () => request.get('/auth/profile');

export const getUsers = (params?: any) => request.get('/users', { params });

export const createUser = (data: any) => request.post('/users', data);

export const updateUser = (id: string, data: any) => request.put(`/users/${id}`, data);

export const updateUserStatus = (id: string, status: string) =>
  request.put(`/users/${id}/status`, { status });

export const deleteUser = (id: string) => request.delete(`/users/${id}`);
