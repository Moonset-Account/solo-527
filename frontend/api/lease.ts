import request from './request'
import type { ApiResponse, PageResult, Lease, Property, Tenant, Owner, FollowUpRecord } from '~/types'

export interface LeaseQuery {
  page?: number
  page_size?: number
  keyword?: string
  lease_type?: string
  status?: string
  consultant_id?: number
  start_date_from?: string
  start_date_to?: string
  end_date_from?: string
  end_date_to?: string
}

export function getLeaseList(params: LeaseQuery): Promise<ApiResponse<PageResult<Lease>>> {
  return request.get('/leases', { params })
}

export function getLeaseDetail(id: number): Promise<ApiResponse<Lease>> {
  return request.get(`/leases/${id}`)
}

export function createLease(data: Partial<Lease>): Promise<ApiResponse<Lease>> {
  return request.post('/leases', data)
}

export function updateLease(id: number, data: Partial<Lease>): Promise<ApiResponse<Lease>> {
  return request.put(`/leases/${id}`, data)
}

export function deleteLease(id: number): Promise<ApiResponse> {
  return request.delete(`/leases/${id}`)
}

export function getPropertyList(params: any): Promise<ApiResponse<PageResult<Property>>> {
  return request.get('/properties', { params })
}

export function getTenantList(params: any): Promise<ApiResponse<PageResult<Tenant>>> {
  return request.get('/tenants', { params })
}

export function getOwnerList(params: any): Promise<ApiResponse<PageResult<Owner>>> {
  return request.get('/owners', { params })
}

export function getFollowUpList(leaseId: number, params: any): Promise<ApiResponse<PageResult<FollowUpRecord>>> {
  return request.get(`/leases/${leaseId}/follow-ups`, { params })
}

export function createFollowUp(leaseId: number, data: any): Promise<ApiResponse<FollowUpRecord>> {
  return request.post(`/leases/${leaseId}/follow-ups`, data)
}

export function updateFollowUp(id: number, data: any): Promise<ApiResponse<FollowUpRecord>> {
  return request.put(`/leases/follow-ups/${id}`, data)
}

export function deleteFollowUp(id: number): Promise<ApiResponse> {
  return request.delete(`/leases/follow-ups/${id}`)
}
