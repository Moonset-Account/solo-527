import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

export function getUsers(params: any) {
  return request.get<PageResult>('/users', { params })
}

export function getUser(id: string) {
  return request.get(`/users/${id}`)
}

export function createUser(data: any) {
  return request.post('/users', data)
}

export function updateUser(id: string, data: any) {
  return request.patch(`/users/${id}`, data)
}

export function deleteUser(id: string) {
  return request.delete(`/users/${id}`)
}

export function getExpiringUsers(days: number = 7) {
  return request.get('/users/expiring', { params: { days } })
}

export function getOperatorOwners() {
  return request.get('/users/operator-owners')
}
