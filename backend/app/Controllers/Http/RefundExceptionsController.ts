import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import RefundException from 'App/Models/RefundException'
import RevisionService from 'App/Services/RevisionService'
import WarningService from 'App/Services/WarningService'
import { schema } from '@ioc:Adonis/Core/Validator'
import { DateTime } from 'luxon'

export default class RefundExceptionsController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const status = request.input('status')
    const exceptionType = request.input('exceptionType')
    const handlerId = request.input('handlerId')
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')
    const minAmount = request.input('minAmount')
    const maxAmount = request.input('maxAmount')

    const query = RefundException.query()
      .preload('order')
      .preload('subscription')
      .preload('reporter')
      .preload('handler')

    if (status) query.where('status', status)
    if (exceptionType) query.where('exceptionType', exceptionType)
    if (handlerId) query.where('handlerId', handlerId)
    if (startDate) query.where('createdAt', '>=', startDate)
    if (endDate) query.where('createdAt', '<=', endDate)
    if (minAmount) query.where('refundAmount', '>=', Number(minAmount))
    if (maxAmount) query.where('refundAmount', '<=', Number(maxAmount))

    const refunds = await query.orderBy('createdAt', 'desc').paginate(page, perPage)
    return response.json(refunds)
  }

  public async show({ params, response }: HttpContextContract) {
    const refund = await RefundException.query()
      .where('id', params.id)
      .preload('order', (q) => q.preload('user'))
      .preload('subscription', (q) => q.preload('plan'))
      .preload('reporter')
      .preload('handler')
      .firstOrFail()

    const history = await RevisionService.getHistory('refund_exception', refund.id)
    return response.json({ ...refund.toJSON(), history })
  }

  public async update({ params, request, response, auth }: HttpContextContract) {
    const refund = await RefundException.findOrFail(params.id)
    const beforeData = refund.toJSON()

    const validationSchema = schema.create({
      status: schema.string.optional(),
      handlerConclusion: schema.string.optional(),
      handlerId: schema.number.optional(),
    })

    const data = await request.validate({ schema: validationSchema })

    if (data.handlerConclusion && !refund.handlerId) {
      data.handlerId = auth.user?.id
    }

    if ((data.status === 'completed' || data.status === 'approved' || data.status === 'rejected') && !refund.handledAt) {
      refund.handledAt = DateTime.now()
    }

    refund.merge(data)
    await refund.save()

    await RevisionService.log(
      'refund_exception',
      refund.id,
      beforeData,
      refund.toJSON(),
      auth.user?.id,
      '更新退款异常'
    )

    return response.json(refund)
  }

  public async process({ params, request, response, auth }: HttpContextContract) {
    const refund = await RefundException.findOrFail(params.id)
    const beforeData = refund.toJSON()

    const validationSchema = schema.create({
      status: schema.enum(['approved', 'rejected', 'completed']),
      handlerConclusion: schema.string(),
    })

    const data = await request.validate({ schema: validationSchema })

    refund.merge({
      ...data,
      handlerId: auth.user!.id,
      handledAt: DateTime.now(),
    })
    await refund.save()

    if (refund.order) {
      const order = refund.order
      order.paymentStatus = 'refunded'
      await order.save()
    }

    await RevisionService.log(
      'refund_exception',
      refund.id,
      beforeData,
      refund.toJSON(),
      auth.user?.id,
      `处理退款异常：${data.status}`
    )

    await WarningService.create(
      'refund_exception',
      'info',
      `退款异常 #${refund.id} 已处理`,
      `处理结论：${data.handlerConclusion}`,
      refund.id,
      'refund_exception'
    )

    return response.json({ message: '处理成功', refund })
  }
}
