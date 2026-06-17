import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'
import router from '@/router'

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

class HttpRequest {
  private instance: AxiosInstance
  private baseConfig: AxiosRequestConfig = {
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  }

  constructor() {
    this.instance = axios.create(this.baseConfig)
    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      (config) => {
        const userStore = useUserStore()
        const adminStore = useAdminStore()
        
        let token: string | null = null
        
        if (config.url?.startsWith('/admin')) {
          token = adminStore.token
        } else {
          token = userStore.token
        }
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const res = response.data as ApiResponse
        
        if (res.code === 0 || res.code === 200) {
          return res as any
        }
        
        ElMessage.error(res.message || '请求失败')
        
        if (res.code === 401) {
          const userStore = useUserStore()
          const adminStore = useAdminStore()
          userStore.logout()
          adminStore.logout()
          
          if (window.location.pathname.startsWith('/admin')) {
            router.push('/admin/login')
          }
        }
        
        return Promise.reject(new Error(res.message || '请求失败'))
      },
      (error) => {
        if (error.response) {
          const status = error.response.status
          if (status === 401) {
            ElMessage.error('登录已过期，请重新登录')
            const userStore = useUserStore()
            const adminStore = useAdminStore()
            userStore.logout()
            adminStore.logout()
            
            if (window.location.pathname.startsWith('/admin')) {
              router.push('/admin/login')
            }
          } else if (status === 403) {
            ElMessage.error('没有权限访问')
          } else if (status === 404) {
            ElMessage.error('请求的资源不存在')
          } else if (status >= 500) {
            ElMessage.error('服务器错误，请稍后重试')
          } else {
            ElMessage.error(error.response.data?.message || error.message || '请求失败')
          }
        } else if (error.request) {
          ElMessage.error('网络错误，请检查网络连接')
        } else {
          ElMessage.error(error.message || '请求失败')
        }
        
        return Promise.reject(error)
      }
    )
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.get(url, config)
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.post(url, data, config)
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.put(url, data, config)
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.delete(url, config)
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.patch(url, data, config)
  }
}

const request = new HttpRequest()

export default request
