import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

export function globalSearch(params: {
  q: string
  types?: string
  categories?: string
  severities?: string
  statuses?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}) {
  return request.get('/search', { params })
}

export function getSuggestions(q: string) {
  return request.get<string[]>('/search/suggest', { params: { q } })
}

export const suggestKeywords = getSuggestions
