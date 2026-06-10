import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import RiskLog from 'App/Models/RiskLog'
import WorkOrder from 'App/Models/WorkOrder'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'
import Redis from '@ioc:Adonis/Addons/Redis'

export default class RisksController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const workOrderId = request.input('workOrderId', '')
    const riskLevel = request.input('riskLevel', '')
    const status = request.input('status', '')
    const riskType = request.input('riskType', '')
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')

    const query = RiskLog.query()
      .preload('workOrder')
      .preload('actor')
      .if(workOrderId, (q) => {
        q.where('work_order_id', workOrderId)
      })
      .if(riskLevel, (q) => {
        q.where('risk_level', riskLevel)
      })
      .if(status, (q) => {
        q.where('status', status)
      })
      .if(riskType, (q) => {
        q.where('risk_type', 'like', `%${riskType}%`)
      })
      .if(startDate, (q) => {
        q.where('created_at', '>=', startDate)
      })
      .if(endDate, (q) => {
        q.where('created_at', '<=', endDate)
      })
      .orderBy('created_at', 'desc')

    const risks = await query.paginate(page, perPage)

    return response.ok({
      data: risks.serialize(),
    })
  }

  public async show({ params, response }: HttpContextContract) {
    try {
      const risk = await RiskLog.findOrFail(params.id)
      await risk.load('workOrder')
      await risk.load('actor')

      return response.ok({
        data: risk.serialize(),
      })
    } catch (error) {
      return response.notFound({ message: '风险记录不存在' })
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const riskSchema = schema.create({
      workOrderId: schema.number([
        rules.exists({ table: 'work_orders', column: 'id' }),
      ]),
      riskLevel: schema.enum(['low', 'medium', 'high', 'critical'] as const),
      riskType: schema.string({}, [
        rules.maxLength(100),
      ]),
      description: schema.string.optional(),
    })

    const data = await request.validate({ schema: riskSchema })

    const risk = new RiskLog()
    risk.workOrderId = data.workOrderId
    risk.riskLevel = data.riskLevel
    risk.riskType = data.riskType
    risk.description = data.description || null
    risk.status = 'open'

    await risk.save()

    return response.created({
      message: '风险记录创建成功',
      data: risk.serialize(),
    })
  }

  public async handle({ params, auth, request, response }: HttpContextContract) {
    try {
      const risk = await RiskLog.findOrFail(params.id)

      const handleSchema = schema.create({
        actionTaken: schema.string(),
        status: schema.enum(['mitigated', 'resolved', 'closed'] as const),
      })

      const data = await request.validate({ schema: handleSchema })

      risk.actionTaken = data.actionTaken
      risk.status = data.status
      risk.actionBy = auth.user?.id || null
      risk.actionAt = DateTime.now()

      await risk.save()

      try {
        await Redis.del(`risk_stats:*`)
      } catch (e) {}

      return response.ok({
        message: '风险已处理',
        data: risk.serialize(),
      })
    } catch (error) {
      const err = error as any
      if (err.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: '风险记录不存在' })
      }
      throw error
    }
  }

  public async report({ request, response }: HttpContextContract) {
    const startDate = request.input('startDate', DateTime.now().minus({ months: 1 }).toISODate())
    const endDate = request.input('endDate', DateTime.now().toISODate())

    const cacheKey = `risk_stats:${startDate}_${endDate}`

    try {
      const cached = await Redis.get(cacheKey)
      if (cached) {
        return response.ok(JSON.parse(cached))
      }
    } catch (e) {}

    const totalRisks = await RiskLog.query()
      .whereBetween('created_at', [startDate, endDate])
      .count('* as total')
      .first()

    const byLevel = await RiskLog.query()
      .whereBetween('created_at', [startDate, endDate])
      .select('risk_level')
      .select(Database.raw('COUNT(*) as count'))
      .groupBy('risk_level')

    const byStatus = await RiskLog.query()
      .whereBetween('created_at', [startDate, endDate])
      .select('status')
      .select(Database.raw('COUNT(*) as count'))
      .groupBy('status')

    const byType = await RiskLog.query()
      .whereBetween('created_at', [startDate, endDate])
      .select('risk_type')
      .select(Database.raw('COUNT(*) as count'))
      .groupBy('risk_type')
      .orderBy('count', 'desc')
      .limit(10)

    const atRiskOrders = await WorkOrder.query()
      .where('status', '!=', 'completed')
      .where('status', '!=', 'cancelled')
      .whereHas('riskLogs', (q) => {
        q.whereIn('risk_level', ['high', 'critical'])
        q.whereIn('status', ['open', 'mitigated'])
      })
      .preload('riskLogs', (q) => {
        q.whereIn('risk_level', ['high', 'critical'])
        q.whereIn('status', ['open', 'mitigated'])
        q.orderBy('created_at', 'desc')
      })
      .orderBy('priority', 'desc')
      .limit(20)

    const delayedOrders = await WorkOrder.query()
      .where('delivery_date', '<', DateTime.now().toISODate())
      .whereNotIn('status', ['completed', 'cancelled'])
      .orderBy('delivery_date', 'asc')
      .limit(10)

    const report = {
      period: { startDate, endDate },
      totalRisks: parseInt(totalRisks?.$extras.total || '0'),
      byLevel: byLevel.map((r) => ({
        level: r.riskLevel,
        count: parseInt(r.$extras.count),
      })),
      byStatus: byStatus.map((r) => ({
        status: r.status,
        count: parseInt(r.$extras.count),
      })),
      byType: byType.map((r) => ({
        type: r.riskType,
        count: parseInt(r.$extras.count),
      })),
      atRiskOrders,
      delayedOrders,
    }

    try {
      await Redis.setex(cacheKey, 300, JSON.stringify(report))
    } catch (e) {}

    return response.ok({
      data: report,
    })
  }

  public async highRiskOrders({ response }: HttpContextContract) {
    const orders = await WorkOrder.query()
      .whereNotIn('status', ['completed', 'cancelled'])
      .where((q) => {
        q.where('delivery_date', '<=', DateTime.now().plus({ days: 3 }).toISODate())
        q.orWhereHas('riskLogs', (riskQ) => {
          riskQ.whereIn('risk_level', ['high', 'critical'])
          riskQ.whereIn('status', ['open', 'mitigated'])
        })
      })
      .preload('assignee')
      .preload('riskLogs', (q) => {
        q.whereIn('risk_level', ['high', 'critical'])
        q.whereIn('status', ['open', 'mitigated'])
      })
      .orderBy('priority', 'desc')
      .orderBy('delivery_date', 'asc')
      .limit(50)

    return response.ok({
      data: orders,
    })
  }
}
