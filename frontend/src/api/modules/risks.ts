import { get, post, put } from '../http'
import type { RiskSample, PaginationParams, PaginationResponse, RiskLevel } from '@/types'
import { mockRisks, mockPaginatedResponse, mockResponse } from '@/mock/data'

export async function getRiskListApi(params: PaginationParams & {
  riskLevel?: RiskLevel
  handled?: boolean
  sampleCategory?: string
}): Promise<PaginationResponse<RiskSample>> {
  let filtered = [...mockRisks]

  if (params.riskLevel) {
    filtered = filtered.filter(r => r.riskLevel === params.riskLevel)
  }
  if (params.handled !== undefined) {
    filtered = filtered.filter(r => r.handled === params.handled)
  }
  if (params.sampleCategory) {
    filtered = filtered.filter(r => r.sampleCategory === params.sampleCategory)
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(
      r => r.emailSubject.toLowerCase().includes(kw) ||
        r.description.toLowerCase().includes(kw) ||
        r.riskType.toLowerCase().includes(kw)
    )
  }

  return mockPaginatedResponse<RiskSample>(filtered, params.page, params.pageSize, 300)
}

export async function getRiskDetailApi(id: string): Promise<RiskSample> {
  const item = mockRisks.find(r => r.id === id)
  if (!item) {
    throw new Error('风险样本不存在')
  }
  return mockResponse<RiskSample>({ ...item }, 200)
}

export async function getRiskStatsApi(): Promise<{
  total: number
  unhandled: number
  byLevel: Record<RiskLevel, number>
}> {
  const byLevel: Record<RiskLevel, number> = {
    none: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  }

  mockRisks.forEach(r => {
    byLevel[r.riskLevel]++
  })

  return mockResponse({
    total: mockRisks.length,
    unhandled: mockRisks.filter(r => !r.handled).length,
    byLevel
  }, 200)
}

export async function handleRiskApi(id: string, params: {
  handlerComment: string
  suggestedContent?: string
}): Promise<RiskSample> {
  const index = mockRisks.findIndex(r => r.id === id)
  if (index === -1) {
    throw new Error('风险样本不存在')
  }

  mockRisks[index].handled = true
  mockRisks[index].handledBy = 'admin'
  mockRisks[index].handledAt = new Date().toISOString()
  mockRisks[index].handlerComment = params.handlerComment
  if (params.suggestedContent) {
    mockRisks[index].suggestedContent = params.suggestedContent
  }

  return mockResponse<RiskSample>(mockRisks[index], 400)
}

export async function exportRiskApi(ids: string[]): Promise<{ downloadUrl: string }> {
  return mockResponse({
    downloadUrl: '/download/risks.xlsx'
  }, 500)
}
