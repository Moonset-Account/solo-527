import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type {
  ApiResponse,
  PageResult,
  PageParams,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ExpenseApplication,
  CreateApplicationRequest,
  SubmitApplicationRequest,
  ExpenseAttachment,
  ApprovalRequest,
  ApprovalRule,
  CreateRuleRequest,
  UpdateRuleRequest,
  ApprovalConfig,
  CreateConfigRequest,
  UpdateConfigRequest,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  AssignRolesRequest,
  ChangeLog,
  TimeoutException,
  HandleTimeoutRequest
} from '../types'

const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

const setRefreshToken = (refreshToken: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

const removeRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    if (res.code !== 200) {
      if (res.code === 401) {
        const originalRequest = response.config
        if (!isRefreshing) {
          isRefreshing = true
          const refreshTokenValue = getRefreshToken()
          if (refreshTokenValue) {
            auth.refreshToken({ refreshToken: refreshTokenValue })
              .then((res) => {
                setToken(res.token)
                setRefreshToken(res.refreshToken)
                onTokenRefreshed(res.token)
              })
              .catch(() => {
                removeToken()
                removeRefreshToken()
                window.location.href = '/login'
              })
              .finally(() => {
                isRefreshing = false
              })
          } else {
            removeToken()
            removeRefreshToken()
            window.location.href = '/login'
          }
        }
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(request(originalRequest))
          })
        }) as unknown as AxiosResponse
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data as unknown as AxiosResponse
  },
  (error: unknown) => {
    if ((error as { response?: { status: number } }).response?.status === 401) {
      removeToken()
      removeRefreshToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const auth = {
  login: (data: LoginRequest): Promise<LoginResponse> => {
    return request.post('/auth/login', data) as unknown as Promise<LoginResponse>
  },
  logout: (): Promise<void> => {
    return request.post('/auth/logout').then(() => {
      removeToken()
      removeRefreshToken()
    }) as unknown as Promise<void>
  },
  refreshToken: (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    return request.post('/auth/refresh-token', data)
  }
}

export const application = {
  list: (params: PageParams & { status?: string }): Promise<PageResult<ExpenseApplication>> => {
    return request.get('/applications', { params })
  },
  getById: (id: number): Promise<ExpenseApplication> => {
    return request.get(`/applications/${id}`)
  },
  create: (data: CreateApplicationRequest): Promise<ExpenseApplication> => {
    return request.post('/applications', data)
  },
  submit: (data: SubmitApplicationRequest): Promise<ExpenseApplication> => {
    return request.post('/applications/submit', data)
  }
}

export const attachment = {
  upload: (applicationId: number, file: File): Promise<ExpenseAttachment> => {
    const formData = new FormData()
    formData.append('applicationId', String(applicationId))
    formData.append('file', file)
    return request.post('/attachments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  download: (id: number): Promise<Blob> => {
    return request.get(`/attachments/${id}/download`, {
      responseType: 'blob'
    })
  },
  delete: (id: number): Promise<void> => {
    return request.delete(`/attachments/${id}`)
  }
}

export const approval = {
  approve: (data: ApprovalRequest): Promise<void> => {
    return request.post('/approvals/approve', data)
  },
  reject: (data: ApprovalRequest): Promise<void> => {
    return request.post('/approvals/reject', data)
  },
  getPendingList: (params: PageParams): Promise<PageResult<ExpenseApplication>> => {
    return request.get('/approvals/pending', { params })
  }
}

export const rule = {
  list: (params?: PageParams): Promise<PageResult<ApprovalRule>> => {
    return request.get('/rules', { params })
  },
  create: (data: CreateRuleRequest): Promise<ApprovalRule> => {
    return request.post('/rules', data)
  },
  update: (data: UpdateRuleRequest): Promise<ApprovalRule> => {
    return request.put(`/rules/${data.id}`, data)
  },
  delete: (id: number): Promise<void> => {
    return request.delete(`/rules/${id}`)
  }
}

export const config = {
  list: (): Promise<ApprovalConfig[]> => {
    return request.get('/configs')
  },
  create: (data: CreateConfigRequest): Promise<ApprovalConfig> => {
    return request.post('/configs', data)
  },
  update: (data: UpdateConfigRequest): Promise<ApprovalConfig> => {
    return request.put(`/configs/${data.id}`, data)
  },
  delete: (id: number): Promise<void> => {
    return request.delete(`/configs/${id}`)
  }
}

export const user = {
  list: (params?: PageParams & { department?: string; role?: string }): Promise<PageResult<User>> => {
    return request.get('/users', { params })
  },
  create: (data: CreateUserRequest): Promise<User> => {
    return request.post('/users', data)
  },
  update: (data: UpdateUserRequest): Promise<User> => {
    return request.put(`/users/${data.id}`, data)
  },
  assignRoles: (data: AssignRolesRequest): Promise<User> => {
    return request.post('/users/assign-roles', data)
  }
}

export const auditLog = {
  list: (params: PageParams & { applicationId?: number }): Promise<PageResult<ChangeLog>> => {
    return request.get('/audit-logs', { params })
  }
}

export const timeout = {
  list: (params: PageParams & { handled?: boolean }): Promise<PageResult<TimeoutException>> => {
    return request.get('/timeouts', { params })
  },
  handle: (data: HandleTimeoutRequest): Promise<void> => {
    return request.post('/timeouts/handle', data)
  }
}

export const changeLog = {
  list: (params: PageParams & { applicationId?: number }): Promise<PageResult<ChangeLog>> => {
    return request.get('/change-logs', { params })
  }
}

export default request
export { getToken, setToken, removeToken, getRefreshToken, setRefreshToken, removeRefreshToken }
