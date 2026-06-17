import request from './request'

export interface Order {
  id: number
  orderNo: string
  deviceType: string
  deviceBrand: string
  faultDescription: string
  faultImages: string[]
  contactName: string
  contactPhone: string
  address: string
  appointmentTime: string
  status: OrderStatus
  statusText: string
  price?: number
  technician?: {
    id: number
    name: string
    phone: string
    avatar?: string
    skills: string[]
  }
  rating?: number
  review?: string
  createdAt: string
  updatedAt: string
  progress?: OrderProgress[]
}

export type OrderStatus = 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'

export interface OrderProgress {
  status: string
  statusText: string
  time: string
  description?: string
}

export interface CreateOrderParams {
  deviceType: string
  deviceBrand?: string
  faultDescription?: string
  faultPhotos?: string[]
  contactName: string
  contactPhone: string
  address: string
  appointmentTime: string
  communityId?: number | null
  channel?: string
  remark?: string
}

export interface OrderListParams {
  page?: number
  pageSize?: number
  status?: OrderStatus | ''
  keyword?: string
}

export interface OrderListResponse {
  list: Order[]
  total: number
  page: number
  pageSize: number
}

export function createOrder(data: CreateOrderParams) {
  return request.post<Order>('/orders', data)
}

export function getOrderList(params?: OrderListParams) {
  return request.get<OrderListResponse>('/orders', { params })
}

export function getOrderDetail(id: number | string) {
  return request.get<Order>(`/orders/${id}`)
}

export function cancelOrder(id: number | string, reason?: string) {
  return request.post(`/orders/${id}/cancel`, { reason })
}

export function rescheduleOrder(id: number | string, appointmentTime: string) {
  return request.post(`/orders/${id}/reschedule`, { appointmentTime })
}

export function reviewOrder(id: number | string, rating: number, review?: string) {
  return request.post(`/orders/${id}/review`, { rating, review })
}

export function getOrderStats() {
  return request.get('/orders/stats')
}
