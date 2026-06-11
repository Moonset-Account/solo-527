import { get, post, put, del } from '@/utils/request'

export interface UserItem {
  _id: string
  name: string
  phone: string
  avatar?: string
  level: 'normal' | 'vip'
  createdAt: string
  updatedAt: string
}

export interface UserListResult {
  data: UserItem[]
  total: number
  page: number
  pageSize: number
}

export interface CreateUserParams {
  name: string
  phone: string
  avatar?: string
  level?: 'normal' | 'vip'
}

export function createUser(params: CreateUserParams) {
  return post<UserItem>('/users', params)
}
export function getUserList(params?: any) {
  return get<UserListResult>('/users', params)
}
export function getUserById(id: string) {
  return get<UserItem>(`/users/${id}`)
}
export function getUserByPhone(phone: string) {
  return get<UserItem>(`/users/phone/${phone}`)
}
export function updateUser(id: string, params: any) {
  return put<UserItem>(`/users/${id}`, params)
}
export function deleteUser(id: string) {
  return del<void>(`/users/${id}`)
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: {
    id: number | string
    username: string
    nickname: string
    avatar: string
    roles: string[]
  }
}

export function login(params: LoginParams) {
  return post<LoginResult>('/auth/login', params)
}
