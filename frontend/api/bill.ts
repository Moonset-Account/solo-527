import request from './request'
import type { ApiResponse, PageResult, Bill, BillPayment, CollectionProgress } from '~/types'

export interface BillQuery {
  page?: number
  page_size?: number
  keyword?: string
  bill_type?: string
  status?: string
  lease_id?: number
  bill_date_from?: string
  bill_date_to?: string
  due_date_from?: string
  due_date_to?: string
}

export function getBillList(params: BillQuery): Promise<ApiResponse<PageResult<Bill>>> {
  return request.get('/bills', { params })
}

export function getBillDetail(id: number): Promise<ApiResponse<Bill>> {
  return request.get(`/bills/${id}`)
}

export function createBill(data: Partial<Bill>): Promise<ApiResponse<Bill>> {
  return request.post('/bills', data)
}

export function updateBill(id: number, data: Partial<Bill>): Promise<ApiResponse<Bill>> {
  return request.put(`/bills/${id}`, data)
}

export function deleteBill(id: number): Promise<ApiResponse> {
  return request.delete(`/bills/${id}`)
}

export function generateBills(data: any): Promise<ApiResponse> {
  return request.post('/bills/generate', data)
}

export function getCollectionProgress(): Promise<ApiResponse<CollectionProgress>> {
  return request.get('/bills/collection-progress')
}

export function exportBills(params: BillQuery): Promise<Blob> {
  return request.get('/bills/export/download', { params, responseType: 'blob' })
}

export function getBillPayments(billId: number): Promise<ApiResponse<BillPayment[]>> {
  return request.get(`/bills/${billId}/payments`)
}

export function createBillPayment(data: Partial<BillPayment>): Promise<ApiResponse<BillPayment>> {
  return request.post('/bills/payments', data)
}

export function deleteBillPayment(id: number): Promise<ApiResponse> {
  return request.delete(`/bills/payments/${id}`)
}
