import request from '@/utils/request';
import { User, SearchParams, PaginatedResult } from '@/types';

export interface CreateUserParams {
  username: string;
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
  department?: string;
  position?: string;
}

export interface UpdateUserParams extends Partial<CreateUserParams> {
  isActive?: boolean;
}

export const getUsers = (params?: SearchParams): Promise<PaginatedResult<User>> => {
  return request.get('/users', { params });
};

export const getUserById = (id: string): Promise<User> => {
  return request.get(`/users/${id}`);
};

export const getInterviewers = (): Promise<User[]> => {
  return request.get('/users/interviewers');
};

export const createUser = (data: CreateUserParams): Promise<User> => {
  return request.post('/users', data);
};

export const updateUser = (id: string, data: UpdateUserParams): Promise<User> => {
  return request.patch(`/users/${id}`, data);
};

export const deleteUser = (id: string): Promise<User> => {
  return request.delete(`/users/${id}`);
};
