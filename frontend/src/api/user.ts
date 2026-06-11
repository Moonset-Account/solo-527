import { get, post, put, del } from '@/utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
}

export interface UserItem {
  id: number
  username: string
  nickname: string
  email: string
  phone: string
  status: 0 | 1
  createTime: string
  updateTime: string
}

export interface UserListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: 0 | 1
}

export interface UserListResult {
  list: UserItem[]
  total: number
  page: number
  pageSize: number
}

export function login(params: LoginParams) {
  return post<LoginResult>('/auth/login', params)
}

export function logout() {
  return post<void>('/auth/logout')
}

export function getUserInfo() {
  return get<UserItem>('/auth/userinfo')
}

export function getUserList(params?: UserListParams) {
  return get<UserListResult>('/users', params)
}

export function getUserDetail(id: number) {
  return get<UserItem>(`/users/${id}`)
}

export function createUser(data: Partial<UserItem>) {
  return post<UserItem>('/users', data)
}

export function updateUser(id: number, data: Partial<UserItem>) {
  return put<UserItem>(`/users/${id}`, data)
}

export function deleteUser(id: number) {
  return del<void>(`/users/${id}`)
}
