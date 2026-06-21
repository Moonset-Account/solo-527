import type { HttpContext } from '@adonisjs/core/http'
import ReviewService from '#services/review_service'
import { reviewIndexSchema, reviewRejectSchema } from '#validators/index'
import { successResponse } from '../utils/helpers.js'

export default class ReviewsController {
  private reviewService: ReviewService

  constructor() {
    this.reviewService = ReviewService.getInstance()
  }

  async index({ request, response }: HttpContext) {
    const payload = await request.validateUsing(reviewIndexSchema)

    const result = await this.reviewService.index({
      page: payload.page,
      perPage: payload.perPage,
      status: payload.status,
      salesId: payload.salesId,
      startDate: payload.startDate,
      endDate: payload.endDate,
    })

    const data = result.data.map((draft) => ({
      id: draft.id,
      subject: draft.subject,
      status: draft.status,
      riskLevel: draft.riskLevel,
      generationCost: draft.generationCost,
      reviewCount: draft.reviewCount,
      sales: draft.sales
        ? {
            id: draft.sales.id,
            username: draft.sales.username,
            fullName: draft.sales.fullName,
          }
        : null,
      ops: draft.ops
        ? {
            id: draft.ops.id,
            username: draft.ops.username,
            fullName: draft.ops.fullName,
          }
        : null,
      rejectReason: draft.rejectReason
        ? {
            id: draft.rejectReason.id,
            code: draft.rejectReason.code,
            name: draft.rejectReason.name,
            category: draft.rejectReason.category,
          }
        : null,
      submittedAt: draft.submittedAt,
      approvedAt: draft.approvedAt,
      rejectedAt: draft.rejectedAt,
      createdAt: draft.createdAt,
    }))

    return response.json(successResponse(data, 'ok', result.pagination))
  }

  async approve({ params, auth, response }: HttpContext) {
    const id = Number(params.id)
    const reviewerId = auth.user!.id

    const result = await this.reviewService.approve(id, reviewerId)

    return response.json(
      successResponse(
        {
          draft: {
            id: result.draft.id,
            status: result.draft.status,
            approvedAt: result.draft.approvedAt,
            reviewCount: result.draft.reviewCount,
            opsId: result.draft.opsId,
          },
          reviewRecord: {
            id: result.reviewRecord.id,
            action: result.reviewRecord.action,
            comments: result.reviewRecord.comments,
            createdAt: result.reviewRecord.createdAt,
          },
        },
        '审核通过成功',
      ),
    )
  }

  async reject({ params, request, auth, response }: HttpContext) {
    const id = Number(params.id)
    const payload = await request.validateUsing(reviewRejectSchema)
    const reviewerId = auth.user!.id

    const result = await this.reviewService.reject(id, reviewerId, payload.reasonCode, payload.note)

    return response.json(
      successResponse(
        {
          draft: {
            id: result.draft.id,
            status: result.draft.status,
            rejectedAt: result.draft.rejectedAt,
            rejectReasonId: result.draft.rejectReasonId,
            rejectDetail: result.draft.rejectDetail,
            reviewCount: result.draft.reviewCount,
            opsId: result.draft.opsId,
          },
          reviewRecord: {
            id: result.reviewRecord.id,
            action: result.reviewRecord.action,
            comments: result.reviewRecord.comments,
            rejectReasonId: result.reviewRecord.rejectReasonId,
            createdAt: result.reviewRecord.createdAt,
          },
          riskSample: result.riskSample
            ? {
                id: result.riskSample.id,
                title: result.riskSample.title,
                riskLevel: result.riskSample.riskLevel,
                category: result.riskSample.category,
                riskDescription: result.riskSample.riskDescription,
                correctHandling: result.riskSample.correctHandling,
                tags: result.riskSample.tags,
              }
            : null,
          costRecord: result.costRecord
            ? {
                id: result.costRecord.id,
                costType: result.costRecord.costType,
                costUsd: result.costRecord.costUsd,
                totalTokens: result.costRecord.totalTokens,
              }
            : null,
        },
        '驳回成功',
      ),
    )
  }
}
