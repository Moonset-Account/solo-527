import { get, post, put, del } from '../http'
import type { KnowledgeBase, PaginationParams, PaginationResponse, KnowledgeCategory } from '@/types'
import { mockKnowledge, mockPaginatedResponse, mockResponse } from '@/mock/data'

export async function getKnowledgeListApi(params: PaginationParams & {
  category?: KnowledgeCategory
  status?: string
}): Promise<PaginationResponse<KnowledgeBase>> {
  let filtered = [...mockKnowledge]

  if (params.category) {
    filtered = filtered.filter(k => k.category === params.category)
  }
  if (params.status) {
    filtered = filtered.filter(k => k.status === params.status)
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(
      k => k.title.toLowerCase().includes(kw) ||
        k.content.toLowerCase().includes(kw) ||
        k.tags.some(t => t.toLowerCase().includes(kw))
    )
  }

  return mockPaginatedResponse<KnowledgeBase>(filtered, params.page, params.pageSize, 300)
}

export async function getKnowledgeDetailApi(id: string): Promise<KnowledgeBase> {
  const item = mockKnowledge.find(k => k.id === id)
  if (!item) {
    throw new Error('知识库条目不存在')
  }
  return mockResponse<KnowledgeBase>({ ...item }, 200)
}

export async function createKnowledgeApi(data: Partial<KnowledgeBase>): Promise<KnowledgeBase> {
  const newItem: KnowledgeBase = {
    id: `kb_${Date.now()}`,
    title: data.title || '新条目',
    category: data.category || 'faq',
    content: data.content || '',
    tags: data.tags || [],
    version: '1.0.0',
    status: data.status || 'draft',
    createdBy: data.createdBy || 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data
  } as KnowledgeBase

  mockKnowledge.unshift(newItem)
  return mockResponse<KnowledgeBase>(newItem, 400)
}

export async function updateKnowledgeApi(id: string, data: Partial<KnowledgeBase>): Promise<KnowledgeBase> {
  const index = mockKnowledge.findIndex(k => k.id === id)
  if (index === -1) {
    throw new Error('知识库条目不存在')
  }

  const current = mockKnowledge[index]
  const versionParts = current.version.split('.').map(Number)
  versionParts[2] += 1

  mockKnowledge[index] = {
    ...current,
    ...data,
    version: versionParts.join('.'),
    updatedAt: new Date().toISOString()
  }

  return mockResponse<KnowledgeBase>(mockKnowledge[index], 400)
}

export async function deleteKnowledgeApi(id: string): Promise<void> {
  const index = mockKnowledge.findIndex(k => k.id === id)
  if (index > -1) {
    mockKnowledge.splice(index, 1)
  }
  return mockResponse<void>(undefined, 200)
}

export async function getKnowledgeCategoriesApi(): Promise<{ value: KnowledgeCategory; label: string }[]> {
  return mockResponse([
    { value: 'policy', label: '政策法规' },
    { value: 'product', label: '产品知识' },
    { value: 'compliance', label: '合规要求' },
    { value: 'procedure', label: '操作流程' },
    { value: 'faq', label: '常见问题' }
  ], 100)
}
