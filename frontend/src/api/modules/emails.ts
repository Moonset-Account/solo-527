import { get, post, put } from '../http'
import type { EmailDraft, PaginationParams, PaginationResponse, EmailStatus, ReviewResult } from '@/types'

type BackendEmailStatus = 'draft' | 'reviewing' | 'approved' | 'rejected' | 'sent' | 'archived'

export function mapStatusFromBackend(status: BackendEmailStatus | string): EmailStatus {
  switch (status) {
    case 'draft': return 'draft'
    case 'reviewing': return 'pending_review'
    case 'approved': return 'approved'
    case 'rejected': return 'rejected'
    case 'sent': return 'sent'
    case 'archived': return 'sent'
    default: return 'draft'
  }
}

export function mapStatusToBackend(status: EmailStatus): BackendEmailStatus {
  switch (status) {
    case 'draft': return 'draft'
    case 'ai_generated': return 'draft'
    case 'pending_review': return 'reviewing'
    case 'approved': return 'approved'
    case 'rejected': return 'rejected'
    case 'sent': return 'sent'
    default: return 'draft'
  }
}

export interface CitedSource {
  id: string
  knowledgeItemId: string
  title: string
  content: string
  relevanceScore: number
}

export function mapEmailFromBackend(data: any): EmailDraft & { citedSourceList?: CitedSource[]; generationCost?: number } {
  const customerBg: any = (() => {
    if (!data?.customerBackground) return {}
    if (typeof data.customerBackground === 'string') {
      try { return JSON.parse(data.customerBackground) } catch { return {} }
    }
    return data.customerBackground || {}
  })()

  const citedSources: CitedSource[] = Array.isArray(data?.citedSources)
    ? data.citedSources.map((s: any) => ({
        id: String(s.id ?? ''),
        knowledgeItemId: String(s.knowledgeItemId ?? s.knowledge_item_id ?? ''),
        title: s.title || s.sourceTitle || '',
        content: s.content || s.sourceContent || '',
        relevanceScore: Number(s.relevanceScore ?? s.relevance_score ?? 0),
      }))
    : []

  const knowledgeIds: string[] = citedSources.map(s => s.knowledgeItemId).filter(Boolean)
  const aiSuggestion = citedSources.length > 0 ? citedSources[0].title : undefined

  return {
    id: String(data.id ?? ''),
    subject: data.subject || '',
    recipient: data.recipientEmail || customerBg.companyName || data.recipient || '',
    recipientName: data.recipientName || customerBg.contactName || '',
    content: data.body || data.content || '',
    status: mapStatusFromBackend(data.status || 'draft'),
    priority: (data.priority as any) || 'normal',
    category: data.category || 'general',
    templateId: data.speechTemplateVersionId ? String(data.speechTemplateVersionId) : undefined,
    promptId: data.promptVersionId ? String(data.promptVersionId) : undefined,
    knowledgeIds,
    aiSuggestion,
    riskLevel: (data.riskLevel as any) || 'none',
    riskItems: [],
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
    reviewedAt: data.approvedAt || data.rejectedAt,
    sentAt: data.sentAt || data.sent_at,
    generatedBy: data.sales?.id ? String(data.sales.id) : (data.salesId ? String(data.salesId) : undefined),
    generatedByName: data.sales?.fullName || data.sales?.username,
    reviewedBy: data.ops?.id ? String(data.ops.id) : undefined,
    reviewedByName: data.ops?.fullName || data.ops?.username,
    citedSourceList: citedSources,
    generationCost: typeof data.generationCost === 'number' ? data.generationCost : 0,
  } as any
}

export async function generateEmailApi(params: {
  company: string
  industry?: string | null
  scale?: string | null
  painPoints?: string
  stage: number
  lastNote?: string
  templateId?: string | null
  temperature: number
}): Promise<EmailDraft & { citedSourceList?: CitedSource[] }> {
  const stageMap = ['initial', 'follow-up', 'negotiation', 'closing']
  const payload: any = {
    customerBackground: {
      companyName: params.company,
      industry: params.industry || '',
      companySize: params.scale || '',
      painPoints: params.painPoints || '',
      stage: stageMap[params.stage] ?? 'initial',
      lastFollowUp: params.lastNote || '',
    },
    temperature: params.temperature ?? 0.7,
  }
  if (params.templateId) payload.templateVersionId = Number(params.templateId)
  const data = await post<any>('/emails/generate', payload)
  return mapEmailFromBackend(data)
}

export async function getEmailListApi(params: PaginationParams & {
  status?: EmailStatus
  riskLevel?: string
  category?: string
}): Promise<PaginationResponse<EmailDraft>> {
  const q: any = {
    page: params.page,
    perPage: params.perPage,
  }
  if (params.status) q.status = mapStatusToBackend(params.status)
  if (params.keyword) q.keyword = params.keyword
  if (params.category) q.category = params.category
  const resp = await get<any>('/emails', q)
  const list: any[] = resp?.data || resp?.list || []
  const pagination = resp?.pagination || {}
  return {
    list: list.map(mapEmailFromBackend),
    total: pagination.total ?? list.length,
    page: pagination.page ?? params.page,
    pageSize: pagination.perPage ?? params.perPage,
  }
}

export async function getEmailDetailApi(id: string): Promise<EmailDraft & { citedSourceList?: CitedSource[] }> {
  const data = await get<any>(`/emails/${id}`)
  return mapEmailFromBackend(data)
}

export async function submitForReviewApi(id: string, note?: string): Promise<EmailDraft> {
  const payload: any = {}
  if (note) payload.note = note
  const data = await post<any>(`/emails/${id}/submit-review`, payload)
  return mapEmailFromBackend({ id: data?.id ?? id, status: data?.status || 'reviewing', submittedAt: data?.submittedAt })
}

export async function createEmailDraftApi(data: Partial<EmailDraft>): Promise<EmailDraft> {
  return {
    id: `email_${Date.now()}`,
    subject: data.subject || '未命名邮件',
    recipient: data.recipient || '',
    recipientName: data.recipientName || '',
    content: data.content || '',
    status: 'draft',
    priority: data.priority || 'normal',
    category: data.category || 'general',
    templateId: data.templateId,
    promptId: data.promptId,
    knowledgeIds: data.knowledgeIds,
    riskLevel: data.riskLevel || 'none',
    riskItems: data.riskItems || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  } as EmailDraft
}

export async function updateEmailApi(id: string, data: Partial<EmailDraft>): Promise<EmailDraft> {
  const payload: any = {}
  if (data.subject !== undefined) payload.subject = data.subject
  if (data.content !== undefined) payload.body = data.content
  if (data.recipient !== undefined) payload.recipientEmail = data.recipient
  if (data.recipientName !== undefined) payload.recipientName = data.recipientName
  const resp = await put<any>(`/emails/${id}`, payload)
  return mapEmailFromBackend(resp)
}

export async function reviewEmailApi(id: string, params: {
  result: ReviewResult
  comments: string
}): Promise<EmailDraft> {
  if (params.result === 'approved') return approveEmailFallback(id)
  return rejectEmailFallback(id, params.comments)
}

async function approveEmailFallback(id: string): Promise<EmailDraft> {
  try {
    const { approveReviewApi } = await import('./reviews')
    return approveReviewApi(id)
  } catch {
    return { id, subject: '', recipient: '', content: '', status: 'approved', priority: 'normal', category: 'general', riskLevel: 'none', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), reviewedAt: new Date().toISOString() } as EmailDraft
  }
}

async function rejectEmailFallback(id: string, comments: string): Promise<EmailDraft> {
  try {
    const { rejectReviewApi } = await import('./reviews')
    return rejectReviewApi(id, 'OTHER', comments)
  } catch {
    return { id, subject: '', recipient: '', content: '', status: 'rejected', priority: 'normal', category: 'general', riskLevel: 'none', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), reviewedAt: new Date().toISOString() } as EmailDraft
  }
}

export async function sendEmailApi(id: string): Promise<EmailDraft> {
  return {
    id,
    subject: '',
    recipient: '',
    content: '',
    status: 'sent',
    priority: 'normal',
    category: 'general',
    riskLevel: 'none',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
  } as EmailDraft
}

export async function deleteEmailApi(_id: string): Promise<void> {
  // no backend endpoint yet
}
