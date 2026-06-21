import { get, put } from '../http'
import type { EmailDraft, PaginationResponse, ReviewRecord, PaginationParams, ReviewResult, RiskLevel } from '@/types'

type BackendReviewStatus = 'reviewing' | 'approved' | 'rejected'
type EmailStatus = 'draft' | 'ai_generated' | 'pending_review' | 'approved' | 'sent' | 'rejected'

function mapStatusFromBackend(status: BackendReviewStatus | string): EmailStatus {
  switch (status) {
    case 'reviewing': return 'pending_review'
    case 'approved': return 'approved'
    case 'rejected': return 'rejected'
    default: return 'pending_review'
  }
}

function mapEmailFromBackend(data: any): EmailDraft {
  const sales = data?.sales || {}
  const ops = data?.ops || {}
  const rejectReason = data?.rejectReason || {}
  const customerBg: any = typeof data?.customerBackground === 'string'
    ? (() => { try { return JSON.parse(data.customerBackground) } catch { return {} } })()
    : (data?.customerBackground || {})

  return {
    id: String(data.id ?? ''),
    subject: data.subject || '',
    recipient: data.recipientEmail || customerBg.companyName || '',
    recipientName: data.recipientName || customerBg.contactName || '',
    content: data.body || data.content || '',
    status: mapStatusFromBackend(data.status || 'reviewing'),
    priority: (data.priority as any) || 'normal',
    category: data.category || 'general',
    riskLevel: (data.riskLevel as any) || 'none',
    riskItems: [],
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
    reviewedAt: data.approvedAt || data.rejectedAt,
    sentAt: data.sentAt || data.sent_at,
    generatedBy: sales?.id ? String(sales.id) : undefined,
    generatedByName: sales?.fullName || sales?.username,
    reviewedBy: ops?.id ? String(ops.id) : undefined,
    reviewedByName: ops?.fullName || ops?.username,
    rejectReasonCode: rejectReason?.code,
    rejectReasonName: rejectReason?.name,
    rejectDetail: data.rejectDetail,
    generationCost: data.generationCost ?? 0,
    reviewCount: data.reviewCount ?? 0,
  } as EmailDraft & any
}

export async function getPendingReviewListApi(params: {
  page: number
  perPage: number
  status?: BackendReviewStatus
}): Promise<PaginationResponse<EmailDraft>> {
  const q: any = { page: params.page, perPage: params.perPage }
  if (params.status) q.status = params.status
  const resp = await get<any>('/reviews', q)
  const list: any[] = resp?.data || resp?.list || []
  const pagination = resp?.pagination || {}
  return {
    list: list.map(mapEmailFromBackend),
    total: pagination.total ?? list.length,
    page: pagination.page ?? params.page,
    pageSize: pagination.perPage ?? params.perPage,
  }
}

export async function approveReviewApi(id: string, _afterContent?: string): Promise<EmailDraft> {
  const resp = await put<any>(`/reviews/${id}/approve`, {})
  const draft: any = resp?.draft || resp || {}
  return mapEmailFromBackend({
    id: draft.id ?? id,
    status: draft.status || 'approved',
    approvedAt: draft.approvedAt,
    reviewCount: draft.reviewCount,
    opsId: draft.opsId,
  })
}

export async function rejectReviewApi(id: string, reasonCode: string, note?: string): Promise<EmailDraft> {
  const resp = await put<any>(`/reviews/${id}/reject`, {
    reasonCode,
    note: note || '',
  })
  const draft: any = resp?.draft || resp || {}
  return mapEmailFromBackend({
    id: draft.id ?? id,
    status: draft.status || 'rejected',
    rejectedAt: draft.rejectedAt,
    rejectReasonId: draft.rejectReasonId,
    rejectDetail: draft.rejectDetail,
    reviewCount: draft.reviewCount,
    opsId: draft.opsId,
  })
}

export async function getReviewListApi(params: PaginationParams & {
  result?: ReviewResult
  riskLevel?: RiskLevel
}): Promise<PaginationResponse<ReviewRecord>> {
  const q: any = { page: params.page, perPage: params.perPage }
  if (params.keyword) q.keyword = params.keyword
  const resp = await get<any>('/reviews', q)
  const list: any[] = resp?.data || []
  return {
    list: list.map((d: any) => ({
      id: String(d.id ?? ''),
      emailId: String(d.emailDraftId ?? d.emailId ?? ''),
      emailSubject: d.subject || '',
      reviewerId: d.ops?.id ? String(d.ops.id) : '',
      reviewerName: d.ops?.fullName || d.ops?.username || '',
      result: (d.status === 'approved' ? 'approved' : d.status === 'rejected' ? 'rejected' : 'modified') as ReviewResult,
      comments: d.rejectDetail || '',
      riskLevelAfter: (d.riskLevel || 'none') as RiskLevel,
      createdAt: d.createdAt || d.approvedAt || d.rejectedAt || new Date().toISOString(),
    })),
    total: resp?.pagination?.total ?? list.length,
    page: params.page,
    pageSize: params.perPage,
  }
}

export async function getReviewDetailApi(id: string): Promise<ReviewRecord> {
  const resp = await get<any>(`/reviews/${id}`)
  return {
    id,
    emailId: '',
    emailSubject: '',
    reviewerId: '',
    reviewerName: '',
    result: 'approved',
    comments: '',
    riskLevelAfter: 'none',
    createdAt: new Date().toISOString(),
    ...resp,
  }
}

export async function getPendingReviewCountApi(): Promise<{ count: number }> {
  try {
    const resp = await get<any>('/reviews', { page: 1, perPage: 1, status: 'reviewing' })
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
    await rejectReviewApi(params.emailId, 'OTHER', params.comments)
  }
  return {
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
  }
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
        await rejectReviewApi(id, 'OTHER', params.comments)
      }
      successCount++
    } catch {
      // ignore
    }
  }
  return { successCount }
}
