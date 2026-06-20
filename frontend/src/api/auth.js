import request from '@/utils/request'

export const login = (username, password) => {
  return request.post('/auth/login', { username, password })
}

export const logout = () => {
  return request.post('/auth/logout')
}

export const getProfile = () => {
  return request.get('/auth/profile')
}
