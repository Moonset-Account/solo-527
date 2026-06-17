const config = useRuntimeConfig()

export function useApi() {
  const baseURL = config.public.apiBase || '/api'

  async function request<T = any>(path: string, options: any = {}): Promise<T> {
    const { method = 'GET', body, query } = options
    const url = `${baseURL}${path}`

    try {
      const data = await $fetch(url, {
        method,
        body: method !== 'GET' ? body : undefined,
        query,
      })
      return data as T
    } catch (error: any) {
      console.error(`API Error [${method}] ${path}:`, error)
      throw error
    }
  }

  const del = <T = any>(path: string) => request<T>(path, { method: 'DELETE' })

  return {
    get: <T = any>(path: string, query?: any) => request<T>(path, { method: 'GET', query }),
    post: <T = any>(path: string, body?: any) => request<T>(path, { method: 'POST', body }),
    put: <T = any>(path: string, body?: any) => request<T>(path, { method: 'PUT', body }),
    delete: del,
    del,
  }
}

export const api = useApi()
