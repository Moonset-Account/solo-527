const API_BASE = '/api'

interface RequestOptions {
  method?: string
  body?: any
  params?: Record<string, any>
}

const mockEvents = [
  { id: '1', title: '青山路占道经营', description: '青山路与建设路交叉口有商贩占道经营，影响交通通行', event_type: 'city_management', status: 'pending', location: '青山路与建设路交叉口', lng: 114.305, lat: 30.593, reporter: '张三', reporter_phone: '13800138001', assigned_to: null, created_at: '2026-06-14T08:30:00Z', updated_at: '2026-06-14T08:30:00Z', deadline: '2026-06-16T08:30:00Z', photos: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=street+vendor+blocking+road+in+chinese+city&image_size=landscape_4_3'] },
  { id: '2', title: '西湖区井盖缺失', description: '西湖区文三路路面井盖缺失，存在安全隐患', event_type: 'safety_hazard', status: 'assigned', location: '文三路289号', lng: 114.358, lat: 30.622, reporter: '李四', reporter_phone: '13800138002', assigned_to: '王维修', created_at: '2026-06-13T14:20:00Z', updated_at: '2026-06-13T16:00:00Z', deadline: '2026-06-15T14:20:00Z', photos: [] },
  { id: '3', title: '江干区垃圾分类不规范', description: '江干区某小区垃圾分类投放点设置不规范，居民分类意识差', event_type: 'environmental', status: 'rectifying', location: '江干区九堡镇', lng: 114.423, lat: 30.635, reporter: '赵五', reporter_phone: '13800138003', assigned_to: '刘环保', created_at: '2026-06-12T09:15:00Z', updated_at: '2026-06-14T10:30:00Z', deadline: '2026-06-17T09:15:00Z', photos: [] },
  { id: '4', title: '拱墅区施工噪音扰民', description: '拱墅区某工地夜间施工噪音严重影响周边居民休息', event_type: 'complaint', status: 'reviewing', location: '拱墅区运河广场旁', lng: 114.321, lat: 30.651, reporter: '孙六', reporter_phone: '13800138004', assigned_to: '周监理', created_at: '2026-06-11T22:00:00Z', updated_at: '2026-06-13T15:00:00Z', deadline: '2026-06-16T22:00:00Z', photos: [] },
  { id: '5', title: '下城区路灯损坏', description: '下城区某路段路灯损坏，夜间照明不足，存在安全风险', event_type: 'facility_damage', status: 'closed', location: '下城区朝晖路', lng: 114.298, lat: 30.612, reporter: '钱七', reporter_phone: '13800138005', assigned_to: '吴电工', created_at: '2026-06-10T18:45:00Z', updated_at: '2026-06-12T20:00:00Z', deadline: '2026-06-14T18:45:00Z', photos: [] },
  { id: '6', title: '滨江区违规搭建', description: '滨江区某小区业主在公共区域违规搭建阳光房', event_type: 'illegal_construction', status: 'rectifying', location: '滨江区长河街道', lng: 114.378, lat: 30.578, reporter: '冯八', reporter_phone: '13800138006', assigned_to: '陈执法', created_at: '2026-06-09T10:30:00Z', updated_at: '2026-06-11T09:00:00Z', deadline: '2026-06-14T10:30:00Z', photos: [] },
  { id: '7', title: '余杭区污水外溢', description: '余杭区某路段污水管道堵塞导致污水外溢', event_type: 'environmental', status: 'rejected', location: '余杭区良渚街道', lng: 114.456, lat: 30.678, reporter: '卫九', reporter_phone: '13800138007', assigned_to: '郑维修', created_at: '2026-06-08T07:20:00Z', updated_at: '2026-06-10T11:30:00Z', deadline: '2026-06-12T07:20:00Z', photos: [] },
  { id: '8', title: '萧山区绿化带被毁', description: '萧山区某道路两侧绿化带被车辆碾压损毁', event_type: 'environmental', status: 'pending', location: '萧山区市心路', lng: 114.512, lat: 30.542, reporter: '蒋十', reporter_phone: '13800138008', assigned_to: null, created_at: '2026-06-15T06:00:00Z', updated_at: '2026-06-15T06:00:00Z', deadline: '2026-06-17T06:00:00Z', photos: [] }
]

const mockFlowLogs = [
  { id: 'fl1', event_id: '1', from_status: null, to_status: 'pending', operator: '张三', action: '上报事件', comment: '发现占道经营问题', created_at: '2026-06-14T08:30:00Z' },
  { id: 'fl2', event_id: '2', from_status: null, to_status: 'pending', operator: '李四', action: '上报事件', comment: '井盖缺失安全隐患', created_at: '2026-06-13T14:20:00Z' },
  { id: 'fl3', event_id: '2', from_status: 'pending', to_status: 'assigned', operator: '管理员', action: '指派处理人', comment: '指派王维修处理', created_at: '2026-06-13T16:00:00Z' },
  { id: 'fl4', event_id: '3', from_status: null, to_status: 'pending', operator: '赵五', action: '上报事件', comment: '垃圾分类不规范', created_at: '2026-06-12T09:15:00Z' },
  { id: 'fl5', event_id: '3', from_status: 'pending', to_status: 'assigned', operator: '管理员', action: '指派处理人', comment: '指派刘环保处理', created_at: '2026-06-12T10:00:00Z' },
  { id: 'fl6', event_id: '3', from_status: 'assigned', to_status: 'rectifying', operator: '刘环保', action: '开始整改', comment: '已联系物业进行分类指导', created_at: '2026-06-14T10:30:00Z' },
  { id: 'fl7', event_id: '4', from_status: null, to_status: 'pending', operator: '孙六', action: '上报事件', comment: '夜间施工扰民', created_at: '2026-06-11T22:00:00Z' },
  { id: 'fl8', event_id: '4', from_status: 'pending', to_status: 'assigned', operator: '管理员', action: '指派处理人', comment: '指派周监理处理', created_at: '2026-06-12T09:00:00Z' },
  { id: 'fl9', event_id: '4', from_status: 'assigned', to_status: 'rectifying', operator: '周监理', action: '开始整改', comment: '已下达停工通知', created_at: '2026-06-12T14:00:00Z' },
  { id: 'fl10', event_id: '4', from_status: 'rectifying', to_status: 'reviewing', operator: '周监理', action: '提交复查', comment: '工地已停止夜间施工', created_at: '2026-06-13T15:00:00Z' },
  { id: 'fl11', event_id: '5', from_status: null, to_status: 'pending', operator: '钱七', action: '上报事件', comment: '路灯损坏', created_at: '2026-06-10T18:45:00Z' },
  { id: 'fl12', event_id: '5', from_status: 'pending', to_status: 'assigned', operator: '管理员', action: '指派处理人', comment: '指派吴电工处理', created_at: '2026-06-11T08:00:00Z' },
  { id: 'fl13', event_id: '5', from_status: 'assigned', to_status: 'rectifying', operator: '吴电工', action: '开始整改', comment: '正在更换灯泡', created_at: '2026-06-11T14:00:00Z' },
  { id: 'fl14', event_id: '5', from_status: 'rectifying', to_status: 'reviewing', operator: '吴电工', action: '提交复查', comment: '路灯已修复', created_at: '2026-06-12T10:00:00Z' },
  { id: 'fl15', event_id: '5', from_status: 'reviewing', to_status: 'closed', operator: '管理员', action: '复查通过', comment: '确认路灯已恢复正常', created_at: '2026-06-12T20:00:00Z' },
  { id: 'fl16', event_id: '6', from_status: null, to_status: 'pending', operator: '冯八', action: '上报事件', comment: '违规搭建阳光房', created_at: '2026-06-09T10:30:00Z' },
  { id: 'fl17', event_id: '6', from_status: 'pending', to_status: 'assigned', operator: '管理员', action: '指派处理人', comment: '指派陈执法处理', created_at: '2026-06-09T14:00:00Z' },
  { id: 'fl18', event_id: '6', from_status: 'assigned', to_status: 'rectifying', operator: '陈执法', action: '开始整改', comment: '已下达拆除通知书', created_at: '2026-06-11T09:00:00Z' },
  { id: 'fl19', event_id: '7', from_status: null, to_status: 'pending', operator: '卫九', action: '上报事件', comment: '污水外溢', created_at: '2026-06-08T07:20:00Z' },
  { id: 'fl20', event_id: '7', from_status: 'pending', to_status: 'assigned', operator: '管理员', action: '指派处理人', comment: '指派郑维修处理', created_at: '2026-06-08T10:00:00Z' },
  { id: 'fl21', event_id: '7', from_status: 'assigned', to_status: 'rectifying', operator: '郑维修', action: '开始整改', comment: '已安排疏通', created_at: '2026-06-09T08:00:00Z' },
  { id: 'fl22', event_id: '7', from_status: 'rectifying', to_status: 'reviewing', operator: '郑维修', action: '提交复查', comment: '管道已疏通', created_at: '2026-06-09T16:00:00Z' },
  { id: 'fl23', event_id: '7', from_status: 'reviewing', to_status: 'rejected', operator: '管理员', action: '复查不通过', comment: '仍存在渗漏现象，需重新处理', created_at: '2026-06-10T11:30:00Z' }
]

const mockDictCategories = [
  { key: 'event_type', label: '事件类型', children: [
    { key: 'city_management', label: '城市管理', parent: 'event_type' },
    { key: 'safety_hazard', label: '安全隐患', parent: 'event_type' },
    { key: 'environmental', label: '环境卫生', parent: 'event_type' },
    { key: 'complaint', label: '投诉建议', parent: 'event_type' },
    { key: 'facility_damage', label: '设施损坏', parent: 'event_type' },
    { key: 'illegal_construction', label: '违建管理', parent: 'event_type' }
  ]},
  { key: 'area', label: '区域划分', children: [
    { key: 'xihu', label: '西湖区', parent: 'area' },
    { key: 'gongshu', label: '拱墅区', parent: 'area' },
    { key: 'jianggan', label: '江干区', parent: 'area' },
    { key: 'xiacheng', label: '下城区', parent: 'area' },
    { key: 'binjiang', label: '滨江区', parent: 'area' },
    { key: 'yuhang', label: '余杭区', parent: 'area' },
    { key: 'xiaoshan', label: '萧山区', parent: 'area' }
  ]},
  { key: 'priority', label: '优先级', children: [
    { key: 'urgent', label: '紧急', parent: 'priority' },
    { key: 'high', label: '高', parent: 'priority' },
    { key: 'medium', label: '中', parent: 'priority' },
    { key: 'low', label: '低', parent: 'priority' }
  ]}
]

const mockRules = [
  { id: 'r1', name: '整改超时提醒', description: '事件整改超过规定时限后自动发送超时提醒', category: 'timeout', config: { hours: 48, notify_roles: ['supervisor', 'admin'] }, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'r2', name: '复查超时提醒', description: '事件复查超过规定时限后自动发送超时提醒', category: 'timeout', config: { hours: 24, notify_roles: ['supervisor'] }, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'r3', name: '重复事件检测', description: '自动检测相同位置和类型的事件是否重复上报', category: 'dedup', config: { distance_meters: 100, same_type: true, time_window_hours: 72 }, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'r4', name: '自动升级', description: '事件在指定时限内未处理则自动升级到上级', category: 'escalation', config: { pending_hours: 24, rectifying_hours: 72 }, is_active: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'r5', name: '整改驳回通知', description: '复查不通过时自动通知整改人重新处理', category: 'notification', config: { notify_assigned: true, include_reason: true }, is_active: true, created_at: '2026-01-01T00:00:00Z' }
]

const mockNotifications = [
  { id: 'n1', title: '事件超时提醒', content: '事件「青山路占道经营」已超过整改时限', type: 'warning', read: false, created_at: '2026-06-15T08:30:00Z' },
  { id: 'n2', title: '新事件上报', content: '萧山区市心路绿化带被毁，等待指派', type: 'info', read: false, created_at: '2026-06-15T06:00:00Z' },
  { id: 'n3', title: '复查不通过', content: '事件「余杭区污水外溢」复查未通过，需重新整改', type: 'error', read: true, created_at: '2026-06-10T11:30:00Z' },
  { id: 'n4', title: '事件已闭环', content: '事件「下城区路灯损坏」已完成闭环', type: 'success', read: true, created_at: '2026-06-12T20:00:00Z' }
]

const mockUsers = [
  { id: 'u1', name: '管理员', role: 'admin', phone: '13800000001' },
  { id: 'u2', name: '王维修', role: 'handler', phone: '13800138002' },
  { id: 'u3', name: '刘环保', role: 'handler', phone: '13800138003' },
  { id: 'u4', name: '周监理', role: 'handler', phone: '13800138004' },
  { id: 'u5', name: '吴电工', role: 'handler', phone: '13800138005' },
  { id: 'u6', name: '陈执法', role: 'handler', phone: '13800138006' },
  { id: 'u7', name: '郑维修', role: 'handler', phone: '13800138007' }
]

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options
  let fullUrl = `${API_BASE}${url}`
  if (params) {
    const qs = new URLSearchParams(params).toString()
    if (qs) fullUrl += `?${qs}`
  }
  try {
    const fetchOptions: any = { method }
    if (body) {
      fetchOptions.body = JSON.stringify(body)
      fetchOptions.headers = { 'Content-Type': 'application/json' }
    }
    const res = await fetch(fullUrl, fetchOptions)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json() as T
  } catch {
    return null as T
  }
}

export function useApi() {
  const getEvents = async (params?: Record<string, any>) => {
    const result = await request<{ items: any[]; total: number }>('/events', { params })
    if (result && result.items) return result
    let filtered = [...mockEvents]
    if (params?.status) filtered = filtered.filter(e => e.status === params.status)
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter(e => e.title.toLowerCase().includes(kw) || e.description.toLowerCase().includes(kw))
    }
    if (params?.event_type) filtered = filtered.filter(e => e.event_type === params.event_type)
    const page = Number(params?.page) || 1
    const pageSize = Number(params?.page_size) || 10
    const start = (page - 1) * pageSize
    return { items: filtered.slice(start, start + pageSize), total: filtered.length }
  }

  const getEvent = async (id: string) => {
    const result = await request<any>(`/events/${id}`)
    if (result && result.id) return result
    return mockEvents.find(e => e.id === id) || null
  }

  const createEvent = async (data: any) => {
    const result = await request<any>('/events', { method: 'POST', body: data })
    if (result && result.id) return result
    const newEvent = {
      id: String(mockEvents.length + 1),
      ...data,
      status: 'pending',
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      photos: []
    }
    mockEvents.unshift(newEvent)
    return newEvent
  }

  const updateEvent = async (id: string, data: any) => {
    const result = await request<any>(`/events/${id}`, { method: 'PUT', body: data })
    if (result && result.id) return result
    const idx = mockEvents.findIndex(e => e.id === id)
    if (idx >= 0) {
      mockEvents[idx] = { ...mockEvents[idx], ...data, updated_at: new Date().toISOString() }
      return mockEvents[idx]
    }
    return null
  }

  const assignEvent = async (id: string, assigned_to: string) => {
    const result = await request<any>(`/events/${id}/assign`, { method: 'POST', body: { assigned_to } })
    if (result && result.id) return result
    const idx = mockEvents.findIndex(e => e.id === id)
    if (idx >= 0) {
      mockEvents[idx] = { ...mockEvents[idx], status: 'assigned', assigned_to, updated_at: new Date().toISOString() }
      return mockEvents[idx]
    }
    return null
  }

  const changeStatus = async (id: string, status: string, comment?: string) => {
    const result = await request<any>(`/events/${id}/status`, { method: 'POST', body: { status, comment } })
    if (result && result.id) return result
    const idx = mockEvents.findIndex(e => e.id === id)
    if (idx >= 0) {
      mockEvents[idx] = { ...mockEvents[idx], status, updated_at: new Date().toISOString() }
      return mockEvents[idx]
    }
    return null
  }

  const getFlowLogs = async (eventId: string) => {
    const result = await request<any[]>(`/events/${eventId}/flow-logs`)
    if (result && result.length) return result
    return mockFlowLogs.filter(f => f.event_id === eventId)
  }

  const getDictCategories = async () => {
    const result = await request<any[]>('/dict/categories')
    if (result && result.length) return result
    return mockDictCategories
  }

  const getDictItems = async (category: string) => {
    const result = await request<any[]>(`/dict/items/${category}`)
    if (result && result.length) return result
    const cat = mockDictCategories.find(c => c.key === category)
    return cat ? cat.children || [] : []
  }

  const addDictItem = async (category: string, data: any) => {
    const result = await request<any>(`/dict/items/${category}`, { method: 'POST', body: data })
    if (result && result.key) return result
    const cat = mockDictCategories.find(c => c.key === category)
    if (cat) {
      const item = { key: data.key || `item_${Date.now()}`, label: data.label, parent: category }
      if (!cat.children) cat.children = []
      cat.children.push(item)
      return item
    }
    return null
  }

  const deleteDictItem = async (category: string, itemKey: string) => {
    const result = await request<any>(`/dict/items/${category}/${itemKey}`, { method: 'DELETE' })
    if (result) return result
    const cat = mockDictCategories.find(c => c.key === category)
    if (cat && cat.children) {
      cat.children = cat.children.filter(c => c.key !== itemKey)
    }
    return { success: true }
  }

  const getRules = async () => {
    const result = await request<any[]>('/rules')
    if (result && result.length) return result
    return mockRules
  }

  const updateRule = async (id: string, data: any) => {
    const result = await request<any>(`/rules/${id}`, { method: 'PUT', body: data })
    if (result && result.id) return result
    const idx = mockRules.findIndex(r => r.id === id)
    if (idx >= 0) {
      mockRules[idx] = { ...mockRules[idx], ...data }
      return mockRules[idx]
    }
    return null
  }

  const getNotifications = async () => {
    const result = await request<any[]>('/notifications')
    if (result && result.length) return result
    return mockNotifications
  }

  const markNotificationRead = async (id: string) => {
    const result = await request<any>(`/notifications/${id}/read`, { method: 'POST' })
    if (result) return result
    const n = mockNotifications.find(n => n.id === id)
    if (n) n.read = true
    return { success: true }
  }

  const getUsers = async () => {
    const result = await request<any[]>('/users')
    if (result && result.length) return result
    return mockUsers
  }

  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('upload failed')
      return await res.json()
    } catch {
      return { url: URL.createObjectURL(file), name: file.name }
    }
  }

  return {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    assignEvent,
    changeStatus,
    getFlowLogs,
    getDictCategories,
    getDictItems,
    addDictItem,
    deleteDictItem,
    getRules,
    updateRule,
    getNotifications,
    markNotificationRead,
    getUsers,
    uploadFile
  }
}
