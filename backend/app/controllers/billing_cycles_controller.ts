import BillingCycle from '#models/billing_cycle'
import OperationLog from '#models/operation_log'
import {
  createBillingCycleValidator,
  updateBillingCycleValidator,
  queryBillingCycleValidator,
} from '#validators/billing_cycle_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class BillingCyclesController {
  async index({ request, auth }: HttpContext) {
    const { status } = await request.validateUsing(queryBillingCycleValidator)

    const query = BillingCycle.query()

    if (status) {
      query.where('status', status)
    }

    query.orderBy('isDefault', 'desc').orderBy('id', 'asc')

    const cycles = await query

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'view_billing_cycles',
      resourceType: 'billing_cycle',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { status },
    })

    return cycles
  }

  async store({ request, auth }: HttpContext) {
    const data = await request.validateUsing(createBillingCycleValidator)

    const cycle = new BillingCycle()
    cycle.name = data.name
    cycle.cycleType = data.cycleType || 'monthly'
    cycle.dayOfMonth = data.dayOfMonth || null
    cycle.isDefault = false
    cycle.status = data.status || 'active'

    await cycle.save()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'create_billing_cycle',
      resourceType: 'billing_cycle',
      resourceId: cycle.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { name: data.name, cycleType: data.cycleType, dayOfMonth: data.dayOfMonth, status: data.status },
    })

    return cycle
  }

  async update({ request, auth }: HttpContext) {
    const id = request.param('id')
    const data = await request.validateUsing(updateBillingCycleValidator)

    const cycle = await BillingCycle.findOrFail(id)
    const oldData = cycle.toJSON()

    if (data.name !== undefined) {
      cycle.name = data.name
    }

    if (data.cycleType !== undefined) {
      cycle.cycleType = data.cycleType
    }

    if (data.dayOfMonth !== undefined) {
      cycle.dayOfMonth = data.dayOfMonth
    }

    if (data.status !== undefined) {
      cycle.status = data.status
    }

    await cycle.save()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'update_billing_cycle',
      resourceType: 'billing_cycle',
      resourceId: cycle.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: {
        id,
        oldData,
        newData: data,
      },
    })

    return cycle
  }

  async destroy({ request, response, auth }: HttpContext) {
    const id = request.param('id')

    const cycle = await BillingCycle.findOrFail(id)

    if (cycle.isDefault) {
      return response.badRequest({ message: '默认账期不能删除' })
    }

    const cycleName = cycle.name
    await cycle.delete()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'delete_billing_cycle',
      resourceType: 'billing_cycle',
      resourceId: cycle.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { id, name: cycleName },
    })

    return {
      message: '账期删除成功',
    }
  }

  async setDefault({ request, auth }: HttpContext) {
    const id = request.param('id')

    const cycle = await BillingCycle.findOrFail(id)

    const trx = await db.transaction()

    try {
      await BillingCycle.query({ client: trx }).update({ isDefault: false })

      cycle.useTransaction(trx)
      cycle.isDefault = true
      await cycle.save()

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'set_default_billing_cycle',
      resourceType: 'billing_cycle',
      resourceId: cycle.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { id, name: cycle.name },
    })

    return {
      message: '已设为默认账期',
      cycle,
    }
  }
}
