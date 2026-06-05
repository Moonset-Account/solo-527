import client from './client';
import type { Child, ClassGroup, AuthorizedPickupPerson, PaginatedResponse } from '@/types';

export async function getChildren(params?: Record<string, unknown>): Promise<PaginatedResponse<Child>> {
  const res = await client.get<PaginatedResponse<Child>>('/children/', { params });
  return res.data;
}

export async function getChild(id: number): Promise<Child> {
  const res = await client.get<Child>(`/children/${id}/`);
  return res.data;
}

export async function createChild(data: Record<string, unknown>): Promise<Child> {
  const res = await client.post<Child>('/children/', data);
  return res.data;
}

export async function updateChild(id: number, data: Record<string, unknown>): Promise<Child> {
  const res = await client.put<Child>(`/children/${id}/`, data);
  return res.data;
}

export async function getClasses(params?: Record<string, unknown>): Promise<PaginatedResponse<ClassGroup>> {
  const res = await client.get<PaginatedResponse<ClassGroup>>('/children/classes/', { params });
  return res.data;
}

export async function createClass(data: Record<string, unknown>): Promise<ClassGroup> {
  const res = await client.post<ClassGroup>('/children/classes/', data);
  return res.data;
}

export async function createAuthorizedPickup(
  childId: number,
  data: Record<string, unknown>,
): Promise<AuthorizedPickupPerson> {
  const res = await client.post<AuthorizedPickupPerson>(`/children/${childId}/pickups/`, data);
  return res.data;
}

export async function updateAuthorizedPickup(
  childId: number,
  pickupId: number,
  data: Record<string, unknown>,
): Promise<AuthorizedPickupPerson> {
  const res = await client.put<AuthorizedPickupPerson>(`/children/${childId}/pickups/${pickupId}/`, data);
  return res.data;
}
