import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type {
  User,
  Item,
  Review,
  Department,
  Attachment,
  Config,
  Log,
  Progress,
  LoginResponse,
  ReviewStatistics,
  ApiResponse,
  PaginatedResponse,
  ItemStatus,
  ItemPriority,
  ReviewConclusion,
  LogType,
} from '@/types'

const axiosInstance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export const auth = {
  login: (username: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    return axiosInstance.post('/auth/login', { username, password })
  },
  refreshToken: (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> => {
    return axiosInstance.post('/auth/refresh', { refreshToken })
  },
  getProfile: (): Promise<ApiResponse<User>> => {
    return axiosInstance.get('/auth/profile')
  },
}

export const items = {
  getList: (params?: {
    page?: number
    pageSize?: number
    status?: ItemStatus
    department?: string
    assignee?: string
    keyword?: string
  }): Promise<ApiResponse<PaginatedResponse<Item>>> => {
    return axiosInstance.get('/api/items', { params })
  },
  getDetail: (id: string): Promise<ApiResponse<Item & { progressList: Progress[]; attachments: Attachment[] }>> => {
    return axiosInstance.get(`/api/items/${id}`)
  },
  create: (data: {
    title: string
    description: string
    priority: ItemPriority
    department: string
    assignee: string
    deadline: string
  }): Promise<ApiResponse<Item>> => {
    return axiosInstance.post('/api/items', data)
  },
  update: (
    id: string,
    data: {
      title?: string
      description?: string
      status?: ItemStatus
      priority?: ItemPriority
      department?: string
      assignee?: string
      deadline?: string
    },
  ): Promise<ApiResponse<Item>> => {
    return axiosInstance.patch(`/api/items/${id}`, data)
  },
  claim: (id: string): Promise<ApiResponse<Item>> => {
    return axiosInstance.post(`/api/items/${id}/claim`)
  },
  addProgress: (
    id: string,
    content: string,
    attachments?: string[],
  ): Promise<ApiResponse<Progress>> => {
    return axiosInstance.post(`/api/items/${id}/progress`, { content, attachments })
  },
}

export const reviews = {
  getList: (params?: {
    page?: number
    pageSize?: number
    itemId?: string
    conclusion?: ReviewConclusion
  }): Promise<ApiResponse<PaginatedResponse<Review>>> => {
    return axiosInstance.get('/api/reviews', { params })
  },
  create: (data: {
    itemId: string
    conclusion: ReviewConclusion
    remark: string
  }): Promise<ApiResponse<Review>> => {
    return axiosInstance.post('/api/reviews', data)
  },
  update: (
    id: string,
    data: {
      conclusion?: ReviewConclusion
      remark?: string
    },
  ): Promise<ApiResponse<Review>> => {
    return axiosInstance.patch(`/api/reviews/${id}`, data)
  },
  getStatistics: (params?: {
    department?: string
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<ReviewStatistics>> => {
    return axiosInstance.get('/api/reviews/statistics', { params })
  },
}

export const configs = {
  getConfig: (): Promise<ApiResponse<Config[]>> => {
    return axiosInstance.get('/configs')
  },
  updateSwitch: (key: string, value: boolean): Promise<ApiResponse<Config>> => {
    return axiosInstance.patch('/configs/switches', { key, value })
  },
  getDepartments: (): Promise<ApiResponse<Department[]>> => {
    return axiosInstance.get('/configs/departments')
  },
  createDepartment: (data: { name: string; head: string }): Promise<ApiResponse<Department>> => {
    return axiosInstance.post('/configs/departments', data)
  },
  updateDepartment: (
    id: string,
    data: { name?: string; head?: string },
  ): Promise<ApiResponse<Department>> => {
    return axiosInstance.patch(`/configs/departments/${id}`, data)
  },
  deleteDepartment: (id: string): Promise<ApiResponse<void>> => {
    return axiosInstance.delete(`/configs/departments/${id}`)
  },
  getAttachments: (params?: { refId?: string; refType?: string }): Promise<ApiResponse<Attachment[]>> => {
    return axiosInstance.get('/configs/attachments', { params })
  },
  uploadAttachment: (
    file: File,
    refId: string,
    refType?: 'item' | 'config',
  ): Promise<ApiResponse<Attachment>> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('refId', refId)
    if (refType) {
      formData.append('refType', refType)
    }
    return axiosInstance.post('/configs/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  getChangelog: (params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Log>>> => {
    return axiosInstance.get('/configs/changelog', { params })
  },
}

export const users = {
  getList: (params?: {
    page?: number
    pageSize?: number
    role?: 'pm' | 'admin'
    keyword?: string
    status?: 'active' | 'disabled'
  }): Promise<ApiResponse<PaginatedResponse<User>>> => {
    return axiosInstance.get('/users', { params })
  },
  create: (data: {
    username: string
    password: string
    name: string
    role: 'pm' | 'admin'
    department: string
    status?: 'active' | 'disabled'
  }): Promise<ApiResponse<User>> => {
    return axiosInstance.post('/users', data)
  },
  update: (
    id: string,
    data: {
      name?: string
      role?: 'pm' | 'admin'
      department?: string
      status?: 'active' | 'disabled'
      password?: string
    },
  ): Promise<ApiResponse<User>> => {
    return axiosInstance.patch(`/users/${id}`, data)
  },
  remove: (id: string): Promise<ApiResponse<void>> => {
    return axiosInstance.delete(`/users/${id}`)
  },
}

export const logs = {
  getList: (params?: {
    page?: number
    pageSize?: number
    type?: LogType
    operator?: string
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<PaginatedResponse<Log>>> => {
    return axiosInstance.get('/logs', { params })
  },
}

export default {
  auth,
  items,
  reviews,
  configs,
  users,
  logs,
}
