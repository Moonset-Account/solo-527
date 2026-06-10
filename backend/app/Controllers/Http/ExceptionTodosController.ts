import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ExceptionTodo from 'App/Models/ExceptionTodo'
import { DateTime } from 'luxon'

export default class ExceptionTodosController {
  public async index({ request, response }: HttpContextContract) {
    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 20))
    const status = request.input('status', '')
    const priority = request.input('priority', '')
    const type = request.input('type', '')

    let query = ExceptionTodo.query()
      .preload('booking')
      .preload('customer')
      .preload('assignee')
      .preload('handler')

    if (status) query.where('status', status)
    if (priority) query.where('priority', priority)
    if (type) query.where('type', type)

    query.orderByRaw("CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END")
    query.orderBy('created_at', 'desc')

    const data = await query.paginate(page, perPage)
    return response.ok({ data })
  }

  public async pendingCount({ response }: HttpContextContract) {
    const total = await ExceptionTodo.query().where('status', 'pending').count('* as total').first()
    const critical = await ExceptionTodo.query().where('status', 'pending').where('priority', 'critical').count('* as total').first()
    const high = await ExceptionTodo.query().where('status', 'pending').where('priority', 'high').count('* as total').first()
    const medium = await ExceptionTodo.query().where('status', 'pending').where('priority', 'medium').count('* as total').first()
    const low = await ExceptionTodo.query().where('status', 'pending').where('priority', 'low').count('* as total').first()

    const byType = await ExceptionTodo.query()
      .select('type')
      .where('status', 'pending')
      .groupBy('type')
      .count('* as count')

    return response.ok({
      data: {
        total: Number(total?.$extras.total || 0),
        byPriority: {
          critical: Number(critical?.$extras.total || 0),
          high: Number(high?.$extras.total || 0),
          medium: Number(medium?.$extras.total || 0),
          low: Number(low?.$extras.total || 0),
        },
        byType: byType.map((r: any) => ({
          type: r.type,
          count: Number(r.$extras.count),
        })),
      },
    })
  }

  public async store({ request, response }: HttpContextContract) {
    const data = request.only([
      'type', 'title', 'description', 'bookingId', 'customerId',
      'priority', 'assignedTo', 'deadlineAt',
    ])

    const todo = await ExceptionTodo.create({
      ...data,
      bookingId: data.bookingId ? Number(data.bookingId) : null,
      customerId: data.customerId ? Number(data.customerId) : null,
      assignedTo: data.assignedTo ? Number(data.assignedTo) : null,
      deadlineAt: data.deadlineAt ? DateTime.fromISO(data.deadlineAt) : null,
      status: 'pending',
    })

    await todo.load('booking')
    await todo.load('customer')
    return response.created({ data: todo, message: '异常待办创建成功' })
  }

  public async show({ params, response }: HttpContextContract) {
    const todo = await ExceptionTodo.query()
      .where('id', params.id)
      .preload('booking')
      .preload('customer')
      .preload('assignee')
      .preload('handler')
      .firstOrFail()
    return response.ok({ data: todo })
  }

  public async update({ params, request, response }: HttpContextContract) {
    const todo = await ExceptionTodo.findOrFail(params.id)
    const data = request.only([
      'type', 'title', 'description', 'bookingId', 'customerId',
      'priority', 'status', 'assignedTo', 'deadlineAt',
    ])
    todo.merge({
      ...data,
      bookingId: data.bookingId !== undefined ? (data.bookingId ? Number(data.bookingId) : null) : undefined,
      customerId: data.customerId !== undefined ? (data.customerId ? Number(data.customerId) : null) : undefined,
      assignedTo: data.assignedTo !== undefined ? (data.assignedTo ? Number(data.assignedTo) : null) : undefined,
      deadlineAt: data.deadlineAt ? DateTime.fromISO(data.deadlineAt) : undefined,
    })
    await todo.save()
    return response.ok({ data: todo, message: '异常待办更新成功' })
  }

  public async handle({ auth, params, request, response }: HttpContextContract) {
    const todo = await ExceptionTodo.findOrFail(params.id)
    const { resolution, status } = request.all()

    todo.status = status || 'resolved'
    todo.handledBy = auth.user?.id
    todo.handledAt = DateTime.now()
    if (resolution) {
      todo.resolution = resolution
    }
    await todo.save()

    await todo.load('handler')
    return response.ok({ data: todo, message: '异常待办处理完成' })
  }

  public async destroy({ params, response }: HttpContextContract) {
    const todo = await ExceptionTodo.findOrFail(params.id)
    await todo.delete()
    return response.ok({ message: '异常待办已删除' })
  }
}
