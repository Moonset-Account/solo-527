import { get, post, put } from '../http'
import type { ReviewRecord, PaginationParams, PaginationResponse, ReviewResult, RiskLevel } from '@/types'
import { mockReviews, mockPaginatedResponse, mockResponse, mockEmails } from '@/mock/data'

export async function getReviewListApi(params: PaginationParams & {
  result?: ReviewResult
  riskLevel?: RiskLevel
}): Promise<PaginationResponse<ReviewRecord>> {
  let filtered = [...mockReviews]

  if (params.result) {
    filtered = filtered.filter(r => r.result === params.result)
  }
  if (params.riskLevel) {
    filtered = filtered.filter(r => r.riskLevelAfter === params.riskLevel)
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(
      r => r.emailSubject.toLowerCase().includes(kw) ||
        r.comments.toLowerCase().includes(kw) ||
        r.reviewerName.toLowerCase().includes(kw)
    )
  }

  return mockPaginatedResponse<ReviewRecord>(filtered, params.page, params.pageSize, 300)
}

export async function getReviewDetailApi(id: string): Promise<ReviewRecord> {
  const item = mockReviews.find(r => r.id === id)
  if (!item) {
    throw new Error('复核记录不存在')
  }
  return mockResponse<ReviewRecord>({ ...item }, 200)
}

export async function getPendingReviewCountApi(): Promise<{ count: number }> {
  const count = mockEmails.filter(e => e.status === 'pending_review').length
  return mockResponse({ count }, 200)
}

export async function createReviewApi(params: {
  emailId: string
  result: ReviewResult
  comments: string
  modifications?: string
  riskLevelAfter: RiskLevel
}): Promise<ReviewRecord> {
  const email = mockEmails.find(e => e.id === params.emailId)
  const newReview: ReviewRecord = {
    id: `review_${Date.now()}`,
    emailId: params.emailId,
    emailSubject: email?.subject || '未知邮件',
    reviewerId: 'admin',
    reviewerName: '系统管理员',
    result: params.result,
    comments: params.comments,
    modifications: params.modifications,
    riskLevelAfter: params.riskLevelAfter,
    createdAt: new Date().toISOString()
  }

  mockReviews.unshift(newReview)

  const emailIndex = mockEmails.findIndex(e => e.id === params.emailId)
  if (emailIndex > -1) {
    mockEmails[emailIndex].status = params.result === 'approved' ? 'approved' : 'rejected'
    mockEmails[emailIndex].reviewedAt = new Date().toISOString()
  }

  return mockResponse<ReviewRecord>(newReview, 500)
}

export async function batchReviewApi(params: {
  ids: string[]
  result: ReviewResult
  comments: string
  riskLevelAfter: RiskLevel
}): Promise<{ successCount: number }> {
  let successCount = 0

  params.ids.forEach(id => {
    const email = mockEmails.find(e => e.id === id)
    if (email) {
      const newReview: ReviewRecord = {
        id: `review_${Date.now()}_${id}`,
        emailId: id,
        emailSubject: email.subject,
        reviewerId: 'admin',
        reviewerName: '系统管理员',
        result: params.result,
        comments: params.comments,
        riskLevelAfter: params.riskLevelAfter,
        createdAt: new Date().toISOString()
      }
      mockReviews.unshift(newReview)

      const emailIndex = mockEmails.findIndex(e => e.id === id)
      if (emailIndex > -1) {
        mockEmails[emailIndex].status = params.result === 'approved' ? 'approved' : 'rejected'
        mockEmails[emailIndex].reviewedAt = new Date().toISOString()
      }
      successCount++
    }
  })

  return mockResponse({ successCount }, 600)
}
