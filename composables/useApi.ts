export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
  total?: number
  successCount?: number
  failCount?: number
  failedItems?: any[]
}

export const useApi = () => {
  const { getHeaders } = useAuth()

  const request = async <T>(
    url: string,
    options: any = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const headers = {
        ...getHeaders(),
        ...(options.headers || {})
      }

      const res = await $fetch<ApiResponse<T>>(url, {
        ...options,
        headers,
        credentials: 'include'
      })

      if (res.code !== 0) {
        throw new Error(res.message)
      }

      return res
    } catch (error: any) {
      if (error.response?.status === 401) {
        const { logout } = useAuth()
        logout()
      }
      throw error
    }
  }

  const get = <T>(url: string, params?: any) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ''
    return request<T>(`${url}${query}`, { method: 'GET' })
  }

  const post = <T>(url: string, body?: any) => {
    return request<T>(url, {
      method: 'POST',
      body
    })
  }

  const put = <T>(url: string, body?: any) => {
    return request<T>(url, {
      method: 'PUT',
      body
    })
  }

  const del = <T>(url: string) => {
    return request<T>(url, { method: 'DELETE' })
  }

  return { get, post, put, del, request }
}
