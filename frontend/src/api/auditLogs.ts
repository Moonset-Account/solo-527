import request from '@/utils/request'
import type { AuditLog, PaginatedResponse } from '@/types'

export const getAuditLogs = (params?: any) => {
  return request.get<any, PaginatedResponse<AuditLog>>('/audit_logs', { params })
}
