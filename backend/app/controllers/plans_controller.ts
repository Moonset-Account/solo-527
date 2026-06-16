import Plan from '#models/plan'
import OperationLog from '#models/operation_log'
import { createPlanValidator, updatePlanValidator, queryPlanValidator } from '#validators/plan_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class PlansController {
  async index({ request, auth }: HttpContext) {
    const {
      page = 1,
      perPage = 20,
      status,
      keyword,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
    } = await request.validateUsing(queryPlanValidator)

    const query = Plan.query()

    if (status) {
      query.where('status', status)
    }

    if (keyword) {
      query.where((subquery) => {
        subquery
          .where('name', 'like', `%${keyword}%`)
          .orWhere('code', 'like', `%${keyword}%`)
      })
    }

    const sortColumn = sortBy === 'sortOrder' ? 'sortOrder' : sortBy
    query.orderBy(sortColumn, sortOrder as 'asc' | 'desc')

    const plans = await query.paginate(page, perPage)

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_plans',
      resourceType: 'plan',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { page, perPage, keyword, status },
    })

    return {
      data: plans.toJSON().data,
      meta: {
        total: plans.total,
        page: plans.currentPage,
        perPage: plans.perPage,
        lastPage: plans.lastPage,
      },
    }
  }

  async show({ params, request, auth }: HttpContext) {
    const plan = await Plan.findOrFail(params.id)

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_plan',
      resourceType: 'plan',
      resourceId: plan.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { planCode: plan.code, planName: plan.name },
    })

    return plan
  }

  async store({ request, auth }: HttpContext) {
    const data = await request.validateUsing(createPlanValidator)

    const plan = await Plan.create({
      ...data,
      status: data.status || 'active',
      sortOrder: data.sortOrder || 0,
    })

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'create_plan',
      resourceType: 'plan',
      resourceId: plan.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { ...data },
    })

    return plan
  }

  async update({ params, request, auth }: HttpContext) {
    const plan = await Plan.findOrFail(params.id)
    const data = await request.validateUsing(updatePlanValidator)

    const oldData = plan.toJSON()
    plan.merge(data)
    await plan.save()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'update_plan',
      resourceType: 'plan',
      resourceId: plan.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { old: oldData, new: data },
    })

    return plan
  }

  async destroy({ params, auth, request }: HttpContext) {
    const plan = await Plan.findOrFail(params.id)
    await plan.delete()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'delete_plan',
      resourceType: 'plan',
      resourceId: plan.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { planCode: plan.code, planName: plan.name },
    })

    return {
      message: '套餐删除成功',
    }
  }
}
