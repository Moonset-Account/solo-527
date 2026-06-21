import { get, post, put, del } from '../http'
import type { TemplateStatus, PaginationParams, PaginationResponse } from '@/types'

function mapTemplateFromBackend(d: any): TemplateStatus {
  const status = d.status === 'published' ? 'active' : d.status === 'archived' ? 'deprecated' : d.status || 'draft'
  return {
    id: String(d.id ?? d.versionId ?? Date.now()),
    name: d.name || '',
    description: d.description || '',
    content: d.content || '',
    variables: d.variables || [],
    version: d.version || '1.0.0',
    category: d.category || 'general',
    status: (status as 'active' | 'draft' | 'deprecated'),
    isDefault: Boolean(d.isCurrent || d.isDefault || false),
    createdBy: String(d.createdBy || d.created_by || ''),
    createdAt: d.createdAt || d.created_at || new Date().toISOString(),
    updatedAt: d.updatedAt || d.updated_at || new Date().toISOString(),
    approvedBy: d.approvedBy ? String(d.approvedBy) : undefined,
    approvedAt: d.approvedAt || d.approved_at,
  }
}

export async function getTemplateListApi(params: PaginationParams & {
  status?: string
  category?: string
}): Promise<PaginationResponse<TemplateStatus>> {
  try {
    const q: any = { page: params.page || 1, perPage: params.pageSize || 50 }
    if (params.category) q.category = params.category
    if (params.status) {
      let backendStatus = params.status
      if (params.status === 'active') backendStatus = 'published'
      if (params.status === 'deprecated') backendStatus = 'archived'
      q.status = backendStatus
    }
    const resp = await get<any>('/templates', q)
    const list = resp?.data || resp?.list || []
    return {
      list: list.map(mapTemplateFromBackend),
      total: resp?.pagination?.total ?? list.length,
      page: params.page || 1,
      pageSize: params.pageSize || 50,
    }
  } catch {
    return {
      list: [],
      total: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 50,
    }
  }
}

export async function getTemplateDetailApi(id: string): Promise<TemplateStatus> {
  return Promise.resolve({
    id,
    name: '模板',
    description: '',
    content: '',
    variables: [],
    version: '1.0.0',
    category: 'general',
    status: 'active',
    isDefault: false,
    createdBy: '',
    createdAt: '',
    updatedAt: '',
  })
}

export async function createTemplateApi(data: Partial<TemplateStatus>): Promise<TemplateStatus> {
  return Promise.resolve({
    id: `tpl_${Date.now()}`,
    name: data.name || '',
    description: data.description || '',
    content: data.content || '',
    variables: data.variables || [],
    version: '1.0.0',
    category: data.category || 'general',
    status: data.status || 'draft',
    isDefault: data.isDefault || false,
    createdBy: data.createdBy || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

export async function updateTemplateApi(id: string, data: Partial<TemplateStatus>): Promise<TemplateStatus> {
  return Promise.resolve({
    id,
    name: data.name || '',
    description: data.description || '',
    content: data.content || '',
    variables: data.variables || [],
    version: data.version || '1.0.0',
    category: data.category || 'general',
    status: (data.status as 'active' | 'draft' | 'deprecated') || 'draft',
    isDefault: data.isDefault || false,
    createdBy: data.createdBy || '',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

export async function approveTemplateApi(id: string): Promise<TemplateStatus> {
  return Promise.resolve({
    id,
    name: '已审批模板',
    description: '',
    content: '',
    variables: [],
    version: '1.0.0',
    category: 'general',
    status: 'active',
    isDefault: false,
    createdBy: '',
    createdAt: '',
    updatedAt: new Date().toISOString(),
    approvedBy: '',
    approvedAt: new Date().toISOString(),
  })
}

export async function deleteTemplateApi(id: string): Promise<void> {
  return Promise.resolve()
}
