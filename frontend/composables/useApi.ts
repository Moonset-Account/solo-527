import { useAuthStore } from '~/stores/auth'
import { useMessage } from 'naive-ui'

interface FetchOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: any
  query?: Record<string, any>
  headers?: Record<string, string>
  showError?: boolean
  auth?: boolean
}

function buildQuery(params?: Record<string, any>) {
  if (!params) return ''
  const qs: string[] = []
  Object.keys(params).forEach((k) => {
    const v = params[k]
    if (v === undefined || v === null || v === '') return
    if (Array.isArray(v)) {
      v.forEach((x) => qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(x)}`))
    } else {
      qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    }
  })
  return qs.length ? `?${qs.join('&')}` : ''
}

export function useApi() {
  const runtime = useRuntimeConfig()
  const base = runtime.public.apiBase || '/api'
  const auth = useAuthStore()
  const router = useRouter()

  async function request<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
    const { query, body, headers, auth: needAuth = true, showError = true, ...rest } = options
    const h: Record<string, string> = { 'Content-Type': 'application/json', ...headers }
    if (needAuth && auth.token) h.Authorization = `Bearer ${auth.token}`
    const url = `${base}${path}${buildQuery(query)}`
    let res: Response
    try {
      res = await fetch(url, {
        ...rest,
        headers: h,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch (e: any) {
      if (showError) {
        try {
          const msgs = window as any
          if (msgs.__n_msg) msgs.__n_msg.error(`网络错误：${e.message || '连接失败'}`)
        } catch (_) {}
      }
      throw e
    }
    let data: any = null
    try { data = await res.json() } catch (_) {}
    if (!res.ok) {
      if (res.status === 401) {
        auth.logout()
        router.push('/login')
      }
      if (showError) {
        try {
          const msgs = window as any
          if (msgs.__n_msg) msgs.__n_msg.error(data?.detail || `请求失败(${res.status})`)
        } catch (_) {}
      }
      throw new Error(data?.detail || `HTTP ${res.status}`)
    }
    return data as T
  }

  return {
    get: <T>(p: string, q?: any, o?: Partial<FetchOptions>) => request<T>(p, { ...o, query: q, method: 'GET' }),
    post: <T>(p: string, b?: any, q?: any, o?: Partial<FetchOptions>) => request<T>(p, { ...o, body: b, query: q, method: 'POST' }),
    patch: <T>(p: string, b?: any, q?: any, o?: Partial<FetchOptions>) => request<T>(p, { ...o, body: b, query: q, method: 'PATCH' }),
    delete: <T>(p: string, q?: any, o?: Partial<FetchOptions>) => request<T>(p, { ...o, query: q, method: 'DELETE' }),
    put: <T>(p: string, b?: any, q?: any, o?: Partial<FetchOptions>) => request<T>(p, { ...o, body: b, query: q, method: 'PUT' }),
  }
}
