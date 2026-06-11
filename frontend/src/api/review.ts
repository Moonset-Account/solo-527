import { get, post, put } from '@/utils/request'

export type FollowUpStatus = 'pending' | 'done'

export interface FollowUpRecord {
  followUpContent: string
  followUpBy: string
  followUpAt: string
}

export interface ReviewItem {
  _id: string
  orderId: string
  orderNo?: string
  userId: string
  userName?: string
  userPhone?: string
  workerId?: string
  workerName?: string
  community?: string
  serviceName?: string
  rating: number
  tags: string[]
  content: string
  reply: string
  followUpStatus: FollowUpStatus
  followUpContent: string
  followUpBy: string
  followUpAt?: string
  followUpRecords?: FollowUpRecord[]
  createdAt: string
}

export interface ReviewListResult {
  data: ReviewItem[]
  total: number
  page: number
  pageSize: number
}

export interface CreateReviewParams {
  orderId: string
  userId: string
  rating: number
  tags?: string[]
  content?: string
  reply?: string
  followUpStatus?: FollowUpStatus
  followUpContent?: string
  followUpBy?: string
  followUpAt?: string
}

export interface UpdateReviewParams {
  rating?: number
  tags?: string[]
  content?: string
  reply?: string
  followUpStatus?: FollowUpStatus
  followUpContent?: string
  followUpBy?: string
  followUpAt?: string
}

export interface QueryReviewParams {
  orderId?: string
  userId?: string
  rating?: number
  ratings?: number[]
  minRating?: number
  maxRating?: number
  followUpStatus?: FollowUpStatus | 'all'
  workerId?: string
  community?: string
  startTime?: string
  endTime?: string
  page?: number
  pageSize?: number
}

export interface FollowUpParams {
  followUpContent: string
  followUpBy: string
  followUpStatus?: FollowUpStatus
}

export interface ReplyReviewParams {
  reply: string
}

export interface BatchFollowUpParams {
  reviewIds: string[]
  followUpContent: string
  followUpBy: string
}

export interface BatchFollowUpResult {
  success: { id: string; message: string }[]
  failed: { id: string; message: string }[]
}

export interface ReviewStats {
  averageRating: number
  totalCount: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  pendingFollowUpCount: number
  doneFollowUpCount: number
  followUpRate: number
}

export function createReview(params: CreateReviewParams) {
  return post<ReviewItem>('/reviews', params)
}

export function getReviewList(params?: QueryReviewParams) {
  return get<ReviewListResult>('/reviews', params)
}

export function getReviewById(id: string) {
  return get<ReviewItem>(`/reviews/${id}`)
}

export function getReviewByOrderId(orderId: string) {
  return get<ReviewItem>(`/reviews/order/${orderId}`)
}

export function getReviewStats() {
  return get<ReviewStats>('/reviews/stats')
}

export function updateReview(id: string, params: UpdateReviewParams) {
  return put<ReviewItem>(`/reviews/${id}`, params)
}

export function followUpReview(id: string, params: FollowUpParams) {
  return post<ReviewItem>(`/reviews/${id}/follow-up`, params)
}

export function batchFollowUp(params: BatchFollowUpParams) {
  return post<BatchFollowUpResult>('/reviews/batch/follow-up', params)
}

export function markFollowUpDone(id: string, params?: { followUpBy?: string }) {
  return post<ReviewItem>(`/reviews/${id}/mark-done`, params)
}

export function replyReview(id: string, params: ReplyReviewParams) {
  return post<ReviewItem>(`/reviews/${id}/reply`, params)
}
