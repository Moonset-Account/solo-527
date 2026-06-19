import { get, post, put } from '@/utils/request'
import type { Rule, RuleToggle, PagedResponse, PaginationParams } from '@/types'

export const getRuleList = (params: PaginationParams): Promise<PagedResponse<Rule>> => {
  return get<PagedResponse<Rule>>('/rules', params)
}

export const getRuleDetail = (id: number): Promise<Rule> => {
  return get<Rule>(`/rules/${id}`)
}

export const createRule = (data: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rule> => {
  return post<Rule>('/rules', data)
}

export const updateRule = (id: number, data: Partial<Rule>): Promise<Rule> => {
  return put<Rule>(`/rules/${id}`, data)
}

export const toggleRule = (data: RuleToggle): Promise<void> => {
  return post<void>('/rules/toggle', data)
}

export const getRuleCategories = (): Promise<string[]> => {
  return get<string[]>('/rules/categories')
}

export const getRuleToggleHistory = (
  ruleCode: string
): Promise<
  {
    id: number
    operator: string
    operateTime: string
    effectiveTime: string
    enabled: boolean
  }[]
> => {
  return get(`/rules/${ruleCode}/toggle-history`)
}
