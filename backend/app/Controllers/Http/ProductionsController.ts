import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ProductionLog from 'App/Models/ProductionLog'
import WorkOrder from 'App/Models/WorkOrder'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ProductionsController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const workOrderId = request.input('workOrderId', '')
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')
    const workshop = request.input('workshop', '')
    const shift = request.input('shift', '')

    const query = ProductionLog.query()
      .preload('workOrder')
      .preload('recorder')
      .if(workOrderId, (q) => {
        q.where('work_order_id', workOrderId)
      })
      .if(startDate, (q) => {
        q.where('production_date', '>=', startDate)
      })
      .if(endDate, (q) => {
        q.where('production_date', '<=', endDate)
      })
      .if(workshop, (q) => {
        q.where('workshop', workshop)
      })
      .if(shift, (q) => {
        q.where('shift', shift)
      })
      .orderBy('production_date', 'desc')

    const logs = await query.paginate(page, perPage)

    return response.ok({
      data: logs.serialize(),
    })
  }

  public async show({ params, response }: HttpContextContract) {
    try {
      const log = await ProductionLog.findOrFail(params.id)
      await log.load('workOrder')
      await log.load('recorder')

      return response.ok({
        data: log.serialize(),
      })
    } catch (error) {
      return response.notFound({ message: '生产记录不存在' })
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const logSchema = schema.create({
      workOrderId: schema.number([
        rules.exists({ table: 'work_orders', column: 'id' }),
      ]),
      scheduleId: schema.number.optional([
        rules.exists({ table: 'schedules', column: 'id' }),
      ]),
      productionDate: schema.date(),
      outputQuantity: schema.number([
        rules.unsigned(),
      ]),
      defectQuantity: schema.number.optional([
        rules.unsigned(),
      ]),
      workHours: schema.number.optional([
        rules.unsigned(),
      ]),
      manHours: schema.number.optional([
        rules.unsigned(),
      ]),
      operatorCount: schema.number.optional([
        rules.unsigned(),
      ]),
      shift: schema.string.optional(),
      workshop: schema.string.optional(),
      remarks: schema.string.optional(),
    })

    const data = await request.validate({ schema: logSchema })

    const log = new ProductionLog()
    log.workOrderId = data.workOrderId
    log.scheduleId = data.scheduleId || null
    log.productionDate = DateTime.fromJSDate(data.productionDate)
    log.outputQuantity = data.outputQuantity
    log.defectQuantity = data.defectQuantity || 0
    log.workHours = data.workHours || 0
    log.manHours = data.manHours || 0
    log.operatorCount = data.operatorCount || 0
    log.shift = data.shift || null
    log.workshop = data.workshop || null
    log.recordedBy = auth.user?.id || null
    log.remarks = data.remarks || null

    await log.save()

    const workOrder = await WorkOrder.find(data.workOrderId)
    if (workOrder) {
      workOrder.completedQuantity += data.outputQuantity
      if (workOrder.completedQuantity >= workOrder.quantity && workOrder.status === 'in_production') {
        workOrder.status = 'completed'
        workOrder.actualEndDate = DateTime.now()
      }
      await workOrder.save()
    }

    return response.created({
      message: '生产记录创建成功',
      data: log.serialize(),
    })
  }

  public async update({ params, request, response }: HttpContextContract) {
    try {
      const log = await ProductionLog.findOrFail(params.id)
      const oldOutput = log.outputQuantity

      const logSchema = schema.create({
        productionDate: schema.date.optional(),
        outputQuantity: schema.number.optional([
          rules.unsigned(),
        ]),
        defectQuantity: schema.number.optional([
          rules.unsigned(),
        ]),
        workHours: schema.number.optional([
          rules.unsigned(),
        ]),
        manHours: schema.number.optional([
          rules.unsigned(),
        ]),
        operatorCount: schema.number.optional([
          rules.unsigned(),
        ]),
        shift: schema.string.optional(),
        workshop: schema.string.optional(),
        remarks: schema.string.optional(),
      })

      const data = await request.validate({ schema: logSchema })

      if (data.productionDate !== undefined) log.productionDate = DateTime.fromJSDate(data.productionDate)
      if (data.outputQuantity !== undefined) log.outputQuantity = data.outputQuantity
      if (data.defectQuantity !== undefined) log.defectQuantity = data.defectQuantity
      if (data.workHours !== undefined) log.workHours = data.workHours
      if (data.manHours !== undefined) log.manHours = data.manHours
      if (data.operatorCount !== undefined) log.operatorCount = data.operatorCount
      if (data.shift !== undefined) log.shift = data.shift
      if (data.workshop !== undefined) log.workshop = data.workshop
      if (data.remarks !== undefined) log.remarks = data.remarks

      await log.save()

      if (data.outputQuantity !== undefined && oldOutput !== data.outputQuantity) {
        const workOrder = await WorkOrder.find(log.workOrderId)
        if (workOrder) {
          workOrder.completedQuantity = workOrder.completedQuantity - oldOutput + data.outputQuantity
          await workOrder.save()
        }
      }

      return response.ok({
        message: '生产记录更新成功',
        data: log.serialize(),
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: '生产记录不存在' })
      }
      throw error
    }
  }

  public async destroy({ params, response }: HttpContextContract) {
    try {
      const log = await ProductionLog.findOrFail(params.id)
      const outputQty = log.outputQuantity

      const workOrder = await WorkOrder.find(log.workOrderId)
      if (workOrder) {
        workOrder.completedQuantity = Math.max(0, workOrder.completedQuantity - outputQty)
        await workOrder.save()
      }

      await log.delete()

      return response.ok({
        message: '生产记录删除成功',
      })
    } catch (error) {
      return response.notFound({ message: '生产记录不存在' })
    }
  }

  public async summary({ request, response }: HttpContextContract) {
    const startDate = request.input('startDate', DateTime.now().minus({ days: 7 }).toISODate())
    const endDate = request.input('endDate', DateTime.now().toISODate())
    const groupBy = request.input('groupBy', 'day')

    const query = ProductionLog.query()
      .whereBetween('production_date', [startDate, endDate])
      .select(
        Database.raw(`DATE_TRUNC('${groupBy}', production_date) as period`),
        Database.raw('SUM(output_quantity) as total_output'),
        Database.raw('SUM(defect_quantity) as total_defect'),
        Database.raw('SUM(work_hours) as total_work_hours'),
        Database.raw('SUM(man_hours) as total_man_hours'),
        Database.raw('COUNT(*) as record_count')
      )
      .groupBy('period')
      .orderBy('period', 'asc')

    const results = await query

    const dailyData = results.map((row) => ({
      period: row.$extras.period,
      totalOutput: parseInt(row.$extras.total_output),
      totalDefect: parseInt(row.$extras.total_defect),
      totalWorkHours: parseFloat(row.$extras.total_work_hours),
      totalManHours: parseFloat(row.$extras.total_man_hours),
      defectRate: row.$extras.total_output > 0 
        ? (parseInt(row.$extras.total_defect) / parseInt(row.$extras.total_output) * 100).toFixed(2)
        : '0.00',
    }))

    const total = dailyData.reduce(
      (acc, item) => ({
        totalOutput: acc.totalOutput + item.totalOutput,
        totalDefect: acc.totalDefect + item.totalDefect,
        totalWorkHours: acc.totalWorkHours + item.totalWorkHours,
        totalManHours: acc.totalManHours + item.totalManHours,
      }),
      { totalOutput: 0, totalDefect: 0, totalWorkHours: 0, totalManHours: 0 }
    )

    return response.ok({
      dailyData,
      summary: {
        ...total,
        defectRate: total.totalOutput > 0 
          ? (total.totalDefect / total.totalOutput * 100).toFixed(2)
          : '0.00',
      },
    })
  }

  public async workHoursStats({ request, response }: HttpContextContract) {
    const startDate = request.input('startDate', DateTime.now().minus({ months: 1 }).toISODate())
    const endDate = request.input('endDate', DateTime.now().toISODate())
    const workshop = request.input('workshop', '')

    const query = ProductionLog.query()
      .whereBetween('production_date', [startDate, endDate])
      .if(workshop, (q) => q.where('workshop', workshop))
      .select(
        'workshop',
        Database.raw('SUM(output_quantity) as total_output'),
        Database.raw('SUM(work_hours) as total_work_hours'),
        Database.raw('SUM(man_hours) as total_man_hours'),
        Database.raw('SUM(operator_count) as total_operators')
      )
      .groupBy('workshop')
      .orderBy('workshop', 'asc')

    const results = await query

    const stats = results.map((row) => ({
      workshop: row.workshop || '未指定',
      totalOutput: parseInt(row.$extras.total_output),
      totalWorkHours: parseFloat(row.$extras.total_work_hours),
      totalManHours: parseFloat(row.$extras.total_man_hours),
      efficiency: row.$extras.total_work_hours > 0
        ? (parseInt(row.$extras.total_output) / parseFloat(row.$extras.total_work_hours)).toFixed(2)
        : '0.00',
    }))

    return response.ok({
      data: stats,
    })
  }
}
