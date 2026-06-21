import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import CostRecord from '#models/cost_record'
import EmailDraft from '#models/email_draft'
import ReviewRecord from '#models/review_record'
import User from '#models/user'
import RejectReason from '#models/reject_reason'
import SpeechTemplateVersion from '#models/speech_template_version'
import PromptVersion from '#models/prompt_version'
import {
  getDateRange,
  getPreviousDateRange,
  generateDatesArray,
  round,
  calculatePercentage,
  calculateMoM,
} from '../utils/helpers.js'

export type CostDimension = 'date' | 'user' | 'reviewer' | 'reason'

interface DateRange {
  startDate?: string
  endDate?: string
}

interface SummaryResult {
  totalCalls: number
  prevTotalCalls: number
  totalCallsMoM: number
  hitRate: number
  prevHitRate: number
  hitRateMoM: number
  avgCost: number
  prevAvgCost: number
  avgCostMoM: number
  rejectRate: number
  prevRejectRate: number
  rejectRateMoM: number
  totalCost: number
  prevTotalCost: number
  totalCostMoM: number
}

interface CostBreakdownItem {
  key: string
  label: string
  totalCost: number
  totalTokens: number
  callCount: number
  avgCost: number
}

interface HitRateTrendItem {
  date: string
  total: number
  approved: number
  hitRate: number
}

interface RejectReasonItem {
  code: string
  name: string
  category: string
  count: number
  percentage: number
}

interface VersionEffectItem {
  versionId: number
  version: string
  templateId: number | null
  promptId: number | null
  type: 'template' | 'prompt'
  total: number
  approved: number
  hitRate: number
  totalCost: number
  avgCost: number
}

export default class CostAnalyticsService {
  private static instance: CostAnalyticsService

  static getInstance(): CostAnalyticsService {
    if (!CostAnalyticsService.instance) {
      CostAnalyticsService.instance = new CostAnalyticsService()
    }
    return CostAnalyticsService.instance
  }

  private parseDateRange(params: DateRange): { start: DateTime; end: DateTime } {
    if (params.startDate && params.endDate) {
      return {
        start: DateTime.fromFormat(params.startDate, 'yyyy-MM-dd').startOf('day'),
        end: DateTime.fromFormat(params.endDate, 'yyyy-MM-dd').endOf('day'),
      }
    }
    return getDateRange(30)
  }

  async getSummary(params: DateRange = {}): Promise<SummaryResult> {
    const { start, end } = this.parseDateRange(params)
    const { start: prevStart, end: prevEnd } = getPreviousDateRange(
      Math.floor(end.diff(start, 'days').days) + 1 || 30,
    )

    const [currentStats, prevStats] = await Promise.all([
      this.calculatePeriodStats(start, end),
      this.calculatePeriodStats(prevStart, prevEnd),
    ])

    return {
      totalCalls: currentStats.total,
      prevTotalCalls: prevStats.total,
      totalCallsMoM: calculateMoM(currentStats.total, prevStats.total),
      hitRate: currentStats.hitRate,
      prevHitRate: prevStats.hitRate,
      hitRateMoM: calculateMoM(currentStats.hitRate, prevStats.hitRate),
      avgCost: currentStats.avgCost,
      prevAvgCost: prevStats.avgCost,
      avgCostMoM: calculateMoM(currentStats.avgCost, prevStats.avgCost),
      rejectRate: currentStats.rejectRate,
      prevRejectRate: prevStats.rejectRate,
      rejectRateMoM: calculateMoM(currentStats.rejectRate, prevStats.rejectRate),
      totalCost: currentStats.totalCost,
      prevTotalCost: prevStats.totalCost,
      totalCostMoM: calculateMoM(currentStats.totalCost, prevStats.totalCost),
    }
  }

  private async calculatePeriodStats(start: DateTime, end: DateTime) {
    const drafts = await EmailDraft.query()
      .where('createdAt', '>=', start.toISO())
      .where('createdAt', '<=', end.toISO())
      .whereNull('deletedAt')
      .select('status', 'generationCost')
      .exec()

    const costs = await CostRecord.query()
      .where('createdAt', '>=', start.toISO())
      .where('createdAt', '<=', end.toISO())
      .select('costUsd', 'costType')
      .exec()

    const total = drafts.length
    const approved = drafts.filter((d) => d.status === 'approved').length
    const reviewing = drafts.filter((d) => d.status === 'reviewing').length
    const rejected = drafts.filter((d) => d.status === 'rejected').length
    const reviewed = approved + rejected

    const hitRate = reviewed > 0 ? calculatePercentage(approved, reviewed) : 0
    const rejectRate = reviewed > 0 ? calculatePercentage(rejected, reviewed) : 0

    const totalCost = costs.reduce((sum, c) => sum + (c.costUsd || 0), 0)
    const generationCostSum = drafts.reduce((sum, d) => sum + (d.generationCost || 0), 0)
    const avgCost = total > 0 ? round(generationCostSum / total, 6) : 0

    return {
      total,
      approved,
      reviewing,
      rejected,
      reviewed,
      hitRate,
      rejectRate,
      totalCost: round(totalCost, 6),
      avgCost,
    }
  }

  async getCostBreakdown(dimension: CostDimension, params: DateRange = {}): Promise<CostBreakdownItem[]> {
    const { start, end } = this.parseDateRange(params)

    switch (dimension) {
      case 'date':
        return this.breakdownByDate(start, end)
      case 'user':
        return this.breakdownByUser(start, end)
      case 'reviewer':
        return this.breakdownByReviewer(start, end)
      case 'reason':
        return this.breakdownByReason(start, end)
      default:
        return []
    }
  }

  private async breakdownByDate(start: DateTime, end: DateTime): Promise<CostBreakdownItem[]> {
    const dates = generateDatesArray(start, end)

    const costResults = await CostRecord.query()
      .where('createdAt', '>=', start.toISO())
      .where('createdAt', '<=', end.toISO())
      .select(db.raw('DATE(created_at) as date_key'))
      .select(db.raw('SUM(cost_usd) as total_cost'))
      .select(db.raw('SUM(total_tokens) as total_tokens'))
      .select(db.raw('COUNT(*) as call_count'))
      .groupByRaw('DATE(created_at)')
      .exec()

    const costMap: Record<string, { total_cost: number; total_tokens: number; call_count: number }> = {}
    costResults.forEach((r: any) => {
      costMap[r.$extras.date_key] = {
        total_cost: Number(r.$extras.total_cost || 0),
        total_tokens: Number(r.$extras.total_tokens || 0),
        call_count: Number(r.$extras.call_count || 0),
      }
    })

    return dates.map((date) => {
      const data = costMap[date] || { total_cost: 0, total_tokens: 0, call_count: 0 }
      return {
        key: date,
        label: date,
        totalCost: round(data.total_cost, 6),
        totalTokens: data.total_tokens,
        callCount: data.call_count,
        avgCost: data.call_count > 0 ? round(data.total_cost / data.call_count, 6) : 0,
      }
    })
  }

  private async breakdownByUser(start: DateTime, end: DateTime): Promise<CostBreakdownItem[]> {
    const results = await CostRecord.query()
      .where('costRecords.createdAt', '>=', start.toISO())
      .where('costRecords.createdAt', '<=', end.toISO())
      .whereNotNull('costRecords.userId')
      .leftJoin('users', 'costRecords.userId', 'users.id')
      .select('costRecords.userId as user_id')
      .select(db.raw('COALESCE(users.full_name, users.username, ?) as user_name', ['Unknown']))
      .select(db.raw('SUM(costRecords.cost_usd) as total_cost'))
      .select(db.raw('SUM(costRecords.total_tokens) as total_tokens'))
      .select(db.raw('COUNT(*) as call_count'))
      .groupBy('costRecords.userId', 'users.fullName', 'users.username')
      .orderByRaw('SUM(costRecords.cost_usd) DESC')
      .limit(20)
      .exec()

    return results.map((r: any) => ({
      key: String(r.$extras.user_id),
      label: r.$extras.user_name,
      totalCost: round(Number(r.$extras.total_cost || 0), 6),
      totalTokens: Number(r.$extras.total_tokens || 0),
      callCount: Number(r.$extras.call_count || 0),
      avgCost:
        Number(r.$extras.call_count || 0) > 0
          ? round(Number(r.$extras.total_cost || 0) / Number(r.$extras.call_count || 0), 6)
          : 0,
    }))
  }

  private async breakdownByReviewer(start: DateTime, end: DateTime): Promise<CostBreakdownItem[]> {
    const reviewRecords = await ReviewRecord.query()
      .where('createdAt', '>=', start.toISO())
      .where('createdAt', '<=', end.toISO())
      .whereNotNull('reviewerId')
      .leftJoin('users', 'reviewRecords.reviewerId', 'users.id')
      .select('reviewRecords.reviewerId as reviewer_id')
      .select(db.raw('COALESCE(users.full_name, users.username, ?) as reviewer_name', ['Unknown']))
      .select(db.raw('COUNT(*) as review_count'))
      .groupBy('reviewRecords.reviewerId', 'users.fullName', 'users.username')
      .orderByRaw('COUNT(*) DESC')
      .limit(20)
      .exec()

    const emailDraftIds = await EmailDraft.query()
      .where('rejectedAt', '>=', start.toISO())
      .where('rejectedAt', '<=', end.toISO())
      .orWhere('approvedAt', '>=', start.toISO())
      .where('approvedAt', '<=', end.toISO())
      .select('id', 'generationCost', 'opsId')
      .exec()

    const reviewerCostMap: Record<number, { cost: number; count: number }> = {}

    emailDraftIds.forEach((draft) => {
      if (draft.opsId) {
        if (!reviewerCostMap[draft.opsId]) {
          reviewerCostMap[draft.opsId] = { cost: 0, count: 0 }
        }
        reviewerCostMap[draft.opsId].cost += draft.generationCost || 0
        reviewerCostMap[draft.opsId].count += 1
      }
    })

    return reviewRecords.map((r: any) => {
      const reviewerId = Number(r.$extras.reviewer_id)
      const costData = reviewerCostMap[reviewerId] || { cost: 0, count: 0 }
      const reviewCount = Number(r.$extras.review_count || 0)
      return {
        key: String(reviewerId),
        label: r.$extras.reviewer_name,
        totalCost: round(costData.cost, 6),
        totalTokens: 0,
        callCount: reviewCount,
        avgCost: costData.count > 0 ? round(costData.cost / costData.count, 6) : 0,
      }
    })
  }

  private async breakdownByReason(start: DateTime, end: DateTime): Promise<CostBreakdownItem[]> {
    const results = await EmailDraft.query()
      .where('status', 'rejected')
      .whereNotNull('rejectReasonId')
      .where('rejectedAt', '>=', start.toISO())
      .where('rejectedAt', '<=', end.toISO())
      .leftJoin('rejectReasons', 'emailDrafts.rejectReasonId', 'rejectReasons.id')
      .select('emailDrafts.rejectReasonId as reason_id')
      .select(db.raw('COALESCE(reject_reasons.name, reject_reasons.code, ?) as reason_name', ['Unknown']))
      .select(db.raw('SUM(email_drafts.generation_cost) as total_cost'))
      .select(db.raw('COUNT(*) as reject_count'))
      .groupBy('emailDrafts.rejectReasonId', 'rejectReasons.name', 'rejectReasons.code')
      .orderByRaw('COUNT(*) DESC')
      .exec()

    return results.map((r: any) => ({
      key: String(r.$extras.reason_id),
      label: r.$extras.reason_name,
      totalCost: round(Number(r.$extras.total_cost || 0), 6),
      totalTokens: 0,
      callCount: Number(r.$extras.reject_count || 0),
      avgCost:
        Number(r.$extras.reject_count || 0) > 0
          ? round(Number(r.$extras.total_cost || 0) / Number(r.$extras.reject_count || 0), 6)
          : 0,
    }))
  }

  async getHitRateTrend(days = 30): Promise<HitRateTrendItem[]> {
    const { start, end } = getDateRange(days)
    const dates = generateDatesArray(start, end)

    const results = await EmailDraft.query()
      .where('createdAt', '>=', start.toISO())
      .where('createdAt', '<=', end.toISO())
      .whereNull('deletedAt')
      .select(db.raw('DATE(created_at) as date_key'))
      .select(db.raw("COUNT(*) FILTER (WHERE 1=1) as total"))
      .select(db.raw("COUNT(*) FILTER (WHERE status = 'approved') as approved"))
      .groupByRaw('DATE(created_at)')
      .orderByRaw('DATE(created_at) ASC')
      .exec()

    const resultMap: Record<string, { total: number; approved: number }> = {}
    results.forEach((r: any) => {
      resultMap[r.$extras.date_key] = {
        total: Number(r.$extras.total || 0),
        approved: Number(r.$extras.approved || 0),
      }
    })

    return dates.map((date) => {
      const data = resultMap[date] || { total: 0, approved: 0 }
      return {
        date,
        total: data.total,
        approved: data.approved,
        hitRate: data.total > 0 ? calculatePercentage(data.approved, Math.max(data.total - 0, 1)) : 0,
      }
    })
  }

  async getRejectReasonDistribution(params: DateRange = {}): Promise<RejectReasonItem[]> {
    const { start, end } = this.parseDateRange(params)

    const reasons = await RejectReason.query().where('isActive', true).orderBy('sortOrder', 'asc').exec()

    const results = await EmailDraft.query()
      .where('status', 'rejected')
      .where('rejectedAt', '>=', start.toISO())
      .where('rejectedAt', '<=', end.toISO())
      .whereNotNull('rejectReasonId')
      .select('rejectReasonId')
      .select(db.raw('COUNT(*) as reject_count'))
      .groupBy('rejectReasonId')
      .exec()

    const countMap: Record<number, number> = {}
    results.forEach((r: any) => {
      countMap[r.rejectReasonId] = Number(r.$extras.reject_count || 0)
    })

    const total = Object.values(countMap).reduce((sum, v) => sum + v, 0)

    return reasons.map((reason) => {
      const count = countMap[reason.id] || 0
      return {
        code: reason.code,
        name: reason.name,
        category: reason.category,
        count,
        percentage: total > 0 ? calculatePercentage(count, total) : 0,
      }
    })
  }

  async getVersionEffectComparison(): Promise<VersionEffectItem[]> {
    const templateVersions = await SpeechTemplateVersion.query()
      .leftJoin('emailDrafts', 'speechTemplateVersions.id', 'emailDrafts.speechTemplateVersionId')
      .select('speechTemplateVersions.id as version_id')
      .select('speechTemplateVersions.version')
      .select('speechTemplateVersions.speechTemplateId as template_id')
      .select(db.raw("COUNT(email_drafts.id) as total"))
      .select(db.raw("COUNT(*) FILTER (WHERE email_drafts.status = 'approved') as approved"))
      .select(db.raw('COALESCE(SUM(email_drafts.generation_cost), 0) as total_cost'))
      .whereNotNull('emailDrafts.id')
      .groupBy('speechTemplateVersions.id', 'speechTemplateVersions.version', 'speechTemplateVersions.speechTemplateId')
      .orderByRaw('COUNT(email_drafts.id) DESC')
      .limit(10)
      .exec()

    const promptVersions = await PromptVersion.query()
      .leftJoin('emailDrafts', 'promptVersions.id', 'emailDrafts.promptVersionId')
      .select('promptVersions.id as version_id')
      .select('promptVersions.version')
      .select(db.raw('NULL as template_id'))
      .select('promptVersions.id as prompt_id')
      .select(db.raw("COUNT(email_drafts.id) as total"))
      .select(db.raw("COUNT(*) FILTER (WHERE email_drafts.status = 'approved') as approved"))
      .select(db.raw('COALESCE(SUM(email_drafts.generation_cost), 0) as total_cost'))
      .whereNotNull('emailDrafts.id')
      .groupBy('promptVersions.id', 'promptVersions.version')
      .orderByRaw('COUNT(email_drafts.id) DESC')
      .limit(10)
      .exec()

    const result: VersionEffectItem[] = []

    templateVersions.forEach((r: any) => {
      const total = Number(r.$extras.total || 0)
      const approved = Number(r.$extras.approved || 0)
      const totalCost = Number(r.$extras.total_cost || 0)
      result.push({
        versionId: Number(r.$extras.version_id),
        version: r.version,
        templateId: Number(r.$extras.template_id),
        promptId: null,
        type: 'template',
        total,
        approved,
        hitRate: total > 0 ? calculatePercentage(approved, total) : 0,
        totalCost: round(totalCost, 6),
        avgCost: total > 0 ? round(totalCost / total, 6) : 0,
      })
    })

    promptVersions.forEach((r: any) => {
      const total = Number(r.$extras.total || 0)
      const approved = Number(r.$extras.approved || 0)
      const totalCost = Number(r.$extras.total_cost || 0)
      result.push({
        versionId: Number(r.$extras.version_id),
        version: r.version,
        templateId: null,
        promptId: Number(r.$extras.prompt_id),
        type: 'prompt',
        total,
        approved,
        hitRate: total > 0 ? calculatePercentage(approved, total) : 0,
        totalCost: round(totalCost, 6),
        avgCost: total > 0 ? round(totalCost / total, 6) : 0,
      })
    })

    return result.sort((a, b) => b.total - a.total)
  }
}
