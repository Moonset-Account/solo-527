import Plan from '#models/plan'
import OperationLogService from '#services/operation_log_service'
import { createPlanSchema, updatePlanSchema, queryPlanSchema } from '#validators/plan_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class PlansController {
  async index({ request }: HttpContext) {
    const {
      page = 1,
      perPage = 20,
      status,
      keyword,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
    } = await request.validateUsing(queryPlanSchema)

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

    const sortColumn = sortBy === 'sortOrder' ? 'sort_order' : sortBy
    query.orderBy(sortColumn, sortOrder as 'asc' | 'desc')

    const plans = await query.paginate(page, perPage)

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

  async show({ params }: HttpContext) {
    const plan = await Plan.findOrFail(params.id)
    return plan
  }

  async store({ request, auth }: HttpContext) {
    const data = await request.validateUsing(createPlanSchema)

    const plan = await Plan.create(data)

    await OperationLogService.log(
      { auth, request } as HttpContext,
      'create',
      'plan',
      plan.id,
      data
    )

    return plan
  }

  async update({ params, request, auth }: HttpContext) {
    const plan = await Plan.findOrFail(params.id)
    const data = await request.validateUsing(updatePlanSchema)

    const oldData = plan.toJSON()
    plan.merge(data)
    await plan.save()

    await OperationLogService.log(
      { auth, request } as HttpContext,
      'update',
      'plan',
      plan.id,
      { old: oldData, new: data }
    )

    return plan
  }

  async destroy({ params, auth, request }: HttpContext) {
    const plan = await Plan.findOrFail(params.id)

    plan.status = 'inactive'
    await plan.save()

    await OperationLogService.log(
      { auth, request } as HttpContext,
      'delete',
      'plan',
      plan.id,
      { planName: plan.name, planCode: plan.code }
    )

    return {
      message: 'Plan deactivated successfully',
    }
  }
}
