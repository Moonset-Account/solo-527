import type { HttpContext } from '@adonisjs/core/http'
import EmailGenerationService from '#services/email_generation_service'
import { generateEmailSchema, emailListSchema, submitReviewSchema } from '#validators/index'
import { successResponse } from '../utils/helpers.js'

export default class EmailsController {
  private emailService: EmailGenerationService

  constructor() {
    this.emailService = EmailGenerationService.getInstance()
  }

  async generate({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(generateEmailSchema)
    const userId = auth.user!.id

    const result = await this.emailService.generate({
      customerBackground: payload.customerBackground,
      templateId: payload.templateId,
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
      userId,
    })

    return response.json(
      successResponse(
        {
          id: result.draft.id,
          subject: result.draft.subject,
          body: result.draft.body,
          recipientEmail: result.draft.recipientEmail,
          recipientName: result.draft.recipientName,
          customerBackground: result.draft.customerBackground,
          status: result.draft.status,
          riskLevel: result.draft.riskLevel,
          generationCost: result.draft.generationCost,
          citedSources: result.citedSources.map((cs) => ({
            id: cs.id,
            knowledgeItemId: cs.knowledgeItemId,
            title: cs.sourceTitle,
            content: cs.sourceContent,
            relevanceScore: cs.relevanceScore,
          })),
          cost: {
            id: result.cost.id,
            costType: result.cost.costType,
            promptTokens: result.cost.promptTokens,
            completionTokens: result.cost.completionTokens,
            totalTokens: result.cost.totalTokens,
            costUsd: result.cost.costUsd,
            modelName: result.cost.modelName,
          },
          createdAt: result.draft.createdAt,
        },
        '邮件生成成功',
      ),
    )
  }

  async index({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(emailListSchema)
    const userId = auth.user!.id
    const userRole = auth.user!.role

    const result = await this.emailService.listDrafts(
      {
        page: payload.page,
        perPage: payload.perPage,
        status: payload.status,
        keyword: payload.keyword,
        startDate: payload.startDate,
        endDate: payload.endDate,
      },
      userId,
      userRole,
    )

    const data = result.all().map((draft) => ({
      id: draft.id,
      subject: draft.subject,
      recipientEmail: draft.recipientEmail,
      recipientName: draft.recipientName,
      status: draft.status,
      riskLevel: draft.riskLevel,
      generationCost: draft.generationCost,
      reviewCount: draft.reviewCount,
      sales: draft.sales,
      rejectReason: draft.rejectReason,
      submittedAt: draft.submittedAt,
      approvedAt: draft.approvedAt,
      rejectedAt: draft.rejectedAt,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    }))

    return response.json(
      successResponse(data, 'ok', {
        total: result.meta.total,
        page: result.meta.currentPage,
        perPage: result.meta.perPage,
        lastPage: result.meta.lastPage,
        firstPage: result.meta.firstPage,
        hasPrev: result.meta.currentPage > 1,
        hasNext: result.meta.currentPage < result.meta.lastPage,
      }),
    )
  }

  async show({ params, auth, response }: HttpContext) {
    const id = Number(params.id)
    const userId = auth.user!.id
    const userRole = auth.user!.role

    const draft = await this.emailService.getDraftWithDetails(id, userId, userRole)

    return response.json(
      successResponse({
        id: draft.id,
        subject: draft.subject,
        body: draft.body,
        recipientEmail: draft.recipientEmail,
        recipientName: draft.recipientName,
        customerBackground: draft.customerBackground,
        citedSources: draft.citedSources,
        status: draft.status,
        riskLevel: draft.riskLevel,
        riskNotes: draft.riskNotes,
        generationCost: draft.generationCost,
        reviewCount: draft.reviewCount,
        rejectReason: draft.rejectReason,
        rejectDetail: draft.rejectDetail,
        sales: draft.sales,
        ops: draft.ops,
        speechTemplateVersion: draft.speechTemplateVersion,
        promptVersion: draft.promptVersion,
        citedSourceRelations: draft.citedSourceRelations.map((cs) => ({
          id: cs.id,
          knowledgeItemId: cs.knowledgeItemId,
          title: cs.sourceTitle,
          content: cs.sourceContent,
          relevanceScore: cs.relevanceScore,
        })),
        reviewRecords: draft.reviewRecords.map((rr) => ({
          id: rr.id,
          action: rr.action,
          comments: rr.comments,
          rejectReason: rr.rejectReason,
          reviewer: rr.reviewer,
          createdAt: rr.createdAt,
        })),
        submittedAt: draft.submittedAt,
        approvedAt: draft.approvedAt,
        rejectedAt: draft.rejectedAt,
        sentAt: draft.sentAt,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      }),
    )
  }

  async submitReview({ params, request, auth, response }: HttpContext) {
    const id = Number(params.id)
    const payload = await request.validateUsing(submitReviewSchema)
    const userId = auth.user!.id

    const draft = await this.emailService.submitReview(id, userId, payload.note)

    return response.json(
      successResponse(
        {
          id: draft.id,
          status: draft.status,
          submittedAt: draft.submittedAt,
        },
        '已提交复核',
      ),
    )
  }
}
