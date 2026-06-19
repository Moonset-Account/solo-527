export const useApi = () => {
  const config = useRuntimeConfig()
  
  const getToken = (): string | null => {
    if (process.client) {
      return localStorage.getItem('token')
    }
    return null
  }
  
  const request = async <T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const url = `${config.public.apiBase}${path}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }
    
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '请求失败' }))
      throw new Error(errorData.detail || `请求失败: ${response.status}`)
    }
    
    return response.json()
  }
  
  const buildUrlWithParams = (path: string, params?: Record<string, any>): string => {
    if (!params) return path
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    return queryString ? `${path}?${queryString}` : path
  }
  
  const get = <T>(path: string, params?: Record<string, any>): Promise<T> => {
    const url = buildUrlWithParams(path, params)
    return request<T>(url, { method: 'GET' })
  }
  
  const post = <T>(path: string, data?: any, params?: Record<string, any>): Promise<T> => {
    const url = buildUrlWithParams(path, params)
    return request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
  
  const put = <T>(path: string, data?: any, params?: Record<string, any>): Promise<T> => {
    const url = buildUrlWithParams(path, params)
    return request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
  
  const del = <T>(path: string, params?: Record<string, any>): Promise<T> => {
    const url = buildUrlWithParams(path, params)
    return request<T>(url, { method: 'DELETE' })
  }
  
  const download = async (path: string, filename: string) => {
    const token = getToken()
    const url = `${config.public.apiBase}${path}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    })
    
    if (!response.ok) {
      throw new Error('下载失败')
    }
    
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }
  
  return {
    get,
    post,
    put,
    del,
    download,
    request,
  }
}
