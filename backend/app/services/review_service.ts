import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import EmailDraft from '#models/email_draft'
import ReviewRecord from '#models/review_record'
import RiskSample from '#models/risk_sample'
import RejectReason from '#models/reject_reason'
import CostRecord from '#models/cost_record'
import { paginate, buildPaginationMeta, generateRandomTokens, calculateCost, usdToCents, round } from '../utils/helpers.js'
import { BusinessException } from '#exceptions/handler'

interface ReviewIndexParams {
  page?: number
  perPage?: number
  status?: 'reviewing' | 'approved' | 'rejected'
  salesId?: number
  startDate?: string
  endDate?: string
}

interface ReviewResult {
  draft: EmailDraft
  reviewRecord: ReviewRecord
}

export default class ReviewService {
  private static instance: ReviewService

  static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService()
    }
    return ReviewService.instance
  }

  async index(params: ReviewIndexParams) {
    const { page, perPage, limit, offset } = paginate(params.page, params.perPage)

    const query = EmailDraft.query()
      .whereNull('deletedAt')
      .preload('sales', (q) => q.select('id', 'username', 'fullName'))
      .preload('ops', (q) => q.select('id', 'username', 'fullName'))
      .preload('rejectReason')
      .orderBy('createdAt', 'desc')

    if (params.status) {
      query.where('status', params.status)
    } else {
      query.whereIn('status', ['reviewing', 'approved', 'rejected'])
    }

    if (params.salesId) {
      query.where('salesId', params.salesId)
    }

    if (params.startDate) {
      query.where('submittedAt', '>=', DateTime.fromFormat(params.startDate, 'yyyy-MM-dd').startOf('day').toISO())
    }
    if (params.endDate) {
      query.where('submittedAt', '<=', DateTime.fromFormat(params.endDate, 'yyyy-MM-dd').endOf('day').toISO())
    }

    const cloneQuery = query.clone()
    const total = await cloneQuery.count('* as total')
    const totalCount = Number(total[0].$extras.total || 0)

    const data = await query.limit(limit).offset(offset).exec()

    return {
      data,
      pagination: buildPaginationMeta(totalCount, page, perPage),
    }
  }

  async approve(emailId: number, reviewerId: number): Promise<ReviewResult> {
    const trx = await db.transaction()

    try {
      const draft = await EmailDraft.query({ client: trx }).where('id', emailId).first()

      if (!draft) {
        throw new BusinessException('邮件草稿不存在', 4004, 404)
      }

      if (draft.status !== 'reviewing') {
        throw new BusinessException('当前状态不允许批准，只有待审核状态可以批准', 4000)
      }

      draft.status = 'approved'
      draft.opsId = reviewerId
      draft.approvedAt = DateTime.now()
      draft.reviewCount = draft.reviewCount + 1
      await draft.save()

      const reviewRecord = await ReviewRecord.create(
        {
          emailDraftId: emailId,
          reviewerId,
          action: 'approved',
          comments: '审核通过',
          editsMade: {},
          rejectReasonId: null,
        },
        { client: trx },
      )

      await trx.commit()

      return {
        draft: draft.refresh(),
        reviewRecord,
      }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async reject(
    emailId: number,
    reviewerId: number,
    reasonCode: string,
    note: string,
  ): Promise<{
    draft: EmailDraft
    reviewRecord: ReviewRecord
    riskSample: RiskSample | null
    costRecord: CostRecord | null
  }> {
    const trx = await db.transaction()

    try {
      const draft = await EmailDraft.query({ client: trx }).where('id', emailId).first()

      if (!draft) {
        throw new BusinessException('邮件草稿不存在', 4004, 404)
      }

      if (draft.status !== 'reviewing') {
        throw new BusinessException('当前状态不允许驳回，只有待审核状态可以驳回', 4000)
      }

      const rejectReason = await RejectReason.query({ client: trx }).where('code', reasonCode).first()

      if (!rejectReason) {
        throw new BusinessException('驳回原因不存在', 4000)
      }

      draft.status = 'rejected'
      draft.opsId = reviewerId
      draft.rejectedAt = DateTime.now()
      draft.rejectReasonId = rejectReason.id
      draft.rejectDetail = note
      draft.reviewCount = draft.reviewCount + 1
      await draft.save()

      const reviewRecord = await ReviewRecord.create(
        {
          emailDraftId: emailId,
          reviewerId,
          action: 'rejected',
          comments: note,
          editsMade: {},
          rejectReasonId: rejectReason.id,
        },
        { client: trx },
      )

      let riskSample: RiskSample | null = null
      const riskLevel = this.determineRiskLevel(rejectReason.category, note)

      try {
        riskSample = await RiskSample.create(
          {
            title: `驳回样本-${draft.subject.substring(0, 50)}`,
            content: `邮件主题: ${draft.subject}\n\n邮件内容:\n${draft.body.substring(0, 2000)}`,
            riskLevel,
            category: rejectReason.category,
            riskDescription: `驳回原因: ${rejectReason.name}\n驳回备注: ${note}`,
            correctHandling: this.generateCorrectHandling(rejectReason.category),
            tags: ['驳回样本', rejectReason.name, reasonCode],
            isActive: true,
            createdBy: reviewerId,
            updatedBy: reviewerId,
          },
          { client: trx },
        )
      } catch (err) {
        // ignore risk sample creation failure
      }

      let costRecord: CostRecord | null = null
      try {
        const { promptTokens, completionTokens, totalTokens } = generateRandomTokens(100, 500, 50, 200)
        const costUsd = round(calculateCost(promptTokens, completionTokens, 'review-process'), 6)
        const costCents = usdToCents(costUsd)

        costRecord = await CostRecord.create(
          {
            userId: reviewerId,
            emailDraftId: emailId,
            costType: 'review',
            promptTokens,
            completionTokens,
            totalTokens,
            costUsd,
            costCents,
            modelName: 'review-process',
            metadata: {
              action: 'reject',
              reasonCode,
              reasonName: rejectReason.name,
              category: rejectReason.category,
            },
          },
          { client: trx },
        )
      } catch (err) {
        // ignore cost record creation failure
      }

      await trx.commit()

      return {
        draft: draft.refresh(),
        reviewRecord,
        riskSample,
        costRecord,
      }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  private determineRiskLevel(
    category: 'content' | 'compliance' | 'format' | 'data' | 'other',
    note: string,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (category === 'compliance') return 'critical'
    if (category === 'content') return 'high'
    if (category === 'data') return 'high'

    const lowerNote = note.toLowerCase()
    if (lowerNote.includes('严重') || lowerNote.includes('违法') || lowerNote.includes('违规')) {
      return 'high'
    }
    if (category === 'format') return 'low'
    return 'medium'
  }

  private generateCorrectHandling(category: string): string {
    const handlingMap: Record<string, string> = {
      content: '建议重新撰写邮件内容，确保信息准确、逻辑清晰，避免夸大宣传或不实承诺。参考知识库中的标准话术模板进行修改。',
      compliance: '请仔细核查合规问题，确保所有表述符合公司合规要求及相关法律法规。必要时请法务部门协助审核。',
      format: '请按照邮件模板规范调整格式：包括正确的称呼、清晰的段落结构、专业的结尾签名等。',
      data: '请核实所有引用的数据、案例、价格等信息的准确性。必要时从知识库或官方渠道获取最新数据。',
      other: '请根据审核意见进行修改，修改后可再次提交审核。如有疑问，可与审核人员沟通确认。',
    }
    return handlingMap[category] || handlingMap['other']
  }

  async getStatsByReviewer(reviewerId: number, startDate?: DateTime, endDate?: DateTime) {
    const query = ReviewRecord.query().where('reviewerId', reviewerId)

    if (startDate) {
      query.where('createdAt', '>=', startDate.toISO())
    }
    if (endDate) {
      query.where('createdAt', '<=', endDate.toISO())
    }

    const records = await query.select('action').exec()

    const stats = {
      total: records.length,
      approved: records.filter((r) => r.action === 'approved').length,
      rejected: records.filter((r) => r.action === 'rejected').length,
      requestedChanges: records.filter((r) => r.action === 'requested_changes').length,
    }

    return stats
  }
}
