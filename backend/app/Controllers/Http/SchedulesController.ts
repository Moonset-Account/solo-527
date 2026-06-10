import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Schedule from 'App/Models/Schedule'
import WorkOrder from 'App/Models/WorkOrder'
import ScheduleValidator from 'App/Validators/Schedule/ScheduleValidator'
import RiskLog from 'App/Models/RiskLog'
import { DateTime } from 'luxon'
import Redis from '@ioc:Adonis/Addons/Redis'
import { schema } from '@ioc:Adonis/Core/Validator'

export default class SchedulesController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const workOrderId = request.input('workOrderId', '')
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')
    const workshop = request.input('workshop', '')

    const cacheKey = `schedules:${JSON.stringify({ page, perPage, workOrderId, startDate, endDate, workshop })}`
    
    try {
      const cached = await Redis.get(cacheKey)
      if (cached) {
        return response.ok(JSON.parse(cached))
      }
    } catch (e) {}

    const query = Schedule.query()
      .preload('workOrder')
      .preload('scheduler')
      .if(workOrderId, (q) => {
        q.where('work_order_id', workOrderId)
      })
      .if(startDate, (q) => {
        q.where('schedule_date', '>=', startDate)
      })
      .if(endDate, (q) => {
        q.where('schedule_date', '<=', endDate)
      })
      .if(workshop, (q) => {
        q.where('workshop', workshop)
      })
      .orderBy('schedule_date', 'asc')
      .orderBy('workshop', 'asc')

    const schedules = await query.paginate(page, perPage)
    const result = schedules.serialize()

    try {
      await Redis.setex(cacheKey, 300, JSON.stringify(result))
    } catch (e) {}

    return response.ok({
      data: result,
    })
  }

  public async show({ params, response }: HttpContextContract) {
    try {
      const schedule = await Schedule.findOrFail(params.id)
      await schedule.load('workOrder')
      await schedule.load('scheduler')

      return response.ok({
        data: schedule.serialize(),
      })
    } catch (error) {
      return response.notFound({ message: '排产计划不存在' })
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const data = await request.validate(ScheduleValidator)

    const schedule = new Schedule()
    schedule.workOrderId = data.workOrderId
    schedule.scheduleDate = data.scheduleDate
    schedule.workshop = data.workshop || null
    schedule.line = data.line || null
    schedule.plannedQuantity = data.plannedQuantity
    schedule.shift = data.shift || null
    schedule.notes = data.notes || null
    schedule.scheduledBy = auth.user?.id || null

    await schedule.save()

    const workOrder = await WorkOrder.find(data.workOrderId)
    if (workOrder && workOrder.status === 'pending') {
      workOrder.status = 'scheduled'
      await workOrder.save()
    }

    try {
      await Redis.del(`schedules:*`)
    } catch (e) {}

    return response.created({
      message: '排产计划创建成功',
      data: schedule.serialize(),
    })
  }

  public async update({ params, request, response }: HttpContextContract) {
    try {
      const schedule = await Schedule.findOrFail(params.id)
      const data = await request.validate(ScheduleValidator)

      schedule.workOrderId = data.workOrderId
      schedule.scheduleDate = data.scheduleDate
      schedule.workshop = data.workshop || null
      schedule.line = data.line || null
      schedule.plannedQuantity = data.plannedQuantity
      schedule.shift = data.shift || null
      schedule.notes = data.notes || null

      await schedule.save()

      try {
        await Redis.del(`schedules:*`)
      } catch (e) {}

      return response.ok({
        message: '排产计划更新成功',
        data: schedule.serialize(),
      })
    } catch (error) {
      const err = error as any
      if (err.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: '排产计划不存在' })
      }
      throw error
    }
  }

  public async destroy({ params, response }: HttpContextContract) {
    try {
      const schedule = await Schedule.findOrFail(params.id)
      await schedule.delete()

      try {
        await Redis.del(`schedules:*`)
      } catch (e) {}

      return response.ok({
        message: '排产计划删除成功',
      })
    } catch (error) {
      return response.notFound({ message: '排产计划不存在' })
    }
  }

  public async calendar({ request, response }: HttpContextContract) {
    const startDate = request.input('startDate', DateTime.now().startOf('month').toISODate())
    const endDate = request.input('endDate', DateTime.now().endOf('month').toISODate())
    const workshop = request.input('workshop', '')

    const schedules = await Schedule.query()
      .whereBetween('schedule_date', [startDate, endDate])
      .if(workshop, (q) => q.where('workshop', workshop))
      .preload('workOrder')
      .orderBy('schedule_date', 'asc')

    const calendarData: Record<string, any[]> = {}
    schedules.forEach((schedule) => {
      const dateStr = schedule.scheduleDate.toISODate()
      if (dateStr && !calendarData[dateStr]) {
        calendarData[dateStr] = []
      }
      if (dateStr) {
        calendarData[dateStr].push(schedule.serialize())
      }
    })

    return response.ok({
      data: calendarData,
      schedules,
    })
  }

  public async adjust({ params, request, response, auth }: HttpContextContract) {
    try {
      const schedule = await Schedule.findOrFail(params.id)
      const oldDate = schedule.scheduleDate?.toISODate()
      const oldQty = schedule.plannedQuantity

      const adjustSchema = schema.create({
        scheduleDate: schema.date.optional(),
        plannedQuantity: schema.number.optional(),
        workshop: schema.string.optional(),
        reason: schema.string.optional(),
      })

      const data = await request.validate({ schema: adjustSchema })

      if (data.scheduleDate) {
        schedule.scheduleDate = data.scheduleDate
      }
      if (data.plannedQuantity !== undefined) {
        schedule.plannedQuantity = data.plannedQuantity
      }
      if (data.workshop !== undefined) {
        schedule.workshop = data.workshop
      }

      await schedule.save()

      const isSignificantChange = 
        (data.scheduleDate && oldDate !== schedule.scheduleDate?.toISODate()) ||
        (data.plannedQuantity !== undefined && oldQty > 0 && Math.abs((oldQty - data.plannedQuantity) / oldQty) > 0.2)

      if (isSignificantChange) {
        await RiskLog.create({
          workOrderId: schedule.workOrderId,
          riskLevel: 'medium',
          riskType: 'schedule_adjustment',
          description: `排产计划调整：${data.reason || '未填写原因'}，原计划：${oldDate} ${oldQty}件，调整后：${schedule.scheduleDate?.toISODate()} ${schedule.plannedQuantity}件`,
          actionBy: auth.user?.id,
          actionAt: DateTime.now(),
          status: 'open',
        })
      }

      try {
        await Redis.del(`schedules:*`)
      } catch (e) {}

      return response.ok({
        message: '排产调整成功',
        data: schedule.serialize(),
      })
    } catch (error) {
      const err = error as any
      if (err.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: '排产计划不存在' })
      }
      throw error
    }
  }
}
