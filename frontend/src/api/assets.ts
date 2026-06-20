import request, { PaginatedResponse } from './index'

export interface ServerAsset {
  id: number
  name: string
  hostname: string
  ip_address: string
  ip_internal: string
  server_type: string
  server_type_display: string
  os_type: string
  os_version: string
  cpu_cores: number
  memory_gb: number
  disk_gb: number
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  status: string
  status_display: string
  location: string
  idc: string
  cabinet: string
  responsible: number | null
  responsible_name: string
  tags: string
  tag_list: string[]
  description: string
  is_active: boolean
  last_check_time: string
  created_at: string
}

export interface AssetGroup {
  id: number
  name: string
  code: string
  parent: number | null
  description: string
  sort_order: number
  server_count: number
  created_at: string
}

export const assetApi = {
  list: (params?: any) =>
    request.get<any, PaginatedResponse<ServerAsset>>('/assets/servers/', { params }),

  detail: (id: number) =>
    request.get<any, ServerAsset>(`/assets/servers/${id}/`),

  create: (data: any) =>
    request.post('/assets/servers/', data),

  update: (id: number, data: any) =>
    request.put(`/assets/servers/${id}/`, data),

  delete: (id: number) =>
    request.delete(`/assets/servers/${id}/`),

  groupList: (params?: any) =>
    request.get<any, PaginatedResponse<AssetGroup>>('/assets/groups/', { params }),

  groupCreate: (data: any) =>
    request.post('/assets/groups/', data),

  groupUpdate: (id: number, data: any) =>
    request.put(`/assets/groups/${id}/`, data),

  groupDelete: (id: number) =>
    request.delete(`/assets/groups/${id}/`),
}
