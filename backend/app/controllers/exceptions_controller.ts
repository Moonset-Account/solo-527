import type { HttpContext } from '@adonisjs/core/http'
import ExceptionRecord from '#models/exception_record'
import { schema, rules } from '@adonisjs/validator'

export default class ExceptionsController {
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const storeId = request.input('store_id')
    const type = request.input('type')
    const status = request.input('status')

    const query = ExceptionRecord.query()
      .preload('creator')
      .preload('handler')
      .preload('lossReason')
      .preload('ingredient')

    if (user.storeId) {
      query.where('storeId', user.storeId)
    } else if (storeId) {
      query.where('storeId', storeId)
    }

    if (type) {
      query.where('type', type)
    }
    if (status) {
      query.where('status', status)
    }

    query.orderBy('id', 'desc')

    const exceptions = await query.paginate(page, limit)
    return response.ok(exceptions)
  }

  async show({ params, response }: HttpContext) {
    const exception = await ExceptionRecord.query()
      .where('id', params.id)
      .preload('creator')
      .preload('handler')
      .preload('lossReason')
      .preload('ingredient')
      .preload('store')
      .firstOrFail()

    return response.ok(exception)
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const data = await request.validateUsing(
      schema.create({
        storeId: schema.number(),
        type: schema.enum(['loss', 'damage', 'complaint', 'equipment', 'other']),
        lossReasonId: schema.number.optional(),
        title: schema.string([rules.maxLength(200)]),
        description: schema.string(),
        lossAmount: schema.number.optional(),
        ingredientId: schema.number.optional(),
        ingredientQuantity: schema.number.optional(),
      })
    )

    const exception = await ExceptionRecord.create({
      ...data,
      createdBy: user.id,
      status: 'pending',
    })

    await exception.load('creator')
    await exception.load('lossReason')

    return response.created(exception)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const exception = await ExceptionRecord.findOrFail(params.id)

    const data = await request.validateUsing(
      schema.create({
        title: schema.string.optional([rules.maxLength(200)]),
        description: schema.string.optional(),
        status: schema.enum.optional(['pending', 'processing', 'resolved', 'closed']),
        handlingResult: schema.string.optional(),
        lossAmount: schema.number.optional(),
        ingredientId: schema.number.optional(),
        ingredientQuantity: schema.number.optional(),
        lossReasonId: schema.number.optional(),
        note: schema.string.optional(),
      })
    )

    const updateData: any = { ...data }
    delete updateData.note

    if ((data.status === 'resolved' || data.status === 'closed') && !exception.handledAt) {
      updateData.handledAt = new Date()
      updateData.handledBy = user.id
    }

    if (data.status && exception.status !== data.status) {
      updateData.status = data.status
    }

    exception.merge(updateData)
    await exception.save()

    await exception.load('creator')
    await exception.load('handler')
    await exception.load('lossReason')
    await exception.load('ingredient')

    return response.ok(exception)
  }
}
