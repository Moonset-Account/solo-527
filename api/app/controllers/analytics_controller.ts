import { HttpContext } from '@adonisjs/core/http'
import AnalyticsService from '#services/analytics_service'

export default class AnalyticsController {
  public async consultantCommissions({ request, response }: HttpContext) {
    const consultantId = request.param('consultantId')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')

    const result = await AnalyticsService.getConsultantCommissions(
      consultantId,
      startDate,
      endDate
    )
    return response.ok(result)
  }

  public async servicePriceAnalysis({ response }: HttpContext) {
    const result = await AnalyticsService.getServicePriceAnalysis()
    return response.ok(result)
  }

  public async consumptionRanking({ request, response }: HttpContext) {
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')
    const limit = request.input('limit', 20)

    const result = await AnalyticsService.getConsumptionRanking(startDate, endDate, limit)
    return response.ok(result)
  }

  public async anomalyTracing({ params, request, response }: HttpContext) {
    const productId = params.productId
    const days = request.input('days', 30)

    const result = await AnalyticsService.getAnomalyTracing(productId, days)
    return response.ok(result)
  }

  public async visitRate({ request, response }: HttpContext) {
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')

    const result = await AnalyticsService.getVisitRate(startDate, endDate)
    return response.ok(result)
  }
}
