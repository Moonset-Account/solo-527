import request from '@/utils/request'

export const getInventorySummary = (params) => {
  return request.get('/inventory/summary', { params })
}

export const getInventoryDetail = (id) => {
  return request.get(`/inventory/${id}/detail`)
}

export const getInventoryLogs = (params) => {
  return request.get('/inventory/logs', { params })
}

export const adjustInventory = (id, quantity, remark) => {
  return request.post(`/inventory/${id}/adjust`, { quantity, remark })
}
