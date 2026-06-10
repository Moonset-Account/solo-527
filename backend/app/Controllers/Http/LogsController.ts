import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import OperationLog from 'App/Models/OperationLog'
import { DateTime } from 'luxon'

export default class LogsController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const module = request.input('module', '')
    const action = request.input('action', '')
    const userId = request.input('userId', '')
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')
    const isRiskRelated = request.input('isRiskRelated', '')

    const query = OperationLog.query()
      .preload('user')
      .if(module, (q) => {
        q.where('module', module)
      })
      .if(action, (q) => {
        q.where('action', action)
      })
      .if(userId, (q) => {
        q.where('user_id', userId)
      })
      .if(startDate, (q) => {
        q.where('created_at', '>=', startDate)
      })
      .if(endDate, (q) => {
        q.where('created_at', '<=', endDate)
      })
      .if(isRiskRelated !== '', (q) => {
        q.where('is_risk_related', isRiskRelated === 'true')
      })
      .orderBy('created_at', 'desc')

    const logs = await query.paginate(page, perPage)

    return response.ok({
      data: logs.serialize(),
    })
  }

  public async show({ params, response }: HttpContextContract) {
    try {
      const log = await OperationLog.findOrFail(params.id)
      await log.load('user')

      return response.ok({
        data: log.serialize(),
      })
    } catch (error) {
      return response.notFound({ message: '日志不存在' })
    }
  }

  public async riskLogs({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')

    const query = OperationLog.query()
      .where('is_risk_related', true)
      .preload('user')
      .if(startDate, (q) => {
        q.where('created_at', '>=', startDate)
      })
      .if(endDate, (q) => {
        q.where('created_at', '<=', endDate)
      })
      .orderBy('created_at', 'desc')

    const logs = await query.paginate(page, perPage)

    return response.ok({
      data: logs.serialize(),
    })
  }
}
