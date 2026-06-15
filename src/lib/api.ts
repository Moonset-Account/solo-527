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
  login: (username: string, password: string): Promise<LoginResponse> => {
    return axiosInstance.post('/auth/login', { username, password })
  },
  refreshToken: (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    return axiosInstance.post('/auth/refresh', { refreshToken })
  },
  getProfile: (): Promise<User> => {
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
  }): Promise<PaginatedResponse<Item>> => {
    return axiosInstance.get('/items', { params })
  },
  getDetail: (id: string): Promise<Item & { progressList: Progress[]; attachments: Attachment[] }> => {
    return axiosInstance.get(`/items/${id}`)
  },
  create: (data: {
    title: string
    description: string
    priority: ItemPriority
    department: string
    assignee: string
    deadline: string
  }): Promise<Item> => {
    return axiosInstance.post('/items', data)
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
  ): Promise<Item> => {
    return axiosInstance.patch(`/items/${id}`, data)
  },
  claim: (id: string): Promise<Item> => {
    return axiosInstance.post(`/items/${id}/claim`)
  },
  addProgress: (
    id: string,
    content: string,
    attachments?: string[],
  ): Promise<Progress> => {
    return axiosInstance.post(`/items/${id}/progress`, { content, attachments })
  },
}

export const reviews = {
  getList: (params?: {
    page?: number
    pageSize?: number
    itemId?: string
    conclusion?: ReviewConclusion
  }): Promise<PaginatedResponse<Review>> => {
    return axiosInstance.get('/reviews', { params })
  },
  create: (data: {
    itemId: string
    conclusion: ReviewConclusion
    remark: string
  }): Promise<Review> => {
    return axiosInstance.post('/reviews', data)
  },
  update: (
    id: string,
    data: {
      conclusion?: ReviewConclusion
      remark?: string
    },
  ): Promise<Review> => {
    return axiosInstance.patch(`/reviews/${id}`, data)
  },
  getStatistics: (params?: {
    department?: string
    startDate?: string
    endDate?: string
  }): Promise<ReviewStatistics> => {
    return axiosInstance.get('/reviews/statistics', { params })
  },
}

export const configs = {
  getConfig: (): Promise<{ switches: { key: string; value: boolean }[]; reviewTemplates: string[]; departments: Department[] }> => {
    return axiosInstance.get('/configs')
  },
  updateSwitch: (key: string, value: boolean): Promise<Config> => {
    return axiosInstance.patch('/configs/switches', { key, value })
  },
  getDepartments: (): Promise<Department[]> => {
    return axiosInstance.get('/configs/departments')
  },
  createDepartment: (data: { name: string; head: string }): Promise<Department> => {
    return axiosInstance.post('/configs/departments', data)
  },
  updateDepartment: (
    id: string,
    data: { name?: string; head?: string },
  ): Promise<Department> => {
    return axiosInstance.patch(`/configs/departments/${id}`, data)
  },
  deleteDepartment: (id: string): Promise<{ message: string }> => {
    return axiosInstance.delete(`/configs/departments/${id}`)
  },
  getAttachments: (params?: { refId?: string; refType?: string }): Promise<Attachment[]> => {
    return axiosInstance.get('/configs/attachments', { params })
  },
  uploadAttachment: (
    file: File,
    refId: string,
    refType?: 'item' | 'config',
  ): Promise<Attachment> => {
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
  getChangelog: (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Log>> => {
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
  }): Promise<PaginatedResponse<User>> => {
    return axiosInstance.get('/users', { params })
  },
  create: (data: {
    username: string
    password: string
    name: string
    role: 'pm' | 'admin'
    department: string
    status?: 'active' | 'disabled'
  }): Promise<User> => {
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
  ): Promise<User> => {
    return axiosInstance.patch(`/users/${id}`, data)
  },
  remove: (id: string): Promise<{ message?: string }> => {
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
  }): Promise<PaginatedResponse<Log>> => {
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
