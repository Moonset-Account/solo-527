import { get } from '../http'
import type { OperationLog, PaginationParams, PaginationResponse, LogModule, LogAction } from '@/types'
import { mockLogs, mockPaginatedResponse, mockResponse } from '@/mock/data'

export async function getLogListApi(params: PaginationParams & {
  module?: LogModule
  action?: LogAction
  userId?: string
  status?: string
  startDate?: string
  endDate?: string
}): Promise<PaginationResponse<OperationLog>> {
  let filtered = [...mockLogs]

  if (params.module) {
    filtered = filtered.filter(l => l.module === params.module)
  }
  if (params.action) {
    filtered = filtered.filter(l => l.action === params.action)
  }
  if (params.userId) {
    filtered = filtered.filter(l => l.userId === params.userId)
  }
  if (params.status) {
    filtered = filtered.filter(l => l.status === params.status)
  }
  if (params.startDate) {
    filtered = filtered.filter(l => l.createdAt >= params.startDate!)
  }
  if (params.endDate) {
    filtered = filtered.filter(l => l.createdAt <= params.endDate!)
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(
      l => l.userName.toLowerCase().includes(kw) ||
        l.description.toLowerCase().includes(kw) ||
        (l.targetName && l.targetName.toLowerCase().includes(kw))
    )
  }

  return mockPaginatedResponse<OperationLog>(filtered, params.page, params.pageSize, 300)
}

export async function getLogDetailApi(id: string): Promise<OperationLog> {
  const item = mockLogs.find(l => l.id === id)
  if (!item) {
    throw new Error('日志记录不存在')
  }
  return mockResponse<OperationLog>({ ...item }, 200)
}

export async function getLogModulesApi(): Promise<{ value: LogModule; label: string }[]> {
  return mockResponse([
    { value: 'auth', label: '认证授权' },
    { value: 'knowledge', label: '知识库' },
    { value: 'template', label: '话术模板' },
    { value: 'prompt', label: '提示词' },
    { value: 'email', label: '邮件' },
    { value: 'review', label: '复核' },
    { value: 'risk', label: '风险' },
    { value: 'user', label: '用户' },
    { value: 'system', label: '系统' }
  ], 100)
}

export async function getLogActionsApi(): Promise<{ value: LogAction; label: string }[]> {
  return mockResponse([
    { value: 'login', label: '登录' },
    { value: 'logout', label: '登出' },
    { value: 'create', label: '创建' },
    { value: 'update', label: '更新' },
    { value: 'delete', label: '删除' },
    { value: 'approve', label: '审批' },
    { value: 'reject', label: '拒绝' },
    { value: 'generate', label: '生成' },
    { value: 'send', label: '发送' },
    { value: 'review', label: '复核' },
    { value: 'export', label: '导出' }
  ], 100)
}

export async function exportLogsApi(params: {
  startDate?: string
  endDate?: string
  module?: LogModule
}): Promise<{ downloadUrl: string }> {
  return mockResponse({
    downloadUrl: '/download/logs.xlsx'
  }, 800)
}
