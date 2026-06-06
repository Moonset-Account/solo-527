import request from '@/utils/request'

export const login = (email: string, password: string) => {
  return request.post('/auth/sign_in', { email, password })
}

export const register = (data: any) => {
  return request.post('/auth', data)
}

export const logout = () => {
  return request.delete('/auth/sign_out')
}

export const getCurrentUser = () => {
  return request.get('/auth/validate_token')
}
