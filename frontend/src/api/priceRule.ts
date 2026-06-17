import request from './request'

export interface PriceRule {
  id: number
  name: string
  deviceType: string
  basePrice: number
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export function getPriceRuleList(params?: any) {
  return request.get<{ list: PriceRule[]; total: number }>('/admin/price-rules', { params })
}

export function getPriceRuleDetail(id: number) {
  return request.get<PriceRule>(`/admin/price-rules/${id}`)
}

export function createPriceRule(data: Partial<PriceRule>) {
  return request.post<PriceRule>('/admin/price-rules', data)
}

export function updatePriceRule(id: number, data: Partial<PriceRule>) {
  return request.put<PriceRule>(`/admin/price-rules/${id}`, data)
}

export function deletePriceRule(id: number) {
  return request.delete(`/admin/price-rules/${id}`)
}

export function getPriceRulesByDeviceType(deviceType: string) {
  return request.get<PriceRule[]>('/price-rules/by-device', { params: { deviceType } })
}
