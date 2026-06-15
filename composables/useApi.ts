import type { UseFetchOptions } from 'nuxt/app'

export function useApi<T>(url: string, options: UseFetchOptions<T> = {}) {
  const config = useRuntimeConfig()
  const { getAuthHeaders } = useAuth()

  const defaults: UseFetchOptions<T> = {
    baseURL: config.public.apiBase,
    headers: getAuthHeaders(),
    onResponseError({ response }) {
      if (response.status === 401) {
        const { logout } = useAuth()
        logout()
      }
    }
  }

  const mergedOptions = { ...defaults, ...options }
  if (options.headers) {
    mergedOptions.headers = { ...defaults.headers, ...options.headers }
  }

  return useFetch(url, mergedOptions)
}

export async function useApiFetch<T>(url: string, options: any = {}) {
  const config = useRuntimeConfig()
  const { getAuthHeaders } = useAuth()

  return await $fetch<T>(`${config.public.apiBase}${url}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  })
}
