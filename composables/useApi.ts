import type { ApiResponse, PaginatedResult } from '~/types'

interface FetchOptions extends RequestInit {
  params?: Record<string, any>
  body?: any
  timeout?: number
  showErrorToast?: boolean
  showSuccessToast?: boolean
  successMessage?: string
}

const BASE_URL = '/api'
const DEFAULT_TIMEOUT = 15000

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(`${key}[]`, String(v)))
    } else {
      searchParams.append(key, String(value))
    }
  })
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

function getAuthToken(): string | null {
  if (process.server) return null
  try {
    const stored = localStorage.getItem('dental_crm_auth')
    if (stored) {
      const data = JSON.parse(stored)
      return data.token || null
    }
  } catch {
    // ignore
  }
  return null
}

function showToast(message: string, type: 'success' | 'error' | 'info' | 'warn' = 'info') {
  if (process.client) {
    const existing = document.querySelector('.toast-container')
    if (existing) {
      existing.textContent = message
      existing.className = `toast-container toast toast-${type}`
    } else {
      const el = document.createElement('div')
      el.className = `toast-container toast toast-${type}`
      el.textContent = message
      document.body.appendChild(el)
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el)
      }, 3000)
    }
  }
}

class ApiError extends Error {
  code: number
  data: any

  constructor(message: string, code: number = -1, data: any = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
  }
}

async function request<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    params,
    body,
    timeout = DEFAULT_TIMEOUT,
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
    headers: customHeaders,
    ...restOptions
  } = options

  const fullUrl = `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}${params ? buildQueryString(params) : ''}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  }

  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
      ...restOptions,
    })

    clearTimeout(timeoutId)

    let data: ApiResponse<T>
    try {
      data = await response.json()
    } catch (parseError) {
      if (!response.ok) {
        throw new ApiError(`请求失败: ${response.status} ${response.statusText}`, response.status)
      }
      throw new ApiError('响应解析失败', -1)
    }

    if (data.code !== 0 && data.code !== 200) {
      if (showErrorToast) {
        showToast(data.message || '请求失败', 'error')
      }

      if (data.code === 401) {
        if (process.client) {
          localStorage.removeItem('dental_crm_auth')
          const auth = useAuth()
          if (auth.isAuthenticated.value) {
            auth.logout()
            window.location.href = '/login'
          }
        }
      }

      throw new ApiError(data.message || '请求失败', data.code, data.data)
    }

    if (showSuccessToast) {
      showToast(successMessage || data.message || '操作成功', 'success')
    }

    return data.data as T
  } catch (error: any) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      if (showErrorToast) {
        showToast('请求超时，请检查网络', 'error')
      }
      throw new ApiError('请求超时', -1)
    }

    if (error instanceof ApiError) {
      throw error
    }

    if (showErrorToast) {
      showToast(error.message || '网络异常，请稍后重试', 'error')
    }
    throw new ApiError(error.message || '网络异常', -1)
  }
}

export function useApi() {
  const get = <T = any>(url: string, options?: FetchOptions) =>
    request<T>('GET', url, options)

  const post = <T = any>(url: string, body?: any, options?: FetchOptions) =>
    request<T>('POST', url, { ...options, body })

  const put = <T = any>(url: string, body?: any, options?: FetchOptions) =>
    request<T>('PUT', url, { ...options, body })

  const remove = <T = any>(url: string, options?: FetchOptions) =>
    request<T>('DELETE', url, options)

  const del = remove

  const download = async (url: string, params?: Record<string, any>, filename?: string) => {
    const fullUrl = `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}${params ? buildQueryString(params) : ''}`
    const headers: Record<string, string> = {}
    const token = getAuthToken()
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(fullUrl, { headers })
    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename || `download_${Date.now()}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  const upload = async <T = any>(url: string, file: File, fieldName: string = 'file', extraData?: Record<string, any>): Promise<T> => {
    const formData = new FormData()
    formData.append(fieldName, file)
    if (extraData) {
      Object.entries(extraData).forEach(([k, v]) => formData.append(k, String(v)))
    }

    const headers: Record<string, string> = {}
    const token = getAuthToken()
    if (token) headers['Authorization'] = `Bearer ${token}`

    return request<T>('POST', url, {
      body: formData,
      headers,
    })
  }

  return {
    get,
    post,
    put,
    delete: remove,
    del,
    download,
    upload,
    BASE_URL,
    ApiError,
  }
}
