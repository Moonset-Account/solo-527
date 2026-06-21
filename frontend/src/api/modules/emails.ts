import { get, post, put, del } from '../http'
import type { EmailDraft, PaginationParams, PaginationResponse, EmailStatus, ReviewResult } from '@/types'

type BackendEmailStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'used'

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

function mapStatusToBackend(status: EmailStatus): BackendEmailStatus {
  switch (status) {
    case 'draft': return 'draft'
    case 'ai_generated': return 'draft'
    case 'pending_review': return 'submitted'
    case 'approved': return 'approved'
    case 'rejected': return 'rejected'
    case 'sent': return 'used'
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

  const riskItems: any[] = []
  const riskLevel: any = 'none'

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
    riskLevel,
    riskItems,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
    reviewedAt: data.reviewed_at || data.reviewedAt,
    sentAt: data.sent_at || data.sentAt,
    generatedBy: data.created_by ? String(data.created_by) : undefined,
    reviewedBy: data.reviewed_by ? String(data.reviewed_by) : undefined,
    sentBy: data.sent_by ? String(data.sent_by) : undefined,
  } as EmailDraft
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
}): Promise<EmailDraft> {
  const stageMap = ['initial', 'follow-up', 'negotiation', 'closing']
  const payload = {
    customerBackground: {
      companyName: params.company,
      industry: params.industry || '',
      companySize: params.scale || '',
      painPoints: params.painPoints || '',
      stage: stageMap[params.stage] ?? 'initial',
      lastFollowUp: params.lastNote || '',
    },
    templateVersionId: params.templateId ? Number(params.templateId) : undefined,
    temperature: params.temperature,
  }
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
    perPage: params.pageSize,
  }
  if (params.status) {
    q.status = mapStatusToBackend(params.status)
  }
  if (params.category) {
    q.category = params.category
  }
  const resp = await get<any>('/emails', q)
  const list: any[] = resp?.data || resp?.list || []
  const pagination = resp?.pagination || {}
  return {
    list: list.map(mapEmailFromBackend),
    total: pagination.total ?? list.length,
    page: pagination.page ?? params.page,
    pageSize: pagination.perPage ?? params.pageSize,
  }
}

export async function getEmailDetailApi(id: string): Promise<EmailDraft> {
  const data = await get<any>(`/emails/${id}`)
  return mapEmailFromBackend(data)
}

export async function submitForReviewApi(id: string): Promise<EmailDraft> {
  const data = await post<any>(`/emails/${id}/submit-review`, {})
  return mapEmailFromBackend(data)
}

export async function createEmailDraftApi(data: Partial<EmailDraft>): Promise<EmailDraft> {
  return Promise.resolve({
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
  } as EmailDraft)
}

export async function updateEmailApi(id: string, data: Partial<EmailDraft>): Promise<EmailDraft> {
  return Promise.resolve({
    id,
    subject: data.subject || '',
    recipient: data.recipient || '',
    recipientName: data.recipientName,
    content: data.content || '',
    status: (data.status as EmailStatus) || 'draft',
    priority: (data.priority as any) || 'normal',
    category: data.category || 'general',
    templateId: data.templateId,
    promptId: data.promptId,
    knowledgeIds: data.knowledgeIds,
    riskLevel: (data.riskLevel as any) || 'none',
    riskItems: data.riskItems,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  } as EmailDraft)
}

export async function reviewEmailApi(id: string, params: {
  result: ReviewResult
  comments: string
}): Promise<EmailDraft> {
  return Promise.resolve({
    id,
    subject: '',
    recipient: '',
    content: '',
    status: params.result === 'approved' ? 'approved' : 'rejected',
    priority: 'normal',
    category: 'general',
    riskLevel: 'none',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
  } as EmailDraft)
}

export async function sendEmailApi(id: string): Promise<EmailDraft> {
  return Promise.resolve({
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
  } as EmailDraft)
}

export async function deleteEmailApi(id: string): Promise<void> {
  return Promise.resolve()
}
