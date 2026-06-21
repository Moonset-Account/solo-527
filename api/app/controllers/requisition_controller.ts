import Requisition from '#models/requisition'
import RequisitionItem from '#models/requisition_item'
import { RequisitionService } from '#services/requisition_service'
import { CacheService } from '#services/cache_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class RequisitionController {
  private requisitionService = new RequisitionService()
  private cacheService = new CacheService()

  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const status = request.input('status')

    const query = Requisition.query().preload('applicant').preload('project').preload('items')

    if (status) {
      query.where('status', status)
    }

    const requisitions = await query.orderBy('created_at', 'desc').paginate(page, limit)
    return response.ok(requisitions)
  }

  async store({ request, response, auth }: HttpContext) {
    const { projectId, purpose, items } = request.only(['projectId', 'purpose', 'items'])

    const user = auth.getUserOrFail()

    const stockErrors = await this.requisitionService.validateStock(items)
    if (stockErrors.length > 0) {
      return response.badRequest({ message: '库存校验失败', errors: stockErrors })
    }

    let totalAmount = 0
    for (const item of items) {
      totalAmount += Number(item.unitPrice) * item.quantity
    }

    const budgetError = await this.requisitionService.validateBudget(projectId, totalAmount)
    if (budgetError) {
      return response.badRequest({ message: budgetError })
    }

    const requisition = await Requisition.create({
      applicantId: user.id,
      projectId,
      purpose,
      status: 'pending',
    })

    const requisitionItems = items.map((item: any) => ({
      requisitionId: requisition.id,
      reagentId: item.reagentId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }))

    await RequisitionItem.createMany(requisitionItems)

    await this.cacheService.invalidate('inventory')

    await requisition.load('items')
    return response.created(requisition)
  }

  async review({ params, request, response, auth }: HttpContext) {
    const { approved, comment } = request.only(['approved', 'comment'])
    const user = auth.getUserOrFail()

    try {
      const requisition = await this.requisitionService.processApproval(
        params.id,
        user.id,
        approved,
        comment
      )
      await this.cacheService.invalidate('inventory')
      return response.ok(requisition)
    } catch (err: any) {
      return response.badRequest({ message: err.message })
    }
  }

  async show({ params, response }: HttpContext) {
    const requisition = await Requisition.query()
      .where('id', params.id)
      .preload('applicant')
      .preload('project')
      .preload('reviewer')
      .preload('items', (query) => {
        query.preload('reagent')
      })
      .first()

    if (!requisition) {
      return response.notFound({ message: '申请单未找到' })
    }

    return response.ok(requisition)
  }
}
