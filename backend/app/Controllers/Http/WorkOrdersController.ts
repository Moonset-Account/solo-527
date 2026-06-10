import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import WorkOrder from 'App/Models/WorkOrder'
import WorkOrderMaterial from 'App/Models/WorkOrderMaterial'
import WorkOrderValidator from 'App/Validators/WorkOrder/WorkOrderValidator'
import RiskLog from 'App/Models/RiskLog'
import { DateTime } from 'luxon'

export default class WorkOrdersController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const keyword = request.input('keyword', '')
    const status = request.input('status', '')
    const priority = request.input('priority', '')
    const assignedTo = request.input('assignedTo', '')
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')
    const dateField = request.input('dateField', 'delivery_date')

    const query = WorkOrder.query()
      .preload('assignee')
      .preload('creator')
      .preload('materials')
      .if(keyword, (q) => {
        q.where((subQ) => {
          subQ.where('order_no', 'like', `%${keyword}%`)
            .orWhere('product_name', 'like', `%${keyword}%`)
            .orWhere('customer_name', 'like', `%${keyword}%`)
        })
      })
      .if(status, (q) => {
        q.where('status', status)
      })
      .if(priority, (q) => {
        q.where('priority', priority)
      })
      .if(assignedTo, (q) => {
        q.where('assigned_to', assignedTo)
      })
      .if(startDate && endDate, (q) => {
        q.whereBetween(dateField, [startDate, endDate])
      })
      .if(startDate && !endDate, (q) => {
        q.where(dateField, '>=', startDate)
      })
      .if(!startDate && endDate, (q) => {
        q.where(dateField, '<=', endDate)
      })
      .orderBy('priority', 'desc')
      .orderBy('delivery_date', 'asc')

    const workOrders = await query.paginate(page, perPage)

    return response.ok({
      data: workOrders.serialize(),
    })
  }

  public async show({ params, response }: HttpContextContract) {
    try {
      const workOrder = await WorkOrder.findOrFail(params.id)
      await workOrder.load('assignee')
      await workOrder.load('creator')
      await workOrder.load('materials', (query) => {
        query.preload('material')
      })
      await workOrder.load('schedules', (query) => {
        query.orderBy('schedule_date', 'asc')
      })
      await workOrder.load('reworks')
      await workOrder.load('productionLogs', (query) => {
        query.orderBy('production_date', 'desc').limit(10)
      })
      await workOrder.load('riskLogs', (query) => {
        query.orderBy('created_at', 'desc').limit(10)
      })

      return response.ok({
        data: workOrder.serialize(),
      })
    } catch (error) {
      return response.notFound({ message: '工单不存在' })
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const data = await request.validate(WorkOrderValidator)

    const workOrder = new WorkOrder()
    workOrder.orderNo = data.orderNo
    workOrder.productName = data.productName
    workOrder.productModel = data.productModel || null
    workOrder.quantity = data.quantity
    workOrder.customerName = data.customerName || null
    workOrder.priority = data.priority
    workOrder.status = data.status || 'pending'
    workOrder.plannedStartDate = data.plannedStartDate ? DateTime.fromJSDate(data.plannedStartDate) : null
    workOrder.plannedEndDate = data.plannedEndDate ? DateTime.fromJSDate(data.plannedEndDate) : null
    workOrder.deliveryDate = data.deliveryDate ? DateTime.fromJSDate(data.deliveryDate) : null
    workOrder.assignedTo = data.assignedTo || null
    workOrder.remarks = data.remarks || null
    workOrder.createdBy = auth.user!.id

    await workOrder.save()

    return response.created({
      message: '工单创建成功',
      data: workOrder.serialize(),
    })
  }

  public async update({ params, request, response, auth }: HttpContextContract) {
    try {
      const workOrder = await WorkOrder.findOrFail(params.id)
      const oldStatus = workOrder.status
      const oldDeliveryDate = workOrder.deliveryDate

      const data = await request.validate(WorkOrderValidator)

      workOrder.orderNo = data.orderNo
      workOrder.productName = data.productName
      workOrder.productModel = data.productModel || null
      workOrder.quantity = data.quantity
      workOrder.customerName = data.customerName || null
      workOrder.priority = data.priority
      workOrder.plannedStartDate = data.plannedStartDate ? DateTime.fromJSDate(data.plannedStartDate) : null
      workOrder.plannedEndDate = data.plannedEndDate ? DateTime.fromJSDate(data.plannedEndDate) : null
      workOrder.deliveryDate = data.deliveryDate ? DateTime.fromJSDate(data.deliveryDate) : null
      workOrder.assignedTo = data.assignedTo || null
      workOrder.remarks = data.remarks || null

      if (data.status !== undefined) {
        workOrder.status = data.status
      }

      await workOrder.save()

      const isStatusChanged = oldStatus !== workOrder.status
      const isDeliveryDateChanged = oldDeliveryDate?.toISODate() !== workOrder.deliveryDate?.toISODate()

      if (isStatusChanged && workOrder.status === 'delayed') {
        await RiskLog.create({
          workOrderId: workOrder.id,
          riskLevel: 'high',
          riskType: 'delivery_delay',
          description: `工单状态变更为延期`,
          actionBy: auth.user?.id,
          actionAt: DateTime.now(),
          status: 'open',
        })
      }

      if (isDeliveryDateChanged && workOrder.deliveryDate) {
        const daysUntilDelivery = workOrder.deliveryDate.diff(DateTime.now(), 'days').days
        if (daysUntilDelivery < 3) {
          await RiskLog.create({
            workOrderId: workOrder.id,
            riskLevel: daysUntilDelivery < 1 ? 'critical' : 'high',
            riskType: 'delivery_deadline',
            description: `交期调整，距离交期仅剩 ${Math.floor(daysUntilDelivery)} 天`,
            actionBy: auth.user?.id,
            actionAt: DateTime.now(),
            status: 'open',
          })
        }
      }

      return response.ok({
        message: '工单更新成功',
        data: workOrder.serialize(),
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: '工单不存在' })
      }
      throw error
    }
  }

  public async destroy({ params, response }: HttpContextContract) {
    try {
      const workOrder = await WorkOrder.findOrFail(params.id)
      await workOrder.delete()

      return response.ok({
        message: '工单删除成功',
      })
    } catch (error) {
      return response.notFound({ message: '工单不存在' })
    }
  }

  public async updateStatus({ params, request, response, auth }: HttpContextContract) {
    try {
      const workOrder = await WorkOrder.findOrFail(params.id)
      const oldStatus = workOrder.status

      const statusSchema = schema => schema.create({
        status: schema.enum([
          'pending', 'scheduled', 'in_production', 'completed', 'delayed', 'cancelled'
        ]),
        remark: schema.string.optional(),
      })

      const data = await request.validate({ schema: statusSchema(schema) })

      workOrder.status = data.status

      if (data.status === 'in_production' && !workOrder.actualStartDate) {
        workOrder.actualStartDate = DateTime.now()
      }

      if (data.status === 'completed' && !workOrder.actualEndDate) {
        workOrder.actualEndDate = DateTime.now()
        workOrder.completedQuantity = workOrder.quantity
      }

      await workOrder.save()

      if (data.status === 'delayed' && oldStatus !== 'delayed') {
        await RiskLog.create({
          workOrderId: workOrder.id,
          riskLevel: 'high',
          riskType: 'status_change_delayed',
          description: `工单状态从 ${oldStatus} 变更为延期`,
          actionBy: auth.user?.id,
          actionAt: DateTime.now(),
          status: 'open',
        })
      }

      return response.ok({
        message: '状态更新成功',
        data: workOrder.serialize(),
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: '工单不存在' })
      }
      throw error
    }
  }

  public async getMaterials({ params, response }: HttpContextContract) {
    try {
      const workOrder = await WorkOrder.findOrFail(params.id)
      const materials = await WorkOrderMaterial.query()
        .where('work_order_id', params.id)
        .preload('material')
        .orderBy('id', 'asc')

      const allReady = materials.length > 0 && materials.every((m) => m.isReady)

      return response.ok({
        data: materials,
        allReady,
        readyCount: materials.filter((m) => m.isReady).length,
        totalCount: materials.length,
      })
    } catch (error) {
      return response.notFound({ message: '工单不存在' })
    })
  }
}
