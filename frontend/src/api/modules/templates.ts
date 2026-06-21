import { get, post, put, del } from '../http'
import type { TemplateStatus, PaginationParams, PaginationResponse } from '@/types'
import { mockTemplates, mockPaginatedResponse, mockResponse } from '@/mock/data'

export async function getTemplateListApi(params: PaginationParams & {
  status?: string
  category?: string
}): Promise<PaginationResponse<TemplateStatus>> {
  let filtered = [...mockTemplates]

  if (params.status) {
    filtered = filtered.filter(t => t.status === params.status)
  }
  if (params.category) {
    filtered = filtered.filter(t => t.category === params.category)
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(
      t => t.name.toLowerCase().includes(kw) ||
        t.description.toLowerCase().includes(kw)
    )
  }

  return mockPaginatedResponse<TemplateStatus>(filtered, params.page, params.pageSize, 300)
}

export async function getTemplateDetailApi(id: string): Promise<TemplateStatus> {
  const item = mockTemplates.find(t => t.id === id)
  if (!item) {
    throw new Error('话术模板不存在')
  }
  return mockResponse<TemplateStatus>({ ...item }, 200)
}

export async function createTemplateApi(data: Partial<TemplateStatus>): Promise<TemplateStatus> {
  const newItem: TemplateStatus = {
    id: `tpl_${Date.now()}`,
    name: data.name || '新话术模板',
    description: data.description || '',
    content: data.content || '',
    variables: data.variables || [],
    version: '1.0.0',
    category: data.category || 'general',
    status: data.status || 'draft',
    isDefault: data.isDefault || false,
    createdBy: data.createdBy || 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data
  } as TemplateStatus

  mockTemplates.unshift(newItem)
  return mockResponse<TemplateStatus>(newItem, 400)
}

export async function updateTemplateApi(id: string, data: Partial<TemplateStatus>): Promise<TemplateStatus> {
  const index = mockTemplates.findIndex(t => t.id === id)
  if (index === -1) {
    throw new Error('话术模板不存在')
  }

  const current = mockTemplates[index]
  const versionParts = current.version.split('.').map(Number)
  versionParts[2] += 1

  mockTemplates[index] = {
    ...current,
    ...data,
    version: versionParts.join('.'),
    updatedAt: new Date().toISOString()
  }

  return mockResponse<TemplateStatus>(mockTemplates[index], 400)
}

export async function approveTemplateApi(id: string): Promise<TemplateStatus> {
  const index = mockTemplates.findIndex(t => t.id === id)
  if (index === -1) {
    throw new Error('话术模板不存在')
  }

  mockTemplates[index].status = 'active'
  mockTemplates[index].approvedBy = 'admin'
  mockTemplates[index].approvedAt = new Date().toISOString()
  mockTemplates[index].updatedAt = new Date().toISOString()

  return mockResponse<TemplateStatus>(mockTemplates[index], 400)
}

export async function deleteTemplateApi(id: string): Promise<void> {
  const index = mockTemplates.findIndex(t => t.id === id)
  if (index > -1) {
    mockTemplates.splice(index, 1)
  }
  return mockResponse<void>(undefined, 200)
}
