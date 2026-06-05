import api from './index'

export interface LoginData {
  username: string
  password: string
}

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: string
  phone?: string
  department?: string
  is_active: boolean
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export const authApi = {
  login: (data: LoginData) => {
    const formData = new FormData()
    formData.append('username', data.username)
    formData.append('password', data.password)
    return api.post<any, LoginResponse>('/auth/login', formData)
  },
  
  getProfile: () => {
    return api.get<any, User>('/auth/me')
  },
  
  logout: () => {
    return api.post('/auth/logout')
  }
}
