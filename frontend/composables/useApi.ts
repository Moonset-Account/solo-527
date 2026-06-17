export const useApi = <T>(path: string, options: any = {}) => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  return $fetch<T>(path, {
    baseURL,
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    onResponse({ response }) {
      return response._data
    },
    onRequestError({ error }) {
      console.error('API Request Error:', error)
    },
    onResponseError({ response }) {
      console.error('API Response Error:', response.status, response._data)
    },
  })
}

export const apiGet = <T>(path: string, params?: Record<string, any>) => {
  const query = params ? '?' + new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return useApi<T>(path + query, { method: 'GET' })
}

export const apiPost = <T>(path: string, body?: any) => {
  return useApi<T>(path, {
    method: 'POST',
    body: body || undefined,
  })
}

export const apiPut = <T>(path: string, body?: any) => {
  return useApi<T>(path, {
    method: 'PUT',
    body: body || undefined,
  })
}

export const apiDelete = <T>(path: string) => {
  return useApi<T>(path, { method: 'DELETE' })
}

export const downloadFile = (url: string, filename?: string) => {
  const a = document.createElement('a')
  a.href = url
  if (filename) a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
