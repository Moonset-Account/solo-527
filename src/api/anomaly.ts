import api from './index'

export interface Anomaly {
  _id: string
  type: string
  severity: string
  batchId: string
  batchNo: string
  description: string
  status: string
  responsiblePerson: string
  impactScope: string
  handlingPlan: string
  relatedRecords: string[]
  ingredientId: string
  ingredientName: string
  expectedCost: number
  actualCost: number
  resolvedAt: string
  createdAt: string
  updatedAt: string
}

export const fetchAnomalies = (params?: Record<string, unknown>) => api.get('/anomalies', { params })
export const fetchAnomaly = (id: string) => api.get(`/anomalies/${id}`)
export const createAnomaly = (data: Partial<Anomaly>) => api.post('/anomalies', data)
export const updateAnomaly = (id: string, data: Partial<Anomaly>) => api.put(`/anomalies/${id}`, data)
export const assignResponsible = (id: string, responsiblePerson: string) => api.post(`/anomalies/${id}/assign`, { responsiblePerson })
export const setHandlingPlan = (id: string, handlingPlan: string) => api.post(`/anomalies/${id}/plan`, { handlingPlan })
export const updateAnomalyStatus = (id: string, status: string) => api.put(`/anomalies/${id}/status`, { status })
export const detectAnomalies = () => api.post('/anomalies/detect')
