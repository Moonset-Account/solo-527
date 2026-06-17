import request from '@/utils/request'
import type { RoomInventory, PageResult, Result, InventoryDetail } from '@/types'

export const getInventoryList = (params: {
  page?: number
  size?: number
  routeId?: number
  hotelCode?: string
  roomType?: string
  startDate?: string
  endDate?: string
  roomStatus?: string
}) => {
  return request.get<Result<PageResult<RoomInventory>>>('/admin/inventory', { params })
}

export const getInventoryById = (id: number) => {
  return request.get<Result<RoomInventory>>(`/admin/inventory/${id}`)
}

export const getInventoryByQuery = (params: {
  routeId: number
  hotelCode: string
  roomType: string
  date: string
}) => {
  return request.get<Result<RoomInventory>>('/admin/inventory/query', { params })
}

export const getRouteInventory = (routeId: number, startDate: string, endDate: string) => {
  return request.get<Result<RoomInventory[]>>(`/admin/inventory/route/${routeId}`, {
    params: { startDate, endDate },
  })
}

export const createInventory = (data: RoomInventory) => {
  return request.post<Result<RoomInventory>>('/admin/inventory', data)
}

export const updateInventory = (data: RoomInventory) => {
  return request.put<Result<RoomInventory>>('/admin/inventory', data)
}

export const syncInventory = (params: {
  routeId: number
  hotelCode: string
  roomType: string
  date: string
  totalQuantity: number
}) => {
  return request.post<Result<RoomInventory>>('/admin/inventory/sync', null, { params })
}

export const bookInventory = (id: number, quantity: number) => {
  return request.post<Result<boolean>>(`/admin/inventory/${id}/book`, null, { params: { quantity } })
}

export const releaseInventory = (id: number, quantity: number) => {
  return request.post<Result<boolean>>(`/admin/inventory/${id}/release`, null, { params: { quantity } })
}

export const deleteInventory = (id: number) => {
  return request.delete<Result<void>>(`/admin/inventory/${id}`)
}

export const getInventoryDetails = (params: {
  page?: number
  size?: number
  roomInventoryId?: number
  routeId?: number
  hotelCode?: string
  roomType?: string
  roomNumber?: string
  startDate?: string
  endDate?: string
  roomStatus?: string
  cleanStatus?: string
}) => {
  return request.get<Result<PageResult<InventoryDetail>>>('/admin/inventory-details', { params })
}

export const getInventoryDetailById = (id: number) => {
  return request.get<Result<InventoryDetail>>(`/admin/inventory-details/${id}`)
}

export const getDetailsByInventoryId = (roomInventoryId: number) => {
  return request.get<Result<InventoryDetail[]>>(`/admin/inventory-details/by-inventory/${roomInventoryId}`)
}

export const createInventoryDetail = (data: InventoryDetail) => {
  return request.post<Result<InventoryDetail>>('/admin/inventory-details', data)
}

export const updateInventoryDetail = (data: InventoryDetail) => {
  return request.put<Result<InventoryDetail>>('/admin/inventory-details', data)
}

export const deleteInventoryDetail = (id: number) => {
  return request.delete<Result<void>>(`/admin/inventory-details/${id}`)
}
