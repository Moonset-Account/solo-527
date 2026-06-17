import request from './request'

export interface Technician {
  id: number
  name: string
  phone: string
  avatar?: string
  skills: string[]
  status: 'active' | 'inactive'
  orderCount: number
  rating: number
  workAreas: string[]
  createdAt: string
}

export interface CreateTechnicianParams {
  name: string
  phone: string
  avatar?: string
  skills: string[]
  workAreas: string[]
}

export function getTechnicianList(params?: any) {
  return request.get<{ list: Technician[]; total: number }>('/admin/technicians', { params })
}

export function getTechnicianDetail(id: number) {
  return request.get<Technician>(`/admin/technicians/${id}`)
}

export function createTechnician(data: CreateTechnicianParams) {
  return request.post<Technician>('/admin/technicians', data)
}

export function updateTechnician(id: number, data: Partial<CreateTechnicianParams>) {
  return request.put<Technician>(`/admin/technicians/${id}`, data)
}

export function deleteTechnician(id: number) {
  return request.delete(`/admin/technicians/${id}`)
}

export function getTechnicianWorkload(params?: any) {
  return request.get('/admin/technicians/workload', { params })
}

export function assignOrderToTechnician(orderId: number, technicianId: number) {
  return request.post(`/admin/orders/${orderId}/assign`, { technicianId })
}
