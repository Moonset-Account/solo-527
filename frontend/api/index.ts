import request from '../utils/request'
import type { ApiResponse, PageResult } from '../utils/request'

export function login(data: { username: string; password: string }) {
  return request.post<any, ApiResponse<{ access_token: string; user: any }>>('/auth/login', data)
}

export function register(data: any) {
  return request.post<any, ApiResponse<any>>('/auth/register', data)
}

export function getCurrentUser() {
  return request.get<any, ApiResponse<any>>('/auth/me')
}

export function listMaterials(params?: any) {
  return request.get<any, ApiResponse<PageResult<any>>>('/materials', { params })
}

export function createMaterial(data: any) {
  return request.post<any, ApiResponse<any>>('/materials', data)
}

export function getMaterial(id: number) {
  return request.get<any, ApiResponse<any>>(`/materials/${id}`)
}

export function updateMaterial(id: number, data: any) {
  return request.put<any, ApiResponse<any>>(`/materials/${id}`, data)
}

export function listCategories(params?: any) {
  return request.get<any, ApiResponse<PageResult<any>>>('/materials/categories', { params })
}

export function createCategory(data: any) {
  return request.post<any, ApiResponse<any>>('/materials/categories', data)
}

export function listMonthlyUsages(params?: any) {
  return request.get<any, ApiResponse<PageResult<any>>>('/materials/monthly-usages', { params })
}

export function createMonthlyUsage(data: any) {
  return request.post<any, ApiResponse<any>>('/materials/monthly-usages', data)
}

export function updateMonthlyUsage(id: number, data: any) {
  return request.put<any, ApiResponse<any>>(`/materials/monthly-usages/${id}`, data)
}

export function listSuppliers(params?: any) {
  return request.get<any, ApiResponse<PageResult<any>>>('/suppliers', { params })
}

export function createSupplier(data: any) {
  return request.post<any, ApiResponse<any>>('/suppliers', data)
}

export function getSupplier(id: number) {
  return request.get<any, ApiResponse<any>>(`/suppliers/${id}`)
}

export function updateSupplier(id: number, data: any) {
  return request.put<any, ApiResponse<any>>(`/suppliers/${id}`, data)
}

export function listQuotes(params?: any) {
  return request.get<any, ApiResponse<PageResult<any>>>('/quotes', { params })
}

export function createQuote(data: any) {
  return request.post<any, ApiResponse<any>>('/quotes', data)
}

export function getQuote(id: number) {
  return request.get<any, ApiResponse<any>>(`/quotes/${id}`)
}

export function updateQuote(id: number, data: any) {
  return request.put<any, ApiResponse<any>>(`/quotes/${id}`, data)
}

export function compareQuotes(materialId: number) {
  return request.post<any, ApiResponse<any>>(`/quotes/compare/${materialId}`)
}

export function listPurchaseRequests(params?: any) {
  return request.get<any, ApiResponse<PageResult<any>>>('/purchases/requests', { params })
}

export function createPurchaseRequest(data: any) {
  return request.post<any, ApiResponse<any>>('/purchases/requests', data)
}

export function getPurchaseRequest(id: number) {
  return request.get<any, ApiResponse<any>>(`/purchases/requests/${id}`)
}

export function updatePurchaseRequest(id: number, data: any) {
  return request.put<any, ApiResponse<any>>(`/purchases/requests/${id}`, data)
}

export function listPurchaseOrders(params?: any) {
  return request.get<any, ApiResponse<PageResult<any>>>('/purchases/orders', { params })
}

export function createPurchaseOrder(data: any) {
  return request.post<any, ApiResponse<any>>('/purchases/orders', data)
}

export function getPurchaseOrder(id: number) {
  return request.get<any, ApiResponse<any>>(`/purchases/orders/${id}`)
}

export function updatePurchaseOrder(id: number, data: any) {
  return request.put<any, ApiResponse<any>>(`/purchases/orders/${id}`, data)
}

export function listAgreements(params?: any) {
  return request.get<any, ApiResponse<PageResult<any>>>('/agreements', { params })
}

export function createAgreement(data: any) {
  return request.post<any, ApiResponse<any>>('/agreements', data)
}

export function getAgreement(id: number) {
  return request.get<any, ApiResponse<any>>(`/agreements/${id}`)
}

export function updateAgreement(id: number, data: any) {
  return request.put<any, ApiResponse<any>>(`/agreements/${id}`, data)
}

export function getDashboardSummary() {
  return request.get<any, ApiResponse<any>>('/dashboard/summary')
}

export function getMonthlyTrend(months = 6) {
  return request.get<any, ApiResponse<any>>('/dashboard/monthly-trend', { params: { months } })
}

export function getCategoryStats() {
  return request.get<any, ApiResponse<any>>('/dashboard/category-stats')
}

export function listAuditLogs(params?: any) {
  return request.get<any, ApiResponse<PageResult<any>>>('/dashboard/audit-logs', { params })
}

export function listNotifications(params?: any) {
  return request.get<any, ApiResponse<PageResult<any>>>('/dashboard/notifications', { params })
}

export function markNotificationRead(id: number) {
  return request.put<any, ApiResponse<any>>(`/dashboard/notifications/${id}/read`)
}
