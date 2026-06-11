import { get, post, put, del } from '@/utils/request'

export interface WorkerItem {
  _id: string
  name: string
  phone: string
  idCard: string
  skills: string[]
  skillNames?: string[]
  rating: number
  status: 'on' | 'off'
  community: string
  hireDate: string
  createdAt: string
  updatedAt: string
}

export interface WorkerListResult {
  data: WorkerItem[]
  total: number
  page: number
  pageSize: number
}

export interface CreateWorkerParams {
  name: string
  phone: string
  idCard: string
  skills?: string[]
  rating?: number
  status?: 'on' | 'off'
  community?: string
  hireDate: string
}

export interface UpdateWorkerParams {
  name?: string
  phone?: string
  idCard?: string
  skills?: string[]
  rating?: number
  status?: 'on' | 'off'
  community?: string
  hireDate?: string
}

export interface QueryWorkerParams {
  status?: 'on' | 'off'
  community?: string
  skillId?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export function createWorker(params: CreateWorkerParams) {
  return post<WorkerItem>('/workers', params)
}

export function getWorkerList(params?: QueryWorkerParams) {
  return get<WorkerListResult>('/workers', params)
}

export function getWorkerBySkill(skillId: string) {
  return get<WorkerItem[]>(`/workers/skill/${skillId}`)
}

export function getWorkerByCommunity(community: string) {
  return get<WorkerItem[]>(`/workers/community/${community}`)
}

export function getAvailableWorkers(skillId?: string, community?: string) {
  return get<WorkerItem[]>('/workers/available', { skillId, community })
}

export function getWorkerById(id: string) {
  return get<WorkerItem>(`/workers/${id}`)
}

export function updateWorker(id: string, params: UpdateWorkerParams) {
  return put<WorkerItem>(`/workers/${id}`, params)
}

export function deleteWorker(id: string) {
  return del<void>(`/workers/${id}`)
}
