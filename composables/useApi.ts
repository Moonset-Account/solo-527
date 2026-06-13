export function useApi() {
  const config = useRuntimeConfig()

  const getAuthHeaders = () => {
    if (import.meta.client) {
      const token = localStorage.getItem('token')
      return token ? { Authorization: `Bearer ${token}` } : {}
    }
    return {}
  }

  const request = async (url: string, options: any = {}) => {
    const headers = { ...getAuthHeaders(), ...options.headers }
    const response = await $fetch(url, { ...options, headers })
    return response
  }

  return {
    get: (url: string, params?: any) => request(url, { params }),
    post: (url: string, body?: any) => request(url, { method: 'POST', body }),
    put: (url: string, body?: any) => request(url, { method: 'PUT', body }),
    delete: (url: string) => request(url, { method: 'DELETE' }),
  }
}
