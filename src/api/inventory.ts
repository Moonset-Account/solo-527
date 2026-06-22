import api from './index'

export interface InventoryItem {
  _id: string
  ingredientId: string
  ingredientName: string
  category: string
  unit: string
  currentStock: number
  minStock: number
  currentCost: number
  updatedAt: string
}

export interface InventoryLog {
  _id: string
  ingredientId: string
  ingredientName: string
  type: string
  quantity: number
  unit: string
  costPerUnit: number
  totalCost: number
  operator: string
  note: string
  isSandbox: boolean
  createdAt: string
}

export const fetchInventoryOverview = () => api.get('/inventory/overview')
export const fetchInventoryLogs = (params?: Record<string, unknown>) => api.get('/inventory/logs', { params })
export const createInbound = (data: Partial<InventoryLog>) => api.post('/inventory/inbound', data)
export const createOutbound = (data: Partial<InventoryLog>) => api.post('/inventory/outbound', data)
export const fetchScrapRecords = () => api.get('/inventory/scraps')
