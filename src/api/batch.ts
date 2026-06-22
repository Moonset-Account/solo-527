import api from './index'

export interface Batch {
  _id: string
  batchNo: string
  recipeId: string
  recipeName: string
  plannedQty: number
  actualQty: number
  teamId: string
  teamName: string
  status: string
  unit: string
  standardCost: number
  actualCost: number
  costVariance: number
  reworkCost: number
  consumableCost: number
  scrapQty: number
  reworkQty: number
  isRework: boolean
  parentBatchId: string
  startTime: string
  endTime: string
  attachments: { url: string; name: string; uploadedAt: string }[]
  notes: { content: string; author: string; createdAt: string }[]
  history: { field: string; oldValue: any; newValue: any; changedBy: string; changedAt: string }[]
  isSandbox: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedBatches {
  items: Batch[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const fetchBatches = (params?: Record<string, unknown>) => api.get('/batches', { params })
export const fetchBatch = (id: string) => api.get(`/batches/${id}`)
export const createBatch = (data: Partial<Batch>) => api.post('/batches', data)
export const updateBatch = (id: string, data: Partial<Batch>) => api.put(`/batches/${id}`, data)
export const deleteBatch = (id: string) => api.delete(`/batches/${id}`)
export const pickUpBatch = (id: string) => api.post(`/batches/${id}/pickup`)
export const scrapBatch = (id: string, data: { quantity: number; reason: string; ingredientId?: string; ingredientName?: string }) => api.post(`/batches/${id}/scrap`, data)
export const reworkBatch = (id: string, data: { reworkQty: number; reworkCost: number; reason?: string }) => api.post(`/batches/${id}/rework`, data)
export const addBatchNote = (id: string, data: { content: string; author?: string }) => api.post(`/batches/${id}/notes`, data)
export const addBatchAttachment = (id: string, data: { url: string; name: string }) => api.post(`/batches/${id}/attachments`, data)
export const calculateBatchCosts = (id: string) => api.post(`/batches/${id}/calculate-costs`)
