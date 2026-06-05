import client from './client';
import type { User } from '@/types';

interface LoginResponse {
  token: string;
  user: User;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await client.post<LoginResponse>('/accounts/login/', { username, password });
  return res.data;
}

export async function getProfile(): Promise<User> {
  const res = await client.get<User>('/accounts/profile/');
  return res.data;
}

export async function changePassword(data: {
  old_password: string;
  new_password: string;
}): Promise<void> {
  await client.put('/accounts/change-password/', data);
}
