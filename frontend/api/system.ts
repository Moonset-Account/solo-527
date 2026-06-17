import request from './request'
import type { ApiResponse, PageResult, Dictionary, DictionaryItem, ValidationRule, OperationLog } from '~/types'

export function getDictionaryList(params: any): Promise<ApiResponse<PageResult<Dictionary>>> {
  return request.get('/dictionaries', { params })
}

export function getDictionary(code: string): Promise<ApiResponse<Dictionary>> {
  return request.get(`/dictionaries/${code}`)
}

export function getDictionaryItems(code: string): Promise<ApiResponse<DictionaryItem[]>> {
  return request.get(`/dictionaries/${code}/items`)
}

export function getAllDictionaries(): Promise<ApiResponse<Record<string, DictionaryItem[]>>> {
  return request.get('/dictionaries/all')
}

export function createDictionary(data: any): Promise<ApiResponse<Dictionary>> {
  return request.post('/dictionaries', data)
}

export function updateDictionary(id: number, data: any): Promise<ApiResponse<Dictionary>> {
  return request.put(`/dictionaries/${id}`, data)
}

export function deleteDictionary(id: number): Promise<ApiResponse> {
  return request.delete(`/dictionaries/${id}`)
}

export function addDictionaryItem(dictionaryId: number, data: any): Promise<ApiResponse<DictionaryItem>> {
  return request.post(`/dictionaries/${dictionaryId}/items`, data)
}

export function updateDictionaryItem(id: number, data: any): Promise<ApiResponse<DictionaryItem>> {
  return request.put(`/dictionary-items/${id}`, data)
}

export function deleteDictionaryItem(id: number): Promise<ApiResponse> {
  return request.delete(`/dictionary-items/${id}`)
}

export function getValidationRules(params: any): Promise<ApiResponse<PageResult<ValidationRule>>> {
  return request.get('/validation-rules', { params })
}

export function createValidationRule(data: any): Promise<ApiResponse<ValidationRule>> {
  return request.post('/validation-rules', data)
}

export function updateValidationRule(id: number, data: any): Promise<ApiResponse<ValidationRule>> {
  return request.put(`/validation-rules/${id}`, data)
}

export function deleteValidationRule(id: number): Promise<ApiResponse> {
  return request.delete(`/validation-rules/${id}`)
}

export function validateField(data: { field_name: string; value: any }): Promise<ApiResponse> {
  return request.post('/validation-rules/validate', data)
}

export function getOperationLogs(params: any): Promise<ApiResponse<PageResult<OperationLog>>> {
  return request.get('/operation-logs', { params })
}

export function getOperationLogDetail(id: number): Promise<ApiResponse<OperationLog>> {
  return request.get(`/operation-logs/${id}`)
}

export function getUserList(params: any): Promise<ApiResponse<PageResult>> {
  return request.get('/users', { params })
}

export function createUser(data: any): Promise<ApiResponse> {
  return request.post('/users', data)
}

export function updateUser(id: number, data: any): Promise<ApiResponse> {
  return request.put(`/users/${id}`, data)
}

export function deleteUser(id: number): Promise<ApiResponse> {
  return request.delete(`/users/${id}`)
}

export function getRoles(): Promise<ApiResponse> {
  return request.get('/users/roles/list')
}
