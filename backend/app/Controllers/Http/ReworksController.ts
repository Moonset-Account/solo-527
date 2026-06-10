import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Rework from 'App/Models/Rework'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { DateTime } from 'luxon'

export default class ReworksController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const workOrderId = request.input('workOrderId', '')
    const reason = request.input('reason', '')
    const status = request.input('status', '')
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')

    const query = Rework.query()
      .preload('workOrder')
      .preload('handler')
      .if(workOrderId, (q) => {
        q.where('work_order_id', workOrderId)
      })
      .if(reason, (q) => {
        q.where('reason', reason)
      })
      .if(status, (q) => {
        q.where('status', status)
      })
      .if(startDate, (q) => {
        q.where('created_at', '>=', startDate)
      })
      .if(endDate, (q) => {
        q.where('created_at', '<=', endDate)
      })
      .orderBy('created_at', 'desc')

    const reworks = await query.paginate(page, perPage)

    return response.ok({
      data: reworks.serialize(),
    })
  }

  public async show({ params, response }: HttpContextContract) {
    try {
      const rework = await Rework.findOrFail(params.id)
      await rework.load('workOrder')
      await rework.load('handler')

      return response.ok({
        data: rework.serialize(),
      })
    } catch (error) {
      return response.notFound({ message: '返工记录不存在' })
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const reworkSchema = schema.create({
      workOrderId: schema.number([
        rules.exists({ table: 'work_orders', column: 'id' }),
      ]),
      scheduleId: schema.number.optional([
        rules.exists({ table: 'schedules', column: 'id' }),
      ]),
      quantity: schema.number([
        rules.unsigned(),
      ]),
      reason: schema.enum([
        'quality_issue', 'material_defect', 'process_error', 'design_change', 'customer_request', 'other'
      ] as const),
      description: schema.string.optional(),
      reworkProcess: schema.string.optional(),
      handledBy: schema.number.optional([
        rules.exists({ table: 'users', column: 'id' }),
      ]),
      status: schema.enum.optional(['pending', 'reworking', 'completed', 'scrapped'] as const),
    })

    const data = await request.validate({ schema: reworkSchema })

    const rework = new Rework()
    rework.workOrderId = data.workOrderId
    rework.scheduleId = data.scheduleId || null
    rework.quantity = data.quantity
    rework.reason = data.reason
    rework.description = data.description || null
    rework.reworkProcess = data.reworkProcess || null
    rework.handledBy = data.handledBy || auth.user?.id || null
    rework.status = data.status || 'pending'

    await rework.save()

    return response.created({
      message: '返工记录创建成功',
      data: rework.serialize(),
    })
  }

  public async update({ params, request, response }: HttpContextContract) {
    try {
      const rework = await Rework.findOrFail(params.id)

      const reworkSchema = schema.create({
        quantity: schema.number.optional([
          rules.unsigned(),
        ]),
        reason: schema.enum.optional([
        'quality_issue', 'material_defect', 'process_error', 'design_change', 'customer_request', 'other'
      ] as const),
      description: schema.string.optional(),
      reworkProcess: schema.string.optional(),
      handledBy: schema.number.optional([
        rules.exists({ table: 'users', column: 'id' }),
      ]),
      status: schema.enum.optional(['pending', 'reworking', 'completed', 'scrapped'] as const),
    })

    const data = await request.validate({ schema: reworkSchema })

    if (data.quantity !== undefined) rework.quantity = data.quantity
    if (data.reason) rework.reason = data.reason
      if (data.description !== undefined) rework.description = data.description
      if (data.reworkProcess !== undefined) rework.reworkProcess = data.reworkProcess
      if (data.handledBy !== undefined) rework.handledBy = data.handledBy
      if (data.status) rework.status = data.status

      await rework.save()

      return response.ok({
        message: '返工记录更新成功',
        data: rework.serialize(),
      })
    } catch (error) {
      const err = error as any
      if (err.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: '返工记录不存在' })
      }
      throw error
    }
  }

  public async destroy({ params, response }: HttpContextContract) {
    try {
      const rework = await Rework.findOrFail(params.id)
      await rework.delete()

      return response.ok({
        message: '返工记录删除成功',
      })
    } catch (error) {
      return response.notFound({ message: '返工记录不存在' })
    }
  }

  public async stats({ request, response }: HttpContextContract) {
    const startDate = request.input('startDate', DateTime.now().minus({ months: 1 }).toISODate())
    const endDate = request.input('endDate', DateTime.now().toISODate())

    const reworks = await Rework.query()
      .whereBetween('created_at', [startDate, endDate])
      .select('reason')
      .select('status')
      .select('quantity')

    const reasonStats: Record<string, number> = {}
    const statusStats: Record<string, number> = {}
    let totalQuantity = 0

    reworks.forEach((rework) => {
      reasonStats[rework.reason] = (reasonStats[rework.reason] || 0) + rework.quantity
      statusStats[rework.status] = (statusStats[rework.status] || 0) + 1
      totalQuantity += rework.quantity
    })

    return response.ok({
      totalRecords: reworks.length,
      totalQuantity,
      reasonStats,
      statusStats,
    })
  }
}
