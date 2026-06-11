import { get, post } from '@/utils/request'

export type OrderStatus = 'pending' | 'dispatched' | 'arrived' | 'inProgress' | 'completed' | 'cancelled' | 'rescheduled'

export type SupplyDemandReason = 'worker_shortage' | 'peak_hours' | 'address_remote' | 'none'

export interface AddressSnapshot {
  contactName: string
  phone: string
  province: string
  city: string
  district: string
  community?: string
  detail: string
  lng?: number
  lat?: number
}

export interface OnTimeRecord {
  scheduled: boolean
  arrived: boolean
  completed: boolean
}

export interface OrderItem {
  _id: string
  orderNo: string
  userId: string
  serviceId: string
  serviceName?: string
  serviceCategory?: string
  addressId: string
  addressSnapshot: AddressSnapshot
  workerId?: string
  workerName?: string
  workerPhone?: string
  scheduledAt: string
  scheduledEndAt?: string
  duration: number
  price: number
  status: OrderStatus
  rescheduleCount: number
  cancelReason: string
  rescheduleReason: string
  supplyDemandReason: SupplyDemandReason
  actualArrivedAt?: string
  actualStartedAt?: string
  actualCompletedAt?: string
  onTimeRecord: OnTimeRecord
  community: string
  operator: string
  remark: string
  createdAt: string
  updatedAt: string
}

export interface OrderListResult {
  list: OrderItem[]
  total: number
  page: number
  pageSize: number
}

export interface CreateOrderParams {
  userId: string
  serviceId: string
  addressId: string
  scheduledAt: string
  remark?: string
  supplyDemandReason?: SupplyDemandReason
}

export interface QueryOrdersParams {
  status?: OrderStatus | OrderStatus[]
  startTime?: string
  endTime?: string
  community?: string
  communities?: string[]
  workerId?: string
  userId?: string
  supplyDemandReason?: SupplyDemandReason
  keyword?: string
  page?: number
  pageSize?: number
}

export interface DispatchOrderParams {
  orderId: string
  workerId: string
  operator?: {
    id?: string
    name: string
    role?: string
  }
}

export interface RescheduleOrderParams {
  orderId: string
  newScheduledAt: string
  reason: string
  operator?: {
    id?: string
    name: string
    role?: string
  }
}

export interface CancelOrderParams {
  orderId: string
  reason: string
  operator?: {
    id?: string
    name: string
    role?: string
  }
}

export interface UpdateFulfillmentParams {
  orderId: string
}

export interface BatchQueryParams {
  addressIds?: string[]
  communities?: string[]
  timeRange?: {
    startTime: string
    endTime: string
  }
}

export interface MarkSupplyDemandReasonParams {
  orderId: string
  supplyDemandReason: SupplyDemandReason
}

export interface TimelimeItem {
  type: 'scheduled' | 'dispatched' | 'arrived' | 'started' | 'completed' | 'cancelled' | 'rescheduled'
  label: string
  time?: string
  operator?: string
  remark?: string
  status: 'done' | 'current' | 'pending'
}

export function createOrder(params: CreateOrderParams) {
  return post<OrderItem>('/orders', params)
}

export function getOrderList(params?: QueryOrdersParams) {
  return get<OrderListResult>('/orders', params)
}

export function getOrderById(id: string) {
  return get<OrderItem>(`/orders/${id}`)
}

export function dispatchOrder(params: DispatchOrderParams) {
  return post<OrderItem>('/orders/dispatch', params)
}

export function rescheduleOrder(params: RescheduleOrderParams) {
  return post<OrderItem>('/orders/reschedule', params)
}

export function cancelOrder(params: CancelOrderParams) {
  return post<OrderItem>('/orders/cancel', params)
}

export function arriveOrder(params: UpdateFulfillmentParams) {
  return post<OrderItem>('/orders/arrive', params)
}

export function startOrder(params: UpdateFulfillmentParams) {
  return post<OrderItem>('/orders/start', params)
}

export function completeOrder(params: UpdateFulfillmentParams) {
  return post<OrderItem>('/orders/complete', params)
}

export function batchQueryOrders(params: BatchQueryParams) {
  return post<OrderItem[]>('/orders/batch-query', params)
}

export function markSupplyReason(params: MarkSupplyDemandReasonParams) {
  return post<OrderItem>('/orders/supply-demand-reason', params)
}
