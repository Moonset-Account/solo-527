import { get, post, put, del } from '../http'
import type { EmailDraft, PaginationParams, PaginationResponse, EmailStatus, ReviewResult } from '@/types'
import { mockEmails, mockPaginatedResponse, mockResponse } from '@/mock/data'

export async function getEmailListApi(params: PaginationParams & {
  status?: EmailStatus
  riskLevel?: string
  category?: string
}): Promise<PaginationResponse<EmailDraft>> {
  let filtered = [...mockEmails]

  if (params.status) {
    filtered = filtered.filter(e => e.status === params.status)
  }
  if (params.riskLevel) {
    filtered = filtered.filter(e => e.riskLevel === params.riskLevel)
  }
  if (params.category) {
    filtered = filtered.filter(e => e.category === params.category)
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(
      e => e.subject.toLowerCase().includes(kw) ||
        e.recipient.toLowerCase().includes(kw) ||
        e.content.toLowerCase().includes(kw)
    )
  }

  return mockPaginatedResponse<EmailDraft>(filtered, params.page, params.pageSize, 300)
}

export async function getEmailDetailApi(id: string): Promise<EmailDraft> {
  const email = mockEmails.find(e => e.id === id)
  if (!email) {
    throw new Error('邮件不存在')
  }
  return mockResponse<EmailDraft>({ ...email }, 200)
}

export async function generateEmailApi(params: {
  recipient: string
  category: string
  templateId?: string
  promptId?: string
  brief: string
}): Promise<EmailDraft> {
  const newEmail: EmailDraft = {
    id: `email_${Date.now()}`,
    subject: `关于${params.brief.slice(0, 20)}的邮件`,
    recipient: params.recipient,
    recipientName: params.recipient.split('@')[0],
    content: `尊敬的客户：\n\n根据您的需求，${params.brief}。\n\n如有任何疑问，请随时与我们联系。\n\n此致\n敬礼`,
    status: 'ai_generated',
    priority: 'normal',
    category: params.category,
    templateId: params.templateId,
    promptId: params.promptId,
    riskLevel: 'low',
    aiSuggestion: 'AI 已生成邮件草稿，请检查内容是否合规后发送。',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  mockEmails.unshift(newEmail)
  return mockResponse<EmailDraft>(newEmail, 1500)
}

export async function createEmailDraftApi(data: Partial<EmailDraft>): Promise<EmailDraft> {
  const newEmail: EmailDraft = {
    id: `email_${Date.now()}`,
    subject: data.subject || '未命名邮件',
    recipient: data.recipient || '',
    content: data.content || '',
    status: 'draft',
    priority: data.priority || 'normal',
    category: data.category || 'general',
    riskLevel: 'none',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data
  } as EmailDraft

  mockEmails.unshift(newEmail)
  return mockResponse<EmailDraft>(newEmail, 300)
}

export async function updateEmailApi(id: string, data: Partial<EmailDraft>): Promise<EmailDraft> {
  const index = mockEmails.findIndex(e => e.id === id)
  if (index === -1) {
    throw new Error('邮件不存在')
  }

  mockEmails[index] = {
    ...mockEmails[index],
    ...data,
    updatedAt: new Date().toISOString()
  }

  return mockResponse<EmailDraft>(mockEmails[index], 300)
}

export async function submitForReviewApi(id: string): Promise<EmailDraft> {
  const index = mockEmails.findIndex(e => e.id === id)
  if (index === -1) {
    throw new Error('邮件不存在')
  }

  mockEmails[index].status = 'pending_review'
  mockEmails[index].updatedAt = new Date().toISOString()

  return mockResponse<EmailDraft>(mockEmails[index], 300)
}

export async function reviewEmailApi(id: string, params: {
  result: ReviewResult
  comments: string
}): Promise<EmailDraft> {
  const index = mockEmails.findIndex(e => e.id === id)
  if (index === -1) {
    throw new Error('邮件不存在')
  }

  if (params.result === 'approved') {
    mockEmails[index].status = 'approved'
  } else if (params.result === 'rejected') {
    mockEmails[index].status = 'rejected'
  }

  mockEmails[index].reviewedAt = new Date().toISOString()
  mockEmails[index].updatedAt = new Date().toISOString()

  return mockResponse<EmailDraft>(mockEmails[index], 400)
}

export async function sendEmailApi(id: string): Promise<EmailDraft> {
  const index = mockEmails.findIndex(e => e.id === id)
  if (index === -1) {
    throw new Error('邮件不存在')
  }

  mockEmails[index].status = 'sent'
  mockEmails[index].sentAt = new Date().toISOString()
  mockEmails[index].updatedAt = new Date().toISOString()

  return mockResponse<EmailDraft>(mockEmails[index], 500)
}

export async function deleteEmailApi(id: string): Promise<void> {
  const index = mockEmails.findIndex(e => e.id === id)
  if (index > -1) {
    mockEmails.splice(index, 1)
  }
  return mockResponse<void>(undefined, 200)
}
