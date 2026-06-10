import request from './request'

export const login = (data: { username: string; password: string }) =>
  request.post<any, any>('/auth/login', data)

export const logout = () => request.post<any, any>('/auth/logout')

export const getMe = () => request.get<any, any>('/auth/me')
