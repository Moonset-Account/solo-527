import type {
  SensorReading,
  SensorStatus,
  Alert,
  FeedingRecord,
  PondBatch,
  AeratorStatus,
  Threshold,
  ProcessingNote,
  MetricType,
  HumanJudgment,
} from '@/types'

const BASE = '/api'

export function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('auth_token')
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(BASE + url, {
    headers,
    ...options,
  })
  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('认证已过期，请重新登录')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  const json = await res.json()
  return json.data as T
}

export interface LoginParams {
  username: string
  password: string
}

export interface UserInfo {
  id: string
  username: string
  displayName: string
  role: 'technician' | 'manager' | 'admin'
  pondScope: string[] | null
}

export interface LoginResult {
  token: string
  user: UserInfo
}

export async function login(params: LoginParams): Promise<LoginResult> {
  const res = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || '登录失败')
  }
  const json = await res.json()
  const data = json.data as LoginResult
  setToken(data.token)
  return data
}

export async function register(params: {
  username: string
  password: string
  displayName: string
  role?: string
  pondScope?: string
}): Promise<LoginResult> {
  const res = await fetch(BASE + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || '注册失败')
  }
  const json = await res.json()
  const data = json.data as LoginResult
  setToken(data.token)
  return data
}

export async function fetchCurrentUser(): Promise<UserInfo> {
  return fetchJson<UserInfo>('/auth/me')
}

export async function fetchUsers(): Promise<UserInfo[]> {
  return fetchJson<UserInfo[]>('/auth/users')
}

export async function fetchReadings(params: {
  pondId?: string
  metric?: MetricType
  start?: string
  end?: string
}): Promise<SensorReading[]> {
  const qs = new URLSearchParams()
  if (params.pondId) qs.set('pondId', params.pondId)
  if (params.metric) qs.set('metric', params.metric)
  if (params.start) qs.set('start', params.start)
  if (params.end) qs.set('end', params.end)
  return fetchJson<SensorReading[]>(`/sensors/readings?${qs.toString()}`)
}

export async function fetchReadingById(id: string): Promise<SensorReading> {
  return fetchJson<SensorReading>(`/sensors/readings/${id}`)
}

export async function fetchSensorStatuses(): Promise<SensorStatus[]> {
  return fetchJson<SensorStatus[]>('/sensor-status/status')
}

export async function fetchThresholds(pondId?: string): Promise<Threshold[]> {
  const qs = pondId ? `?pondId=${pondId}` : ''
  return fetchJson<Threshold[]>(`/thresholds${qs}`)
}

export async function updateThreshold(id: string, data: Partial<Threshold>): Promise<Threshold> {
  return fetchJson<Threshold>(`/thresholds/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function fetchAlerts(params?: {
  status?: string
  pondId?: string
  severity?: string
}): Promise<Alert[]> {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.pondId) qs.set('pondId', params.pondId)
  if (params?.severity) qs.set('severity', params.severity)
  return fetchJson<Alert[]>(`/alerts?${qs.toString()}`)
}

export async function fetchAlertStats(params?: {
  start?: string
  end?: string
  pondId?: string
}): Promise<{
  total: number
  acknowledged: number
  ackRate: number
  judgmentDist: Record<string, number>
}> {
  const qs = new URLSearchParams()
  if (params?.start) qs.set('start', params.start)
  if (params?.end) qs.set('end', params.end)
  if (params?.pondId) qs.set('pondId', params.pondId)
  return fetchJson('/alerts/stats?' + qs.toString())
}

export async function acknowledgeAlert(
  id: string,
  judgment: HumanJudgment,
  note?: string,
  acknowledgedBy?: string
): Promise<Alert> {
  return fetchJson<Alert>(`/alerts/${id}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify({ judgment, note, acknowledgedBy }),
  })
}

export async function fetchFeedingRecords(pondId?: string): Promise<FeedingRecord[]> {
  const qs = pondId ? `?pondId=${pondId}` : ''
  return fetchJson<FeedingRecord[]>(`/feeding${qs}`)
}

export async function createFeedingRecord(data: Partial<FeedingRecord>): Promise<FeedingRecord> {
  return fetchJson<FeedingRecord>('/feeding', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchBatches(status?: string): Promise<PondBatch[]> {
  const qs = status ? `?status=${status}` : ''
  return fetchJson<PondBatch[]>(`/batches${qs}`)
}

export async function fetchAeratorStatuses(): Promise<AeratorStatus[]> {
  return fetchJson<AeratorStatus[]>('/aerators')
}

export async function fetchNotes(params?: {
  alertId?: string
  readingId?: string
}): Promise<ProcessingNote[]> {
  const qs = new URLSearchParams()
  if (params?.alertId) qs.set('alertId', params.alertId)
  if (params?.readingId) qs.set('readingId', params.readingId)
  return fetchJson<ProcessingNote[]>(`/notes?${qs.toString()}`)
}

export async function createNote(data: {
  alertId?: string
  readingId?: string
  note: string
  createdBy?: string
}): Promise<ProcessingNote> {
  return fetchJson<ProcessingNote>('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchDrilldownData(readingId: string): Promise<{
  reading: SensorReading
  notes: ProcessingNote[]
  alerts: Alert[]
}> {
  return fetchJson(`/notes/reading/${readingId}`)
}

export async function fetchReportData(params: {
  start?: string
  end?: string
  pondId?: string
}): Promise<{
  total: number
  acknowledged: number
  ackRate: number
  judgmentDist: Record<string, number>
  alerts: Alert[]
}> {
  const qs = new URLSearchParams()
  if (params.start) qs.set('start', params.start)
  if (params.end) qs.set('end', params.end)
  if (params.pondId) qs.set('pondId', params.pondId)
  return fetchJson('/reports/export?' + qs.toString())
}

export function getReportCsvUrl(params: {
  start?: string
  end?: string
  pondId?: string
}): string {
  const qs = new URLSearchParams()
  if (params.start) qs.set('start', params.start)
  if (params.end) qs.set('end', params.end)
  if (params.pondId) qs.set('pondId', params.pondId)
  qs.set('format', 'csv')
  const token = getToken()
  if (token) {
    qs.set('token', token)
  }
  return BASE + '/reports/export?' + qs.toString()
}
