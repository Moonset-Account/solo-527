import type { HttpContext } from '@adonisjs/core/http'
import CostAnalyticsService from '#services/cost_analytics_service'
import {
  analyticsSummarySchema,
  analyticsCostBreakdownSchema,
  analyticsHitRateSchema,
  analyticsRejectReasonsSchema,
} from '#validators/index'
import { successResponse } from '../utils/helpers.js'
import type { CostDimension } from '#services/cost_analytics_service'

export default class AnalyticsController {
  private analyticsService: CostAnalyticsService

  constructor() {
    this.analyticsService = CostAnalyticsService.getInstance()
  }

  async summary({ request, response }: HttpContext) {
    const payload = await request.validateUsing(analyticsSummarySchema)

    const data = await this.analyticsService.getSummary({
      startDate: payload.startDate,
      endDate: payload.endDate,
    })

    return response.json(
      successResponse(
        {
          totalCalls: {
            current: data.totalCalls,
            previous: data.prevTotalCalls,
            mom: data.totalCallsMoM,
            trend: data.totalCallsMoM >= 0 ? 'up' : 'down',
          },
          hitRate: {
            current: data.hitRate,
            previous: data.prevHitRate,
            mom: data.hitRateMoM,
            trend: data.hitRateMoM >= 0 ? 'up' : 'down',
            unit: '%',
          },
          avgCost: {
            current: data.avgCost,
            previous: data.prevAvgCost,
            mom: data.avgCostMoM,
            trend: data.avgCostMoM <= 0 ? 'up' : 'down',
            unit: 'USD',
          },
          rejectRate: {
            current: data.rejectRate,
            previous: data.prevRejectRate,
            mom: data.rejectRateMoM,
            trend: data.rejectRateMoM <= 0 ? 'up' : 'down',
            unit: '%',
          },
          totalCost: {
            current: data.totalCost,
            previous: data.prevTotalCost,
            mom: data.totalCostMoM,
            trend: data.totalCostMoM <= 0 ? 'up' : 'down',
            unit: 'USD',
          },
        },
        'ok',
      ),
    )
  }

  async costBreakdown({ request, response }: HttpContext) {
    const payload = await request.validateUsing(analyticsCostBreakdownSchema)

    const data = await this.analyticsService.getCostBreakdown(payload.dimension as CostDimension, {
      startDate: payload.startDate,
      endDate: payload.endDate,
    })

    const dimensionLabels: Record<CostDimension, string> = {
      date: '日期',
      user: '用户',
      reviewer: '审核人',
      reason: '驳回原因',
    }

    return response.json(
      successResponse(
        {
          dimension: payload.dimension,
          dimensionLabel: dimensionLabels[payload.dimension as CostDimension],
          items: data,
        },
        'ok',
      ),
    )
  }

  async hitRate({ request, response }: HttpContext) {
    const payload = await request.validateUsing(analyticsHitRateSchema)

    const data = await this.analyticsService.getHitRateTrend(payload.days || 30)

    const totalCalls = data.reduce((sum, d) => sum + d.total, 0)
    const totalApproved = data.reduce((sum, d) => sum + d.approved, 0)
    const overallHitRate = totalCalls > 0 ? Number(((totalApproved / totalCalls) * 100).toFixed(2)) : 0

    return response.json(
      successResponse(
        {
          days: payload.days || 30,
          overallHitRate,
          totalCalls,
          totalApproved,
          trend: data,
        },
        'ok',
      ),
    )
  }

  async rejectReasons({ request, response }: HttpContext) {
    const payload = await request.validateUsing(analyticsRejectReasonsSchema)

    const data = await this.analyticsService.getRejectReasonDistribution({
      startDate: payload.startDate,
      endDate: payload.endDate,
    })

    const totalCount = data.reduce((sum, item) => sum + item.count, 0)

    const categoryGroups = data.reduce((acc: Record<string, any[]>, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {})

    const categoryStats = Object.entries(categoryGroups).map(([category, items]) => ({
      category,
      categoryLabel: this.getCategoryLabel(category),
      count: (items as any[]).reduce((sum, item) => sum + item.count, 0),
      percentage:
        totalCount > 0
          ? Number(
              (
                ((items as any[]).reduce((sum, item) => sum + item.count, 0) / totalCount) *
                100
              ).toFixed(2),
            )
          : 0,
      items,
    }))

    return response.json(
      successResponse(
        {
          totalCount,
          items: data,
          categoryStats,
        },
        'ok',
      ),
    )
  }

  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      content: '内容问题',
      compliance: '合规问题',
      format: '格式问题',
      data: '数据问题',
      other: '其他问题',
    }
    return labels[category] || category
  }

  async versionEffect({ response }: HttpContext) {
    const data = await this.analyticsService.getVersionEffectComparison()

    const templateVersions = data
      .filter((item) => item.type === 'template')
      .map((item) => ({
        versionId: item.versionId,
        version: item.version,
        templateId: item.templateId,
        total: item.total,
        approved: item.approved,
        hitRate: item.hitRate,
        totalCost: item.totalCost,
        avgCost: item.avgCost,
      }))

    const promptVersions = data
      .filter((item) => item.type === 'prompt')
      .map((item) => ({
        versionId: item.versionId,
        version: item.version,
        promptId: item.promptId,
        total: item.total,
        approved: item.approved,
        hitRate: item.hitRate,
        totalCost: item.totalCost,
        avgCost: item.avgCost,
      }))

    return response.json(
      successResponse(
        {
          templateVersions,
          promptVersions,
          overall: {
            totalTemplates: templateVersions.length,
            totalPrompts: promptVersions.length,
            avgHitRate:
              data.length > 0
                ? Number(((data.reduce((s, i) => s + i.hitRate, 0) / data.length)).toFixed(2))
                : 0,
            avgCost:
              data.length > 0
                ? Number(((data.reduce((s, i) => s + i.avgCost, 0) / data.length)).toFixed(6))
                : 0,
          },
        },
        'ok',
      ),
    )
  }
}
