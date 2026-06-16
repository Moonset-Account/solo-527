import BillingCycle from '#models/billing_cycle'
import OperationLog from '#models/operation_log'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class BillingCyclesController {
  async index({ request, auth, serialize }: HttpContext) {
    const { status } = request.qs()

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

    return serialize(cycles)
  }

  async store({ request, auth, serialize }: HttpContext) {
    const { name, cycleType, dayOfMonth, status } = request.body()

    const cycle = new BillingCycle()
    cycle.name = name
    cycle.cycleType = cycleType || 'monthly'
    cycle.dayOfMonth = dayOfMonth || null
    cycle.isDefault = false
    cycle.status = status || 'active'

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
      details: { name, cycleType, dayOfMonth, status },
    })

    return serialize(cycle)
  }

  async update({ request, auth, serialize }: HttpContext) {
    const id = request.param('id')
    const { name, cycleType, dayOfMonth, status } = request.body()

    const cycle = await BillingCycle.findOrFail(id)
    const oldData = cycle.toJSON()

    if (name !== undefined) {
      cycle.name = name
    }

    if (cycleType !== undefined) {
      cycle.cycleType = cycleType
    }

    if (dayOfMonth !== undefined) {
      cycle.dayOfMonth = dayOfMonth
    }

    if (status !== undefined) {
      cycle.status = status
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
        newData: { name, cycleType, dayOfMonth, status },
      },
    })

    return serialize(cycle)
  }

  async destroy({ request, response, auth, serialize }: HttpContext) {
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

    return serialize({
      message: '账期删除成功',
    })
  }

  async setDefault({ request, auth, serialize }: HttpContext) {
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

    return serialize({
      message: '已设为默认账期',
      cycle,
    })
  }
}
