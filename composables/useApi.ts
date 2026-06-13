const config = useRuntimeConfig()

export const useApi = () => {
  const auth = useAuthStore()

  const baseURL = config.public.apiBase as string

  const request = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    }

    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`
    }

    const response = await fetch(`${baseURL}${endpoint}`, {
      ...options,
      headers
    })

    if (response.status === 401) {
      auth.clearAuth()
      navigateTo('/login')
      throw new Error('Unauthorized')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Request failed: ${response.status}`)
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  const get = <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' })

  const post = <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined })

  const put = <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, { method: 'PUT', body: data ? JSON.stringify(data) : undefined })

  const del = <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' })

  const upload = async <T>(endpoint: string, file: File): Promise<T> => {
    const formData = new FormData()
    formData.append('file', file)

    const headers: Record<string, string> = {}
    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`
    }

    const response = await fetch(`${baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Upload failed')
    }

    return response.json()
  }

  return { get, post, put, del, upload, baseURL }
}
