import { get, post, put, del } from '../http'
import type { PromptVersion, PaginationParams, PaginationResponse } from '@/types'
import { mockPrompts, mockPaginatedResponse, mockResponse } from '@/mock/data'

export async function getPromptListApi(params: PaginationParams & {
  status?: string
  model?: string
}): Promise<PaginationResponse<PromptVersion>> {
  let filtered = [...mockPrompts]

  if (params.status) {
    filtered = filtered.filter(p => p.status === params.status)
  }
  if (params.model) {
    filtered = filtered.filter(p => p.model === params.model)
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(
      p => p.name.toLowerCase().includes(kw) ||
        p.systemPrompt.toLowerCase().includes(kw) ||
        p.changeLog.toLowerCase().includes(kw)
    )
  }

  return mockPaginatedResponse<PromptVersion>(filtered, params.page, params.pageSize, 300)
}

export async function getPromptDetailApi(id: string): Promise<PromptVersion> {
  const item = mockPrompts.find(p => p.id === id)
  if (!item) {
    throw new Error('提示词版本不存在')
  }
  return mockResponse<PromptVersion>({ ...item }, 200)
}

export async function createPromptApi(data: Partial<PromptVersion>): Promise<PromptVersion> {
  const newItem: PromptVersion = {
    id: `prompt_${Date.now()}`,
    name: data.name || '新提示词版本',
    systemPrompt: data.systemPrompt || '你是一个专业的邮件助手。',
    userPrompt: data.userPrompt || '请根据以下信息生成邮件：{{input}}',
    temperature: data.temperature ?? 0.7,
    maxTokens: data.maxTokens ?? 2048,
    topP: data.topP ?? 0.9,
    version: '1.0.0',
    model: data.model || 'gpt-4',
    status: data.status || 'testing',
    changeLog: data.changeLog || '初始版本',
    createdBy: data.createdBy || 'admin',
    createdAt: new Date().toISOString(),
    ...data
  } as PromptVersion

  mockPrompts.unshift(newItem)
  return mockResponse<PromptVersion>(newItem, 400)
}

export async function updatePromptApi(id: string, data: Partial<PromptVersion>): Promise<PromptVersion> {
  const index = mockPrompts.findIndex(p => p.id === id)
  if (index === -1) {
    throw new Error('提示词版本不存在')
  }

  const current = mockPrompts[index]
  const versionParts = current.version.split('.').map(Number)
  versionParts[2] += 1

  mockPrompts[index] = {
    ...current,
    ...data,
    version: versionParts.join('.'),
    createdAt: current.createdAt
  }

  return mockResponse<PromptVersion>(mockPrompts[index], 400)
}

export async function approvePromptApi(id: string): Promise<PromptVersion> {
  const index = mockPrompts.findIndex(p => p.id === id)
  if (index === -1) {
    throw new Error('提示词版本不存在')
  }

  mockPrompts[index].status = 'active'
  mockPrompts[index].approvedBy = 'admin'
  mockPrompts[index].approvedAt = new Date().toISOString()
  mockPrompts[index].accuracy = 95.5
  mockPrompts[index].testCasesPassed = 96
  mockPrompts[index].testCasesTotal = 100

  return mockResponse<PromptVersion>(mockPrompts[index], 400)
}

export async function deletePromptApi(id: string): Promise<void> {
  const index = mockPrompts.findIndex(p => p.id === id)
  if (index > -1) {
    mockPrompts.splice(index, 1)
  }
  return mockResponse<void>(undefined, 200)
}

export async function testPromptApi(id: string, testInput: string): Promise<{ output: string; tokens: number; time: number }> {
  return mockResponse({
    output: `这是对输入"${testInput}"的模拟响应。邮件内容已根据提示词模板生成。`,
    tokens: 256,
    time: 1.23
  }, 1000)
}
