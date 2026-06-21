import { get, put } from '../http'
import type { EmailDraft, PaginationResponse, ReviewRecord, PaginationParams, ReviewResult, RiskLevel } from '@/types'

type BackendEmailStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'used'
type EmailStatus = 'draft' | 'ai_generated' | 'pending_review' | 'approved' | 'sent' | 'rejected'

function mapStatusFromBackend(status: BackendEmailStatus | string): EmailStatus {
  switch (status) {
    case 'draft': return 'draft'
    case 'submitted': return 'pending_review'
    case 'approved': return 'approved'
    case 'rejected': return 'rejected'
    case 'used': return 'sent'
    default: return 'draft'
  }
}

function mapEmailFromBackend(data: any): EmailDraft {
  const customerBg = data?.customer_background || {}
  const citedSources = data?.cited_sources || []
  const knowledgeIds: string[] = Array.isArray(citedSources)
    ? citedSources.map((s: any) => String(typeof s === 'object' ? (s.id ?? s) : s))
    : []
  const aiSuggestion = Array.isArray(citedSources) && citedSources.length > 0 && typeof citedSources[0] === 'object'
    ? (citedSources[0] as any).note || (citedSources[0] as any).suggestion
    : undefined

  return {
    id: String(data.id ?? ''),
    subject: data.subject || '',
    recipient: customerBg.companyName || data.recipient || '',
    recipientName: data.recipientName || customerBg.contactName || '',
    content: data.body || data.content || '',
    status: mapStatusFromBackend(data.status || 'draft'),
    priority: (data.priority as any) || 'normal',
    category: data.category || 'general',
    templateId: data.template_version_id ? String(data.template_version_id) : undefined,
    promptId: data.prompt_id ? String(data.prompt_id) : undefined,
    knowledgeIds,
    aiSuggestion,
    riskLevel: (data.riskLevel as any) || 'none',
    riskItems: [],
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
    reviewedAt: data.reviewed_at || data.reviewedAt,
    sentAt: data.sent_at || data.sentAt,
    generatedBy: data.created_by ? String(data.created_by) : undefined,
    reviewedBy: data.reviewed_by ? String(data.reviewed_by) : undefined,
    sentBy: data.sent_by ? String(data.sent_by) : undefined,
  } as EmailDraft
}

export async function getPendingReviewListApi(params: {
  page: number
  perPage: number
  status?: 'submitted' | 'approved' | 'rejected'
}): Promise<PaginationResponse<EmailDraft>> {
  const q: any = { page: params.page, perPage: params.perPage }
  if (params.status) q.status = params.status
  const resp = await get<any>('/reviews', q)
  const list = resp?.data || resp?.list || []
  const pagination = resp?.pagination || {}
  return {
    list: list.map(mapEmailFromBackend),
    total: pagination.total ?? list.length,
    page: pagination.page ?? params.page,
    pageSize: pagination.perPage ?? params.perPage,
  }
}

export async function approveReviewApi(id: string, afterContent?: string): Promise<EmailDraft> {
  const data = await put<any>(`/reviews/${id}/approve`, { afterContent })
  return mapEmailFromBackend(data)
}

export async function rejectReviewApi(id: string, code: string, note?: string): Promise<EmailDraft> {
  const data = await put<any>(`/reviews/${id}/reject`, {
    rejectReasonCode: code,
    rejectNote: note || '',
  })
  return mapEmailFromBackend(data)
}

export async function getReviewListApi(params: PaginationParams & {
  result?: ReviewResult
  riskLevel?: RiskLevel
}): Promise<PaginationResponse<ReviewRecord>> {
  return Promise.resolve({
    list: [],
    total: 0,
    page: params.page,
    pageSize: params.pageSize,
  })
}

export async function getReviewDetailApi(id: string): Promise<ReviewRecord> {
  return Promise.resolve({
    id,
    emailId: '',
    emailSubject: '',
    reviewerId: '',
    reviewerName: '',
    result: 'approved',
    comments: '',
    riskLevelAfter: 'none',
    createdAt: new Date().toISOString(),
  })
}

export async function getPendingReviewCountApi(): Promise<{ count: number }> {
  try {
    const resp = await get<any>('/reviews', { page: 1, perPage: 1, status: 'submitted' })
    return { count: resp?.pagination?.total ?? 0 }
  } catch {
    return { count: 0 }
  }
}

export async function createReviewApi(params: {
  emailId: string
  result: ReviewResult
  comments: string
  modifications?: string
  riskLevelAfter: RiskLevel
}): Promise<ReviewRecord> {
  if (params.result === 'approved' || params.result === 'modified') {
    await approveReviewApi(params.emailId, params.modifications)
  } else {
    await rejectReviewApi(params.emailId, 'manual_reject', params.comments)
  }
  return Promise.resolve({
    id: `review_${Date.now()}`,
    emailId: params.emailId,
    emailSubject: '',
    reviewerId: '',
    reviewerName: '',
    result: params.result,
    comments: params.comments,
    modifications: params.modifications,
    riskLevelAfter: params.riskLevelAfter,
    createdAt: new Date().toISOString(),
  })
}

export async function batchReviewApi(params: {
  ids: string[]
  result: ReviewResult
  comments: string
  riskLevelAfter: RiskLevel
}): Promise<{ successCount: number }> {
  let successCount = 0
  for (const id of params.ids) {
    try {
      if (params.result === 'approved' || params.result === 'modified') {
        await approveReviewApi(id)
      } else {
        await rejectReviewApi(id, 'batch_reject', params.comments)
      }
      successCount++
    } catch {
      // ignore individual errors
    }
  }
  return Promise.resolve({ successCount })
}
