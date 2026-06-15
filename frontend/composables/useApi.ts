const API_BASE = '/api'

const DEFAULT_TOKEN = 'dev-token-auto'

interface RequestOptions {
  method?: string
  body?: any
  params?: Record<string, any>
  formData?: FormData
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, formData } = options
  let fullUrl = `${API_BASE}${url}`
  if (params) {
    const qs = new URLSearchParams()
    for (const k of Object.keys(params)) {
      const v = params[k]
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v))
    }
    const s = qs.toString()
    if (s) fullUrl += `?${s}`
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${DEFAULT_TOKEN}`,
  }
  if (body && !formData) {
    headers['Content-Type'] = 'application/json'
  }
  const fetchOptions: any = { method, headers }
  if (body && !formData) fetchOptions.body = JSON.stringify(body)
  if (formData) fetchOptions.body = formData

  const res = await fetch(fullUrl, fetchOptions)
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${url} ${errText}`)
  }
  if (res.status === 204) return null as T
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return await res.json()
  return (await res.text()) as any
}

export function useApi() {
  const getEvents = async (params?: Record<string, any>) => {
    const q: Record<string, any> = {}
    if (params?.status) q.status = params.status
    if (params?.keyword) q.search = params.keyword
    if (params?.event_type) q.event_type = params.event_type
    q.page = Number(params?.page) || 1
    q.page_size = Number(params?.page_size) || 10
    return await request<any>('/events', { params: q })
  }

  const getEventStats = async () => {
    return await request<any>('/events/stats')
  }

  const getEvent = async (id: string | number) => {
    return await request<any>(`/events/${id}`)
  }

  const createEvent = async (data: {
    title: string
    event_type: string
    description?: string
    reporter?: string
    reporter_phone?: string
    lng?: number | null
    lat?: number | null
    address?: string | null
    location?: string
    photos?: string[]
  }) => {
    const payload = {
      title: data.title,
      event_type: data.event_type,
      description: data.description || '',
      lng: data.lng ?? null,
      lat: data.lat ?? null,
      address: data.address || data.location || null,
      photos: data.photos || [],
    }
    return await request<any>('/events', { method: 'POST', body: payload })
  }

  const updateEvent = async (id: string | number, data: any) => {
    return await request<any>(`/events/${id}`, { method: 'PUT', body: data })
  }

  const assignEvent = async (id: string | number, assignee_id: number | string, deadline?: number) => {
    const payload: any = { assignee_id: Number(assignee_id) }
    if (deadline) payload.deadline = new Date(deadline).toISOString()
    return await request<any>(`/events/${id}/assign`, { method: 'PUT', body: payload })
  }

  const changeStatus = async (id: string | number, status: string, comment?: string) => {
    if (status === 'assigned') {
      return { ok: true }
    }
    if (status === 'rectifying') {
      return await request<any>(`/events/${id}/rectify`, { method: 'PUT', body: { comment: comment || '开始整改' } })
    }
    if (status === 'reviewing') {
      return await request<any>(`/events/${id}/rectify`, { method: 'PUT', body: { comment: comment || '提交复查' } })
    }
    if (status === 'closed') {
      return await request<any>(`/events/${id}/review`, { method: 'PUT', body: { action: 'pass', comment: comment || '复查通过' } })
    }
    if (status === 'rejected') {
      return await request<any>(`/events/${id}/review`, { method: 'PUT', body: { action: 'reject', comment: comment || '复查不通过' } })
    }
    return { ok: true }
  }

  const getFlowLogs = async (eventId: string | number) => {
    const raw = await request<any[]>(`/events/${eventId}/flow-logs`)
    const actionMap: Record<string, { to_status: string; action: string }> = {
      created: { to_status: 'pending', action: '上报事件' },
      assigned: { to_status: 'assigned', action: '指派处理人' },
      rectifying: { to_status: 'rectifying', action: '开始整改' },
      reviewed: { to_status: 'reviewing', action: '提交复查' },
      closed: { to_status: 'closed', action: '复查通过' },
      rejected: { to_status: 'rectifying', action: '复查驳回，退回整改' },
      duplicate_detected: { to_status: 'pending', action: '重复上报检测' },
      timeout_alert: { to_status: 'rectifying', action: '超时提醒' },
    }
    return raw.map((f: any) => {
      const map = actionMap[f.action] || { to_status: f.action, action: f.action }
      return {
        id: f.id,
        event_id: f.event_id,
        from_status: null,
        to_status: map.to_status,
        action: map.action,
        operator: f.operator_id ? `用户${f.operator_id}` : '系统',
        comment: f.comment || '',
        created_at: f.created_at,
      }
    })
  }

  const getDictCategories = async () => {
    const cats = await request<any[]>('/dict/categories')
    return cats.map((c: any) => ({
      key: c.code,
      label: c.name,
      id: c.id,
      code: c.code,
      description: c.description,
    }))
  }

  const getDictItems = async (categoryCode: string) => {
    const cats = await request<any[]>('/dict/categories')
    const cat = cats.find((c: any) => c.code === categoryCode)
    if (!cat) return []
    const items = await request<any[]>('/dict/items', { params: { category_id: cat.id } })
    return items.map((it: any) => ({
      id: it.id,
      key: it.code,
      code: it.code,
      label: it.label,
      value: it.value,
      sort_order: it.sort_order,
      is_active: it.is_active,
      parent: categoryCode,
    }))
  }

  const addDictCategory = async (data: any) => {
    return await request<any>('/dict/categories', { method: 'POST', body: data })
  }

  const updateDictCategory = async (id: number, data: any) => {
    return await request<any>(`/dict/categories/${id}`, { method: 'PUT', body: data })
  }

  const deleteDictCategory = async (id: number) => {
    return await request<any>(`/dict/categories/${id}`, { method: 'DELETE' })
  }

  const addDictItem = async (categoryCode: string, data: any) => {
    const cats = await request<any[]>('/dict/categories')
    let cat = cats.find((c: any) => c.code === categoryCode)
    if (!cat) {
      cat = await request<any>('/dict/categories', {
        method: 'POST',
        body: { code: categoryCode, name: data.name || categoryCode, description: data.description || '' },
      })
    }
    const payload: any = {
      category_id: cat.id,
      code: data.code || data.key,
      label: data.label || data.name,
      value: data.value ?? (data.code || data.key),
      sort_order: data.sort_order || 0,
      is_active: data.is_active !== false,
    }
    if (data.id) {
      return await request<any>(`/dict/items/${data.id}`, { method: 'PUT', body: payload })
    }
    return await request<any>('/dict/items', { method: 'POST', body: payload })
  }

  const deleteDictItem = async (categoryCode: string, itemCode: string) => {
    const cats = await request<any[]>('/dict/categories')
    const cat = cats.find((c: any) => c.code === categoryCode)
    if (!cat) return { ok: true }
    const items = await request<any[]>('/dict/items', { params: { category_id: cat.id } })
    const it = items.find((i: any) => i.code === itemCode || String(i.id) === String(itemCode))
    if (!it) return { ok: true }
    return await request<any>(`/dict/items/${it.id}`, { method: 'DELETE' })
  }

  const getRules = async () => {
    return await request<any[]>('/rules')
  }

  const updateRule = async (id: string | number, data: any) => {
    return await request<any>(`/rules/${id}`, { method: 'PUT', body: data })
  }

  const createRule = async (data: any) => {
    return await request<any>('/rules', { method: 'POST', body: data })
  }

  const deleteRule = async (id: string | number) => {
    return await request<any>(`/rules/${id}`, { method: 'DELETE' })
  }

  const getNotifications = async () => {
    const raw = await request<any[]>('/notifications')
    return raw.map((n: any) => ({
      id: n.id,
      event_id: n.event_id,
      type: n.type,
      title: n.type,
      content: n.message,
      message: n.message,
      read: n.is_read,
      created_at: n.created_at,
    }))
  }

  const markNotificationRead = async (id: string | number) => {
    return await request<any>(`/notifications/${id}/read`, { method: 'POST' })
  }

  const markAllNotificationsRead = async () => {
    return await request<any>('/notifications/read-all', { method: 'POST' })
  }

  const getUsers = async () => {
    return await request<any[]>('/events/users/list')
  }

  const getFacilities = async () => {
    return await request<any[]>('/events/facilities')
  }

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return await request<any>('/events/upload', { method: 'POST', formData })
  }

  const login = async (username: string, password: string) => {
    return await request<any>('/auth/login', { method: 'POST', body: { username, password } })
  }

  const me = async () => {
    return await request<any>('/auth/me')
  }

  return {
    getEvents,
    getEventStats,
    getEvent,
    createEvent,
    updateEvent,
    assignEvent,
    changeStatus,
    getFlowLogs,
    getDictCategories,
    getDictItems,
    addDictCategory,
    updateDictCategory,
    deleteDictCategory,
    addDictItem,
    deleteDictItem,
    getRules,
    updateRule,
    createRule,
    deleteRule,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUsers,
    getFacilities,
    uploadFile,
    login,
    me,
  }
}
