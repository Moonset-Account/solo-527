import type { HttpContext } from '@adonisjs/core/http'
import ProcessRecord from '#models/process_record'
import { schema, rules } from '@adonisjs/validator'
import { DateTime } from 'luxon'

export default class ProcessRecordsController {
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const storeId = request.input('store_id')
    const type = request.input('type')
    const status = request.input('status')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')
    const createdBy = request.input('created_by')

    const query = ProcessRecord.query()
      .preload('creator')
      .preload('handler')
      .preload('store')

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
    if (startDate) {
      query.where('createdAt', '>=', DateTime.fromISO(startDate).toJSDate())
    }
    if (endDate) {
      query.where('createdAt', '<=', DateTime.fromISO(endDate).endOf('day').toJSDate())
    }
    if (createdBy) {
      query.where('createdBy', createdBy)
    }

    query.orderBy('createdAt', 'desc')
    query.orderBy('id', 'desc')

    const records = await query.paginate(page, limit)
    return response.ok(records)
  }

  async show({ params, response }: HttpContext) {
    const record = await ProcessRecord.query()
      .where('id', params.id)
      .preload('creator')
      .preload('handler')
      .preload('store')
      .firstOrFail()

    return response.ok(record)
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const data = await request.validateUsing(
      schema.create({
        storeId: schema.number(),
        type: schema.enum(['inspection', 'cash_flow', 'inventory_log', 'other']),
        title: schema.string([rules.maxLength(200)]),
        description: schema.string.optional(),
        data: schema.object.optional().anyMembers(),
        relatedId: schema.number.optional(),
        relatedType: schema.string.optional(),
        amount: schema.number.optional(),
        status: schema.enum.optional(['pending', 'processing', 'completed', 'cancelled']),
        handledBy: schema.number.optional(),
      })
    )

    const record = await ProcessRecord.create({
      ...data,
      createdBy: user.id,
      status: data.status || 'completed',
      handledAt: data.handledBy ? DateTime.now() : null,
      handledBy: data.handledBy || (data.status === 'completed' ? user.id : null),
    })

    await record.load('creator')
    await record.load('store')

    return response.created(record)
  }

  async update({ params, request, response, auth }: HttpContext) {
    const record = await ProcessRecord.findOrFail(params.id)
    const user = auth.getUserOrFail()

    const data = await request.validateUsing(
      schema.create({
        title: schema.string.optional([rules.maxLength(200)]),
        description: schema.string.optional(),
        data: schema.object.optional().anyMembers(),
        status: schema.enum.optional(['pending', 'processing', 'completed', 'cancelled']),
        handledBy: schema.number.optional(),
      })
    )

    const updateData: any = { ...data }
    if (data.status === 'completed' && !record.handledAt) {
      updateData.handledAt = DateTime.now()
      updateData.handledBy = data.handledBy || user.id
    }

    record.merge(updateData)
    await record.save()

    await record.load('creator')
    await record.load('handler')

    return response.ok(record)
  }

  async inspections({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const storeId = request.input('store_id')
    const status = request.input('status')

    const query = ProcessRecord.query()
      .where('type', 'inspection')
      .preload('creator')
      .preload('handler')
      .preload('store')

    if (user.storeId) {
      query.where('storeId', user.storeId)
    } else if (storeId) {
      query.where('storeId', storeId)
    }

    if (status) {
      query.where('status', status)
    }

    query.orderBy('createdAt', 'desc')

    const records = await query.paginate(page, limit)
    return response.ok(records)
  }

  async createInspection({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const data = await request.validateUsing(
      schema.create({
        storeId: schema.number(),
        title: schema.string([rules.maxLength(200)]),
        description: schema.string.optional(),
        inspectionItems: schema.array.optional().members(
          schema.object().members({
            name: schema.string(),
            result: schema.enum(['pass', 'fail', 'na']),
            remark: schema.string.optional(),
          })
        ),
        status: schema.enum.optional(['pending', 'processing', 'completed', 'cancelled']),
      })
    )

    const record = await ProcessRecord.create({
      storeId: data.storeId,
      type: 'inspection',
      title: data.title,
      description: data.description,
      data: {
        inspectionItems: data.inspectionItems || [],
      },
      status: data.status || 'completed',
      createdBy: user.id,
      handledAt: data.status === 'completed' ? DateTime.now() : null,
      handledBy: data.status === 'completed' ? user.id : null,
    })

    await record.load('creator')
    await record.load('store')

    return response.created(record)
  }

  async cashFlows({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const storeId = request.input('store_id')
    const status = request.input('status')

    const query = ProcessRecord.query()
      .where('type', 'cash_flow')
      .preload('creator')
      .preload('handler')
      .preload('store')

    if (user.storeId) {
      query.where('storeId', user.storeId)
    } else if (storeId) {
      query.where('storeId', storeId)
    }

    if (status) {
      query.where('status', status)
    }

    query.orderBy('createdAt', 'desc')

    const records = await query.paginate(page, limit)
    return response.ok(records)
  }

  async createCashFlow({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const data = await request.validateUsing(
      schema.create({
        storeId: schema.number(),
        title: schema.string([rules.maxLength(200)]),
        description: schema.string.optional(),
        amount: schema.number(),
        flowType: schema.enum(['income', 'expense']),
        category: schema.string.optional(),
        status: schema.enum.optional(['pending', 'processing', 'completed', 'cancelled']),
      })
    )

    const record = await ProcessRecord.create({
      storeId: data.storeId,
      type: 'cash_flow',
      title: data.title,
      description: data.description,
      amount: data.amount,
      data: {
        flowType: data.flowType,
        category: data.category,
      },
      status: data.status || 'completed',
      createdBy: user.id,
      handledAt: data.status === 'completed' ? DateTime.now() : null,
      handledBy: data.status === 'completed' ? user.id : null,
    })

    await record.load('creator')
    await record.load('store')

    return response.created(record)
  }

  async inventoryLogs({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const storeId = request.input('store_id')
    const status = request.input('status')

    const query = ProcessRecord.query()
      .where('type', 'inventory_log')
      .preload('creator')
      .preload('handler')
      .preload('store')

    if (user.storeId) {
      query.where('storeId', user.storeId)
    } else if (storeId) {
      query.where('storeId', storeId)
    }

    if (status) {
      query.where('status', status)
    }

    query.orderBy('createdAt', 'desc')

    const records = await query.paginate(page, limit)
    return response.ok(records)
  }

  async createInventoryLog({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const data = await request.validateUsing(
      schema.create({
        storeId: schema.number(),
        title: schema.string([rules.maxLength(200)]),
        description: schema.string.optional(),
        logType: schema.enum(['inbound', 'outbound', 'check', 'adjust']),
        ingredientId: schema.number.optional(),
        quantity: schema.number.optional(),
        items: schema.array.optional().members(
          schema.object().members({
            ingredientId: schema.number(),
            ingredientName: schema.string(),
            quantity: schema.number(),
            unit: schema.string.optional(),
            remark: schema.string.optional(),
          })
        ),
        status: schema.enum.optional(['pending', 'processing', 'completed', 'cancelled']),
      })
    )

    const record = await ProcessRecord.create({
      storeId: data.storeId,
      type: 'inventory_log',
      title: data.title,
      description: data.description,
      data: {
        logType: data.logType,
        ingredientId: data.ingredientId,
        quantity: data.quantity,
        items: data.items || [],
      },
      relatedId: data.ingredientId,
      relatedType: data.ingredientId ? 'ingredient' : null,
      amount: null,
      status: data.status || 'completed',
      createdBy: user.id,
      handledAt: data.status === 'completed' ? DateTime.now() : null,
      handledBy: data.status === 'completed' ? user.id : null,
    })

    await record.load('creator')
    await record.load('store')

    return response.created(record)
  }
}
